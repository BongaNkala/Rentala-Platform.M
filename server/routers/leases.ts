import { eq, and, gte, lte } from "drizzle-orm";
import { leases, units, properties, tenants } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

const createLeaseSchema = z.object({
  unitId: z.number().int().positive(),
  tenantId: z.number().int().positive(),
  propertyId: z.number().int().positive(),
  startDate: z.string(),
  endDate: z.string(),
  rentAmount: z.string().or(z.number()),
  deposit: z.string().or(z.number()).optional(),
  rentEscalation: z.string().or(z.number()).optional(),
  paymentDueDay: z.number().int().min(1).max(31).default(1),
  leaseTerms: z.string().optional(),
});

const updateLeaseSchema = createLeaseSchema.partial().extend({
  id: z.number().int().positive(),
  status: z.enum(["active", "expired", "terminated", "pending"]).optional(),
});

export const leasesRouter = router({
  // List all active leases
  listActive: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(leases)
      .where(eq(leases.status, "active"));
  }),

  // List leases for a specific property
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

      return await db
        .select()
        .from(leases)
        .where(eq(leases.propertyId, input.propertyId));
    }),

  // Get a single lease with tenant details
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const lease = await db
        .select()
        .from(leases)
        .where(eq(leases.id, input.id))
        .limit(1);

      if (!lease.length) {
        throw new Error("Lease not found");
      }

      // Get tenant details
      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, lease[0].tenantId))
        .limit(1);

      return {
        ...lease[0],
        tenant: tenant.length > 0 ? tenant[0] : null,
      };
    }),

  // Create a new lease
  create: protectedProcedure
    .input(createLeaseSchema)
    .mutation(async ({ ctx, input }) => {
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

      // Update unit status to occupied
      await db
        .update(units)
        .set({ status: "occupied" })
        .where(eq(units.id, input.unitId));

      const result = await db.insert(leases).values({
        unitId: input.unitId,
        tenantId: input.tenantId,
        propertyId: input.propertyId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        rentAmount: input.rentAmount.toString(),
        deposit: input.deposit ? input.deposit.toString() : undefined,
        rentEscalation: input.rentEscalation ? input.rentEscalation.toString() : "0.00",
        paymentDueDay: input.paymentDueDay,
        leaseTerms: input.leaseTerms,
        status: "active",
      });

      return result;
    }),

  // Update a lease
  update: protectedProcedure
    .input(updateLeaseSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      const lease = await db
        .select()
        .from(leases)
        .where(eq(leases.id, id))
        .limit(1);

      if (!lease.length) {
        throw new Error("Lease not found");
      }

      // Check authorization
      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, lease[0].propertyId))
        .limit(1);

      if (ctx.user?.role === "landlord" && property[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const updateValues: any = {};
      Object.keys(updateData).forEach(key => {
        const value = (updateData as any)[key];
        if (key === 'startDate' || key === 'endDate') {
          updateValues[key] = value ? new Date(value) : undefined;
        } else if (key === 'rentAmount' || key === 'deposit' || key === 'rentEscalation') {
          updateValues[key] = value ? value.toString() : undefined;
        } else if (value !== undefined) {
          updateValues[key] = value;
        }
      });

      await db.update(leases).set(updateValues).where(eq(leases.id, id));

      return { success: true };
    }),

  // Terminate a lease
  terminate: protectedProcedure
    .input(z.object({ 
      id: z.number().int().positive(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const lease = await db
        .select()
        .from(leases)
        .where(eq(leases.id, input.id))
        .limit(1);

      if (!lease.length) {
        throw new Error("Lease not found");
      }

      // Check authorization
      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, lease[0].propertyId))
        .limit(1);

      if (ctx.user?.role === "landlord" && property[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Update lease status
      await db
        .update(leases)
        .set({ status: "terminated" })
        .where(eq(leases.id, input.id));

      // Update unit status back to vacant
      await db
        .update(units)
        .set({ status: "vacant" })
        .where(eq(units.id, lease[0].unitId));

      return { success: true };
    }),

  // Get expiring leases (within 30 days)
  getExpiringLeases: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    return await db
      .select()
      .from(leases)
      .where(
        and(
          eq(leases.status, "active"),
          gte(leases.endDate, today),
          lte(leases.endDate, thirtyDaysFromNow)
        )
      );
  }),
});
