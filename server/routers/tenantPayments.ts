import { eq, and, lte, desc, asc } from 'drizzle-orm';
import { payments, leases, units, properties, tenants } from '../../drizzle/schema';
import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { createCheckoutSession } from '../services/stripeService';

export const tenantPaymentsRouter = router({
  // Get upcoming payments for tenant
  getUpcomingPayments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    try {
      // Get tenant's leases
      const tenantLeases = await db
        .select()
        .from(leases)
        .where(eq(leases.tenantId, ctx.user!.id));

      if (tenantLeases.length === 0) {
        return [];
      }

      const leaseIds = tenantLeases.map(l => l.id);

      // Get upcoming payments for tenant's leases
      const upcomingPayments = await db
        .select({
          payment: payments,
          lease: leases,
          unit: units,
          property: properties,
        })
        .from(payments)
        .innerJoin(leases, eq(payments.leaseId, leases.id))
        .innerJoin(units, eq(payments.unitId, units.id))
        .innerJoin(properties, eq(units.propertyId, properties.id))
        .where(
          and(
            eq(leases.tenantId, ctx.user!.id),
            eq(payments.status, 'pending')
          )
        )
        .orderBy(asc(payments.dueDate));

      return upcomingPayments.map(record => ({
        id: record.payment.id,
        amount: Number(record.payment.amount),
        dueDate: record.payment.dueDate,
        status: record.payment.status,
        propertyName: record.property.name,
        unitNumber: record.unit.unitNumber,
        leaseId: record.lease.id,
      }));
    } catch (error) {
      console.error('Error fetching upcoming payments:', error);
      throw error;
    }
  }),

  // Get payment history for tenant
  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    try {
      // Get tenant's leases
      const tenantLeases = await db
        .select()
        .from(leases)
        .where(eq(leases.tenantId, ctx.user!.id));

      if (tenantLeases.length === 0) {
        return [];
      }

      // Get payment history
      const paymentHistory = await db
        .select({
          payment: payments,
          unit: units,
          property: properties,
        })
        .from(payments)
        .innerJoin(leases, eq(payments.leaseId, leases.id))
        .innerJoin(units, eq(payments.unitId, units.id))
        .innerJoin(properties, eq(units.propertyId, properties.id))
        .where(
          and(
            eq(leases.tenantId, ctx.user!.id),
            eq(payments.status, 'paid')
          )
        )
        .orderBy(desc(payments.paidDate));

      return paymentHistory.map(record => ({
        id: record.payment.id,
        amount: Number(record.payment.amount),
        paidDate: record.payment.paidDate,
        status: record.payment.status,
        paymentMethod: record.payment.paymentMethod,
        receiptUrl: record.payment.receiptUrl,
        propertyName: record.property.name,
        unitNumber: record.unit.unitNumber,
      }));
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }),

  // Create payment checkout session
  createPaymentCheckout: protectedProcedure
    .input(
      z.object({
        paymentId: z.number().int().positive(),
        amount: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      try {
        // Get payment details
        const payment = await db
          .select({
            payment: payments,
            lease: leases,
            unit: units,
            property: properties,
            tenant: tenants,
          })
          .from(payments)
          .innerJoin(leases, eq(payments.leaseId, leases.id))
          .innerJoin(units, eq(payments.unitId, units.id))
          .innerJoin(properties, eq(units.propertyId, properties.id))
          .innerJoin(tenants, eq(leases.tenantId, tenants.id))
          .where(
            and(
              eq(payments.id, input.paymentId),
              eq(leases.tenantId, ctx.user!.id)
            )
          )
          .limit(1);

        if (!payment.length) {
          throw new Error('Payment not found');
        }

        const record = payment[0];
        const tenantName = `${record.tenant.firstName} ${record.tenant.lastName}`;

        // Create Stripe checkout session
        const session = await createCheckoutSession({
          tenantId: ctx.user!.id,
          leaseId: record.lease.id,
          paymentId: input.paymentId,
          amount: input.amount,
          currency: 'zar', // South African Rand
          tenantEmail: record.tenant.email || '',
          tenantName,
          propertyName: record.property.name,
          unitNumber: record.unit.unitNumber,
          successUrl: `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/payment-success?sessionId={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${process.env.VITE_FRONTEND_URL || 'http://localhost:5173'}/payment-cancelled`,
        });

        return session;
      } catch (error) {
        console.error('Error creating payment checkout:', error);
        throw error;
      }
    }),

  // Get payment details
  getPaymentDetails: protectedProcedure
    .input(z.object({ paymentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      try {
        const payment = await db
          .select({
            payment: payments,
            lease: leases,
            unit: units,
            property: properties,
          })
          .from(payments)
          .innerJoin(leases, eq(payments.leaseId, leases.id))
          .innerJoin(units, eq(payments.unitId, units.id))
          .innerJoin(properties, eq(units.propertyId, properties.id))
          .where(
            and(
              eq(payments.id, input.paymentId),
              eq(leases.tenantId, ctx.user!.id)
            )
          )
          .limit(1);

        if (!payment.length) {
          throw new Error('Payment not found');
        }

        const record = payment[0];
        return {
          id: record.payment.id,
          amount: Number(record.payment.amount),
          dueDate: record.payment.dueDate,
          paidDate: record.payment.paidDate,
          status: record.payment.status,
          paymentMethod: record.payment.paymentMethod,
          receiptUrl: record.payment.receiptUrl,
          reference: record.payment.reference,
          propertyName: record.property.name,
          unitNumber: record.unit.unitNumber,
          leaseId: record.lease.id,
        };
      } catch (error) {
        console.error('Error fetching payment details:', error);
        throw error;
      }
    }),
});


