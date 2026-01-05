import { eq, and } from "drizzle-orm";
import { maintenanceRequests, units, properties } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

const createMaintenanceSchema = z.object({
  unitId: z.number().int().positive(),
  propertyId: z.number().int().positive(),
  tenantId: z.number().int().positive().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["plumbing", "electrical", "structural", "appliances", "cleaning", "pest_control", "other"]).default("other"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  images: z.array(z.string()).optional(),
});

const updateMaintenanceSchema = createMaintenanceSchema.partial().extend({
  id: z.number().int().positive(),
  status: z.enum(["open", "assigned", "in_progress", "completed", "cancelled"]).optional(),
  staffId: z.number().int().positive().optional(),
  actualCost: z.string().or(z.number()).optional(),
});

export const maintenanceRouter = router({
  // List all maintenance requests for a property
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
        .from(maintenanceRequests)
        .where(eq(maintenanceRequests.propertyId, input.propertyId));
    }),

  // List maintenance requests for a unit
  listByUnit: protectedProcedure
    .input(z.object({ unitId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(maintenanceRequests)
        .where(eq(maintenanceRequests.unitId, input.unitId));
    }),

  // Get a single maintenance request
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const request = await db
        .select()
        .from(maintenanceRequests)
        .where(eq(maintenanceRequests.id, input.id))
        .limit(1);

      if (!request.length) {
        throw new Error("Maintenance request not found");
      }

      return request[0];
    }),

  // Create a new maintenance request
  create: protectedProcedure
    .input(createMaintenanceSchema)
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

      const result = await db.insert(maintenanceRequests).values({
        unitId: input.unitId,
        propertyId: input.propertyId,
        tenantId: input.tenantId,
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        images: input.images ? JSON.stringify(input.images) : undefined,
        status: "open",
      });

      // Update unit status to maintenance if needed
      if (input.priority === "urgent" || input.priority === "high") {
        await db
          .update(units)
          .set({ status: "maintenance" })
          .where(eq(units.id, input.unitId));
      }

      return result;
    }),

  // Update a maintenance request
  update: protectedProcedure
    .input(updateMaintenanceSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      const request = await db
        .select()
        .from(maintenanceRequests)
        .where(eq(maintenanceRequests.id, id))
        .limit(1);

      if (!request.length) {
        throw new Error("Maintenance request not found");
      }

      // Check authorization
      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, request[0].propertyId))
        .limit(1);

      if (ctx.user?.role === "landlord" && property[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const updateValues: any = {};
      Object.keys(updateData).forEach(key => {
        const value = (updateData as any)[key];
        if (key === 'actualCost' && value !== undefined) {
          updateValues[key] = value.toString();
        } else if (value !== undefined) {
          updateValues[key] = value;
        }
      });

      // If status is completed, revert unit status
      if (updateData.status === "completed") {
        await db
          .update(units)
          .set({ status: "occupied" })
          .where(eq(units.id, request[0].unitId));
        updateValues.completedAt = new Date();
      }

      await db
        .update(maintenanceRequests)
        .set(updateValues)
        .where(eq(maintenanceRequests.id, id));

      return { success: true };
    }),

  // Assign staff to a maintenance request
  assignStaff: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      staffId: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(maintenanceRequests)
        .set({
          staffId: input.staffId,
          status: "assigned",
        })
        .where(eq(maintenanceRequests.id, input.id));

      return { success: true };
    }),

  // Get open maintenance requests (for dashboard)
  getOpen: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(maintenanceRequests)
      .where(eq(maintenanceRequests.status, "open"));
  }),

  // Get maintenance statistics
  getStats: protectedProcedure
    .input(z.object({ propertyId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const requests = await db
        .select()
        .from(maintenanceRequests)
        .where(eq(maintenanceRequests.propertyId, input.propertyId));

      const openCount = requests.filter(r => r.status === "open").length;
      const inProgressCount = requests.filter(r => r.status === "in_progress").length;
      const completedCount = requests.filter(r => r.status === "completed").length;
      const urgentCount = requests.filter(r => r.priority === "urgent").length;

      const totalCost = requests.reduce((sum, r) => {
        return sum + (r.actualCost ? parseFloat(r.actualCost.toString()) : 0);
      }, 0);

      return {
        totalRequests: requests.length,
        openCount,
        inProgressCount,
        completedCount,
        urgentCount,
        totalCost,
      };
    }),
});
