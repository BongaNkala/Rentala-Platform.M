import { eq, and, like } from "drizzle-orm";
import { tenants, leases, users } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

const createTenantSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  idNumber: z.string().min(1, "ID number is required"),
  idType: z.enum(["national_id", "passport", "drivers_license"]).default("national_id"),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  employmentStatus: z.enum(["employed", "self_employed", "unemployed", "student", "retired"]).optional(),
  employer: z.string().optional(),
  monthlyIncome: z.string().or(z.number()).optional(),
});

const updateTenantSchema = createTenantSchema.partial().extend({
  id: z.number().int().positive(),
  status: z.enum(["active", "inactive", "blacklisted"]).optional(),
});

export const tenantsRouter = router({
  // List all tenants (with filtering options)
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["active", "inactive", "blacklisted"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (input?.search && input?.status) {
        return await db
          .select()
          .from(tenants)
          .where(
            and(
              like(tenants.firstName, `%${input.search}%`),
              eq(tenants.status, input.status)
            )
          );
      }

      if (input?.search) {
        return await db
          .select()
          .from(tenants)
          .where(like(tenants.firstName, `%${input.search}%`));
      }

      if (input?.status) {
        return await db
          .select()
          .from(tenants)
          .where(eq(tenants.status, input.status));
      }

      return await db.select().from(tenants);
    }),

  // Get a single tenant with their lease history
  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, input.id))
        .limit(1);

      if (!tenant.length) {
        throw new Error("Tenant not found");
      }

      // Get lease history
      const leaseHistory = await db
        .select()
        .from(leases)
        .where(eq(leases.tenantId, input.id));

      return {
        ...tenant[0],
        leaseHistory,
      };
    }),

  // Create a new tenant
  create: protectedProcedure
    .input(createTenantSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only staff and agency admins can create tenants
      if (!["staff", "agency_admin", "landlord"].includes(ctx.user?.role || "")) {
        throw new Error("Unauthorized");
      }

      const result = await db.insert(tenants).values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        idNumber: input.idNumber,
        idType: input.idType,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        nationality: input.nationality,
        emergencyContact: input.emergencyContact,
        emergencyPhone: input.emergencyPhone,
        employmentStatus: input.employmentStatus,
        employer: input.employer,
        monthlyIncome: input.monthlyIncome ? input.monthlyIncome.toString() : undefined,
        status: "active",
      });

      return result;
    }),

  // Update a tenant
  update: protectedProcedure
    .input(updateTenantSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, id))
        .limit(1);

      if (!tenant.length) {
        throw new Error("Tenant not found");
      }

      const updateValues: any = {};
      Object.keys(updateData).forEach(key => {
        const value = (updateData as any)[key];
        if (key === 'dateOfBirth' && value) {
          updateValues[key] = new Date(value);
        } else if (key === 'monthlyIncome' && value !== undefined) {
          updateValues[key] = value.toString();
        } else if (value !== undefined) {
          updateValues[key] = value;
        }
      });

      await db.update(tenants).set(updateValues).where(eq(tenants.id, id));

      return { success: true };
    }),

  // Delete a tenant
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, input.id))
        .limit(1);

      if (!tenant.length) {
        throw new Error("Tenant not found");
      }

      await db.delete(tenants).where(eq(tenants.id, input.id));

      return { success: true };
    }),

  // Get tenant by ID number (for verification)
  getByIdNumber: protectedProcedure
    .input(z.object({ idNumber: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.idNumber, input.idNumber))
        .limit(1);

      return tenant.length > 0 ? tenant[0] : null;
    }),
});
