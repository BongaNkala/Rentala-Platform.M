import { eq, and, gte, lte, desc } from "drizzle-orm";
import { payments, leases, units, properties, tenants } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

const createPaymentSchema = z.object({
  leaseId: z.number().int().positive(),
  unitId: z.number().int().positive(),
  tenantId: z.number().int().positive(),
  amount: z.string().or(z.number()),
  dueDate: z.string(),
  paymentMethod: z.enum(["bank_transfer", "cash", "cheque", "card", "eft", "other"]).default("bank_transfer"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const recordPaymentSchema = z.object({
  id: z.number().int().positive(),
  paidDate: z.string(),
  amount: z.string().or(z.number()),
  paymentMethod: z.enum(["bank_transfer", "cash", "cheque", "card", "eft", "other"]),
  reference: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const paymentsRouter = router({
  // List all payments for a property
  listByProperty: protectedProcedure
    .input(z.object({ propertyId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check authorization
      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, input.propertyId))
        .limit(1);

      if (!property.length) {
        throw new Error("Property not found");
      }

      if (ctx.user?.role === "landlord" && property[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Get all leases for this property
      const propertyLeases = await db
        .select()
        .from(leases)
        .where(eq(leases.propertyId, input.propertyId));

      const leaseIds = propertyLeases.map(l => l.id);

      if (leaseIds.length === 0) {
        return [];
      }

      // For now, get payments from first lease
      // TODO: Implement proper IN clause support in Drizzle
      return await db
        .select()
        .from(payments)
        .where(eq(payments.leaseId, leaseIds[0]))
        .orderBy(desc(payments.dueDate));
    }),

  // List payments for a specific lease
  listByLease: protectedProcedure
    .input(z.object({ leaseId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(payments)
        .where(eq(payments.leaseId, input.leaseId))
        .orderBy(desc(payments.dueDate));
    }),

  // Get overdue payments
  getOverdue: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const today = new Date();

    return await db
      .select()
      .from(payments)
      .where(
        and(
          lte(payments.dueDate, today),
          eq(payments.status, "pending")
        )
      )
      .orderBy(desc(payments.dueDate));
  }),

  // Create a payment record (for rent due)
  create: protectedProcedure
    .input(createPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check authorization
      const lease = await db
        .select()
        .from(leases)
        .where(eq(leases.id, input.leaseId))
        .limit(1);

      if (!lease.length) {
        throw new Error("Lease not found");
      }

      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, lease[0].propertyId))
        .limit(1);

      if (ctx.user?.role === "landlord" && property[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const result = await db.insert(payments).values({
        leaseId: input.leaseId,
        unitId: input.unitId,
        tenantId: input.tenantId,
        amount: input.amount.toString(),
        dueDate: new Date(input.dueDate),
        paymentMethod: input.paymentMethod,
        reference: input.reference,
        notes: input.notes,
        status: "pending",
      });

      return result;
    }),

  // Record a payment (mark as paid)
  recordPayment: protectedProcedure
    .input(recordPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const payment = await db
        .select()
        .from(payments)
        .where(eq(payments.id, input.id))
        .limit(1);

      if (!payment.length) {
        throw new Error("Payment not found");
      }

      // Check authorization
      const lease = await db
        .select()
        .from(leases)
        .where(eq(leases.id, payment[0].leaseId))
        .limit(1);

      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, lease[0].propertyId))
        .limit(1);

      if (ctx.user?.role === "landlord" && property[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const paidAmount = parseFloat(input.amount.toString());
      const dueAmount = parseFloat(payment[0].amount.toString());

      const status = paidAmount >= dueAmount ? "paid" : "partial";

      await db
        .update(payments)
        .set({
          paidDate: new Date(input.paidDate),
          status,
          paymentMethod: input.paymentMethod,
          reference: input.reference,
          receiptUrl: input.receiptUrl,
        })
        .where(eq(payments.id, input.id));

      return { success: true, status };
    }),

  // Get payment summary for a property
  getSummary: protectedProcedure
    .input(z.object({ propertyId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check authorization
      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, input.propertyId))
        .limit(1);

      if (!property.length) {
        throw new Error("Property not found");
      }

      if (ctx.user?.role === "landlord" && property[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Get all leases for this property, then get their payments
      const propertyLeases = await db
        .select()
        .from(leases)
        .where(eq(leases.propertyId, input.propertyId));

      const leaseIds = propertyLeases.map(l => l.id);

      let allPayments: any[] = [];
      if (leaseIds.length > 0) {
        allPayments = await db
          .select()
          .from(payments)
          .where(eq(payments.leaseId, leaseIds[0]));
        
        for (let i = 1; i < leaseIds.length; i++) {
          const morePayments = await db
            .select()
            .from(payments)
            .where(eq(payments.leaseId, leaseIds[i]));
          allPayments = [...allPayments, ...morePayments];
        }
      }

      const totalDue = allPayments.reduce((sum, p) => {
        return sum + parseFloat(p.amount.toString());
      }, 0);

      const totalPaid = allPayments
        .filter(p => p.status === "paid")
        .reduce((sum, p) => {
          return sum + parseFloat(p.amount.toString());
        }, 0);

      const totalOverdue = allPayments
        .filter(p => p.status === "overdue" || p.status === "pending")
        .reduce((sum, p) => {
          return sum + parseFloat(p.amount.toString());
        }, 0);

      return {
        totalDue,
        totalPaid,
        totalOverdue,
        paymentCount: allPayments.length,
        paidCount: allPayments.filter(p => p.status === "paid").length,
        pendingCount: allPayments.filter(p => p.status === "pending").length,
        overdueCount: allPayments.filter(p => p.status === "overdue").length,
      };
    }),
});
