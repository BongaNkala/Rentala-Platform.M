import { eq, and, like } from "drizzle-orm";
import { properties, units, leases, tenants } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

const createPropertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  propertyType: z.enum(["residential", "commercial", "mixed"]).default("residential"),
  description: z.string().optional(),
  totalUnits: z.number().int().positive().default(1),
});

const updatePropertySchema = createPropertySchema.partial().extend({
  id: z.number().int().positive(),
});

export const propertiesRouter = router({
  // List all properties for the current user (landlord) or agency
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userRole = ctx.user?.role;

    if (userRole === "landlord") {
      return await db
        .select()
        .from(properties)
        .where(eq(properties.ownerId, ctx.user!.id));
    }

    return await db.select().from(properties);
  }),

  // Get a single property with its units and current tenants
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, input.id))
        .limit(1);

      if (!property.length) {
        throw new Error("Property not found");
      }

      // Check authorization
      if (ctx.user?.role === "landlord" && property[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Get units for this property
      const propertyUnits = await db
        .select()
        .from(units)
        .where(eq(units.propertyId, input.id));

      return {
        ...property[0],
        units: propertyUnits,
      };
    }),

  // Create a new property
  create: protectedProcedure
    .input(createPropertySchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only landlords and agency admins can create properties
      if (!["landlord", "agency_admin"].includes(ctx.user?.role || "")) {
        throw new Error("Unauthorized");
      }

      const result = await db.insert(properties).values({
        ...input,
        ownerId: ctx.user!.id,
        agencyId: ctx.user?.role === "agency_admin" ? ctx.user.id : undefined,
        status: "active",
      });

      return result;
    }),

  // Update a property
  update: protectedProcedure
    .input(updatePropertySchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      // Check authorization
      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, id))
        .limit(1);

      if (!property.length) {
        throw new Error("Property not found");
      }

      if (ctx.user?.role === "landlord" && property[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await db.update(properties).set(updateData).where(eq(properties.id, id));

      return { success: true };
    }),

  // Delete a property
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check authorization
      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, input.id))
        .limit(1);

      if (!property.length) {
        throw new Error("Property not found");
      }

      if (ctx.user?.role === "landlord" && property[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await db.delete(properties).where(eq(properties.id, input.id));

      return { success: true };
    }),

  // Get property statistics
  getStats: protectedProcedure
    .input(z.object({ propertyId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const propertyUnits = await db
        .select()
        .from(units)
        .where(eq(units.propertyId, input.propertyId));

      const occupiedCount = propertyUnits.filter(u => u.status === "occupied").length;
      const vacantCount = propertyUnits.filter(u => u.status === "vacant").length;
      const maintenanceCount = propertyUnits.filter(u => u.status === "maintenance").length;

      const totalRent = propertyUnits.reduce((sum, u) => {
        return sum + (u.rentAmount ? parseFloat(u.rentAmount.toString()) : 0);
      }, 0);

      return {
        totalUnits: propertyUnits.length,
        occupiedCount,
        vacantCount,
        maintenanceCount,
        occupancyRate: propertyUnits.length > 0 ? (occupiedCount / propertyUnits.length) * 100 : 0,
        totalPotentialRent: totalRent,
      };
    }),
});
