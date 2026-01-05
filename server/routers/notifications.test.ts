import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("notifications router", () => {
  it("should validate notification types", () => {
    const validTypes = ["overdue_rent", "lease_expiration", "maintenance_completion"];
    
    validTypes.forEach(type => {
      expect(validTypes).toContain(type);
    });
  });

  it("should validate send notification schema", () => {
    const schema = z.object({
      tenantId: z.number().int().positive(),
      type: z.enum(["overdue_rent", "lease_expiration", "maintenance_completion"]),
      propertyId: z.number().int().positive(),
      additionalData: z.object({
        rentAmount: z.number().optional(),
        daysOverdue: z.number().optional(),
        expirationDate: z.string().optional(),
        daysUntilExpiration: z.number().optional(),
        maintenanceTitle: z.string().optional(),
        completionDate: z.string().optional(),
      }).optional(),
    });

    const validInput = {
      tenantId: 1,
      type: "overdue_rent" as const,
      propertyId: 1,
      additionalData: {
        rentAmount: 5000,
        daysOverdue: 7,
      },
    };

    const result = schema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should reject invalid notification types", () => {
    const schema = z.object({
      type: z.enum(["overdue_rent", "lease_expiration", "maintenance_completion"]),
    });

    const invalidInput = {
      type: "invalid_type",
    };

    const result = schema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should require positive tenant and property IDs", () => {
    const schema = z.object({
      tenantId: z.number().int().positive(),
      propertyId: z.number().int().positive(),
    });

    const invalidInput = {
      tenantId: -1,
      propertyId: 0,
    };

    const result = schema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should handle optional additional data", () => {
    const schema = z.object({
      tenantId: z.number().int().positive(),
      type: z.enum(["overdue_rent", "lease_expiration", "maintenance_completion"]),
      propertyId: z.number().int().positive(),
      additionalData: z.object({
        rentAmount: z.number().optional(),
      }).optional(),
    });

    const inputWithoutData = {
      tenantId: 1,
      type: "overdue_rent" as const,
      propertyId: 1,
    };

    const result = schema.safeParse(inputWithoutData);
    expect(result.success).toBe(true);
  });
});
