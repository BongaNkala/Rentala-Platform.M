import { eq, and, inArray, gte, lte } from "drizzle-orm";
import { transactions, properties, leases, payments, maintenanceRequests } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

const createTransactionSchema = z.object({
  propertyId: z.number().int().positive(),
  type: z.enum(["income", "expense"]),
  category: z.string(),
  amount: z.string().or(z.number()),
  description: z.string(),
  date: z.string(),
  reference: z.string().optional(),
});

const getFinancialReportSchema = z.object({
  propertyId: z.number().int().positive().optional(),
  startDate: z.string(),
  endDate: z.string(),
});

export const accountingRouter = router({
  // List all transactions for the current user's properties
  list: protectedProcedure
    .input(
      z.object({
        propertyId: z.number().int().positive().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all properties owned by the user
      const userProperties = await db
        .select()
        .from(properties)
        .where(eq(properties.ownerId, ctx.user!.id));

      const propertyIds = userProperties.map(p => p.id);

      if (propertyIds.length === 0) {
        return [];
      }

      let query = db
        .select()
        .from(transactions)
        .where(inArray(transactions.propertyId, propertyIds));

      // Filter by specific property if provided
      if (input.propertyId) {
        query = db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.propertyId, input.propertyId),
              inArray(transactions.propertyId, propertyIds)
            )
          );
      }

      // Filter by date range if provided
      if (input.startDate && input.endDate) {
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        query = db
          .select()
          .from(transactions)
          .where(
            and(
              input.propertyId
                ? eq(transactions.propertyId, input.propertyId)
                : inArray(transactions.propertyId, propertyIds),
              gte(transactions.date, startDate),
              lte(transactions.date, endDate)
            )
          );
      }

      return await query;
    }),

  // Create a new transaction
  create: protectedProcedure
    .input(createTransactionSchema)
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

      const result = await db.insert(transactions).values({
        propertyId: input.propertyId,
        type: input.type,
        category: input.category,
        amount: input.amount.toString(),
        description: input.description,
        date: new Date(input.date),
        reference: input.reference,
      });

      return result;
    }),

  // Get financial summary for a property or all properties
  getSummary: protectedProcedure
    .input(
      z.object({
        propertyId: z.number().int().positive().optional(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all properties owned by the user
      const userProperties = await db
        .select()
        .from(properties)
        .where(eq(properties.ownerId, ctx.user!.id));

      const propertyIds = userProperties.map(p => p.id);

      if (propertyIds.length === 0) {
        return {
          totalIncome: "0",
          totalExpenses: "0",
          netProfit: "0",
          incomeByCategory: {},
          expensesByCategory: {},
        };
      }

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      let transactionsQuery = db
        .select()
        .from(transactions)
        .where(
          and(
            input.propertyId
              ? eq(transactions.propertyId, input.propertyId)
              : inArray(transactions.propertyId, propertyIds),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        );

      const allTransactions = await transactionsQuery;

      // Calculate totals
      let totalIncome = 0;
      let totalExpenses = 0;
      const incomeByCategory: Record<string, number> = {};
      const expensesByCategory: Record<string, number> = {};

      for (const txn of allTransactions) {
        const amount = parseFloat(txn.amount.toString());

        if (txn.type === "income") {
          totalIncome += amount;
          incomeByCategory[txn.category] = (incomeByCategory[txn.category] || 0) + amount;
        } else {
          totalExpenses += amount;
          expensesByCategory[txn.category] = (expensesByCategory[txn.category] || 0) + amount;
        }
      }

      const netProfit = totalIncome - totalExpenses;

      return {
        totalIncome: totalIncome.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        netProfit: netProfit.toFixed(2),
        incomeByCategory,
        expensesByCategory,
      };
    }),

  // Get income by property
  getIncomeByProperty: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all properties owned by the user
      const userProperties = await db
        .select()
        .from(properties)
        .where(eq(properties.ownerId, ctx.user!.id));

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      const incomeByProperty: Record<string, { propertyId: number; propertyName: string; income: number; expenses: number; profit: number }> = {};

      for (const prop of userProperties) {
        const propTransactions = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.propertyId, prop.id),
              gte(transactions.date, startDate),
              lte(transactions.date, endDate)
            )
          );

        let income = 0;
        let expenses = 0;

        for (const txn of propTransactions) {
          const amount = parseFloat(txn.amount.toString());
          if (txn.type === "income") {
            income += amount;
          } else {
            expenses += amount;
          }
        }

        incomeByProperty[prop.id.toString()] = {
          propertyId: prop.id,
          propertyName: prop.name,
          income,
          expenses,
          profit: income - expenses,
        };
      }

      return incomeByProperty;
    }),

  // Get expenses by category
  getExpensesByCategory: protectedProcedure
    .input(
      z.object({
        propertyId: z.number().int().positive().optional(),
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all properties owned by the user
      const userProperties = await db
        .select()
        .from(properties)
        .where(eq(properties.ownerId, ctx.user!.id));

      const propertyIds = userProperties.map(p => p.id);

      if (propertyIds.length === 0) {
        return {};
      }

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      const expenseTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.type, "expense"),
            input.propertyId
              ? eq(transactions.propertyId, input.propertyId)
              : inArray(transactions.propertyId, propertyIds),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        );

      const expensesByCategory: Record<string, number> = {};

      for (const txn of expenseTransactions) {
        const amount = parseFloat(txn.amount.toString());
        expensesByCategory[txn.category] = (expensesByCategory[txn.category] || 0) + amount;
      }

      return expensesByCategory;
    }),
});
