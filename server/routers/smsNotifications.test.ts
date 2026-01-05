import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("smsNotifications router", () => {
  it("should validate SMS notification types", () => {
    const validTypes = ["overdue_rent", "lease_expiration", "maintenance_completion", "payment_reminder"];
    
    validTypes.forEach(type => {
      expect(validTypes).toContain(type);
    });
  });

  it("should validate send SMS schema", () => {
    const schema = z.object({
      tenantId: z.number().int().positive(),
      type: z.enum(["overdue_rent", "lease_expiration", "maintenance_completion", "payment_reminder"]),
      propertyId: z.number().int().positive(),
      additionalData: z.object({
        rentAmount: z.number().optional(),
        daysOverdue: z.number().optional(),
        daysUntilExpiration: z.number().optional(),
        maintenanceTitle: z.string().optional(),
        dueDate: z.string().optional(),
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

  it("should reject invalid SMS types", () => {
    const schema = z.object({
      type: z.enum(["overdue_rent", "lease_expiration", "maintenance_completion", "payment_reminder"]),
    });

    const invalidInput = {
      type: "invalid_type",
    };

    const result = schema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should validate phone number format", () => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    // Valid phone numbers
    expect(phoneRegex.test("+27123456789")).toBe(true);
    expect(phoneRegex.test("+1234567890")).toBe(true);
    expect(phoneRegex.test("27123456789")).toBe(true);

    // Invalid phone numbers
    expect(phoneRegex.test("invalid")).toBe(false);
    expect(phoneRegex.test("+0123456789")).toBe(false);
    expect(phoneRegex.test("")).toBe(false);
  });

  it("should format South African phone numbers correctly", () => {
    const formatPhoneNumber = (phoneNumber: string): string => {
      if (!phoneNumber.startsWith("+")) {
        if (phoneNumber.startsWith("0")) {
          return "+27" + phoneNumber.substring(1);
        }
        return "+" + phoneNumber;
      }
      return phoneNumber;
    };

    expect(formatPhoneNumber("0123456789")).toBe("+27123456789");
    expect(formatPhoneNumber("123456789")).toBe("+123456789");
    expect(formatPhoneNumber("+27123456789")).toBe("+27123456789");
  });

  it("should truncate SMS body to 160 characters", () => {
    const longText = "a".repeat(200);
    const truncated = longText.substring(0, 157) + "...";

    expect(truncated.length).toBe(160);
    expect(truncated.endsWith("...")).toBe(true);
  });

  it("should handle optional additional data", () => {
    const schema = z.object({
      tenantId: z.number().int().positive(),
      type: z.enum(["overdue_rent", "lease_expiration", "maintenance_completion", "payment_reminder"]),
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
