import { eq, and } from "drizzle-orm";
import { units, properties, leases } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

const createUnitSchema = z.object({
  propertyId: z.number().int().positive(),
  unitNumber: z.string().min(1, "Unit number is required"),
  unitType: z.enum(["studio", "one_bedroom", "two_bedroom", "three_bedroom", "four_bedroom", "five_plus_bedroom", "commercial"]).default("one_bedroom"),
  bedrooms: z.number().int().nonnegative().default(1),
  bathrooms: z.number().int().nonnegative().default(1),
  squareFeet: z.number().int().positive().optional(),
  rentAmount: z.string().or(z.number()),
  deposit: z.string().or(z.number()).optional(),
  description: z.string().optional(),
});

const updateUnitSchema = createUnitSchema.partial().extend({
  id: z.number().int().positive(),
  status: z.enum(["vacant", "occupied", "maintenance", "reserved"]).optional(),
});

export const unitsRouter = router({
  // List all units for a property
  listByProperty: protectedProcedure
    .input(z.object({ propertyId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check authorization - user must own the property
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
        .from(units)
        .where(eq(units.propertyId, input.propertyId));
    }),

  // Get a single unit with current lease info
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const unit = await db
        .select()
        .from(units)
        .where(eq(units.id, input.id))
        .limit(1);

      if (!unit.length) {
        throw new Error("Unit not found");
      }

      // Get current lease if occupied
      const currentLease = await db
        .select()
        .from(leases)
        .where(
          and(
            eq(leases.unitId, input.id),
            eq(leases.status, "active")
          )
        )
        .limit(1);

      return {
        ...unit[0],
        currentLease: currentLease.length > 0 ? currentLease[0] : null,
      };
    }),

  // Create a new unit
  create: protectedProcedure
    .input(createUnitSchema)
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

      const result = await db.insert(units).values({
        ...input,
        rentAmount: input.rentAmount.toString(),
        deposit: input.deposit ? input.deposit.toString() : undefined,
        status: "vacant",
      });

      return result;
    }),

  // Update a unit
  update: protectedProcedure
    .input(updateUnitSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      const unit = await db
        .select()
        .from(units)
        .where(eq(units.id, id))
        .limit(1);

      if (!unit.length) {
        throw new Error("Unit not found");
      }

      // Check authorization
      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, unit[0].propertyId))
        .limit(1);

      if (ctx.user?.role === "landlord" && property[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const updateValues: any = { ...updateData };
      if (updateData.rentAmount !== undefined) {
        updateValues.rentAmount = updateData.rentAmount.toString();
      }
      if (updateData.deposit !== undefined) {
        updateValues.deposit = updateData.deposit.toString();
      }

      await db.update(units).set(updateValues).where(eq(units.id, id));

      return { success: true };
    }),

  // Delete a unit
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const unit = await db
        .select()
        .from(units)
        .where(eq(units.id, input.id))
        .limit(1);

      if (!unit.length) {
        throw new Error("Unit not found");
      }

      // Check authorization
      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, unit[0].propertyId))
        .limit(1);

      if (ctx.user?.role === "landlord" && property[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await db.delete(units).where(eq(units.id, input.id));

      return { success: true };
    }),
});
