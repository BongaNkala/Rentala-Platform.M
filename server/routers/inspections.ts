import { eq, and } from "drizzle-orm";
import { inspections, units, properties, leases } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

const createInspectionSchema = z.object({
  unitId: z.number().int().positive(),
  propertyId: z.number().int().positive(),
  leaseId: z.number().int().positive().optional(),
  tenantId: z.number().int().positive().optional(),
  inspectionType: z.enum(["move_in", "move_out", "periodic", "maintenance", "other"]).default("periodic"),
  date: z.string(),
  findings: z.string().optional(),
  damageReport: z.array(z.object({
    area: z.string(),
    description: z.string(),
    severity: z.enum(["minor", "moderate", "severe"]),
    estimatedRepairCost: z.number().optional(),
  })).optional(),
  images: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const updateInspectionSchema = createInspectionSchema.partial().extend({
  id: z.number().int().positive(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
});

export const inspectionsRouter = router({
  // List all inspections for a property
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
        .from(inspections)
        .where(eq(inspections.propertyId, input.propertyId));
    }),

  // List inspections for a unit
  listByUnit: protectedProcedure
    .input(z.object({ unitId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(inspections)
        .where(eq(inspections.unitId, input.unitId));
    }),

  // Get a single inspection
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const inspection = await db
        .select()
        .from(inspections)
        .where(eq(inspections.id, input.id))
        .limit(1);

      if (!inspection.length) {
        throw new Error("Inspection not found");
      }

      return {
        ...inspection[0],
        damageReport: inspection[0].damageReport ? JSON.parse(inspection[0].damageReport.toString()) : null,
        images: inspection[0].images ? JSON.parse(inspection[0].images.toString()) : null,
      };
    }),

  // Create a new inspection
  create: protectedProcedure
    .input(createInspectionSchema)
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

      const estimatedRepairCost = input.damageReport
        ? input.damageReport.reduce((sum, d) => sum + (d.estimatedRepairCost || 0), 0)
        : 0;

      const result = await db.insert(inspections).values({
        unitId: input.unitId,
        propertyId: input.propertyId,
        leaseId: input.leaseId,
        tenantId: input.tenantId,
        inspectionType: input.inspectionType,
        date: new Date(input.date),
        findings: input.findings,
        damageReport: input.damageReport ? JSON.stringify(input.damageReport) : undefined,
        images: input.images ? JSON.stringify(input.images) : undefined,
        estimatedRepairCost: estimatedRepairCost > 0 ? estimatedRepairCost.toString() : undefined,
        notes: input.notes,
        status: "scheduled",
        staffId: ctx.user!.id,
      });

      return result;
    }),

  // Update an inspection
  update: protectedProcedure
    .input(updateInspectionSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      const inspection = await db
        .select()
        .from(inspections)
        .where(eq(inspections.id, id))
        .limit(1);

      if (!inspection.length) {
        throw new Error("Inspection not found");
      }

      // Check authorization
      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, inspection[0].propertyId))
        .limit(1);

      if (ctx.user?.role === "landlord" && property[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const updateValues: any = {};
      Object.keys(updateData).forEach(key => {
        const value = (updateData as any)[key];
        if (key === 'date' && value) {
          updateValues[key] = new Date(value);
        } else if (key === 'damageReport' && value) {
          updateValues[key] = JSON.stringify(value);
          // Calculate total repair cost
          const totalCost = value.reduce((sum: number, d: any) => sum + (d.estimatedRepairCost || 0), 0);
          updateValues.estimatedRepairCost = totalCost > 0 ? totalCost.toString() : undefined;
        } else if (key === 'images' && value) {
          updateValues[key] = JSON.stringify(value);
        } else if (value !== undefined) {
          updateValues[key] = value;
        }
      });

      await db
        .update(inspections)
        .set(updateValues)
        .where(eq(inspections.id, id));

      return { success: true };
    }),

  // Complete an inspection
  complete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(inspections)
        .set({ status: "completed" })
        .where(eq(inspections.id, input.id));

      return { success: true };
    }),

  // Get scheduled inspections
  getScheduled: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(inspections)
      .where(eq(inspections.status, "scheduled"));
  }),

  // Get inspection statistics
  getStats: protectedProcedure
    .input(z.object({ propertyId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const allInspections = await db
        .select()
        .from(inspections)
        .where(eq(inspections.propertyId, input.propertyId));

      const scheduledCount = allInspections.filter(i => i.status === "scheduled").length;
      const completedCount = allInspections.filter(i => i.status === "completed").length;
      const moveInCount = allInspections.filter(i => i.inspectionType === "move_in").length;
      const moveOutCount = allInspections.filter(i => i.inspectionType === "move_out").length;

      const totalRepairCost = allInspections.reduce((sum, i) => {
        return sum + (i.estimatedRepairCost ? parseFloat(i.estimatedRepairCost.toString()) : 0);
      }, 0);

      return {
        totalInspections: allInspections.length,
        scheduledCount,
        completedCount,
        moveInCount,
        moveOutCount,
        totalRepairCost,
      };
    }),
});
