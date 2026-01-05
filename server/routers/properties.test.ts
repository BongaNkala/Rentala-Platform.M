import { describe, it, expect, beforeEach, vi } from "vitest";
import { propertiesRouter } from "./properties";
import { getDb } from "../db";

// Mock the database
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

describe("Properties Router", () => {
  let mockDb: any;
  let mockCtx: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockCtx = {
      user: {
        id: 1,
        role: "landlord",
      },
    };

    vi.mocked(getDb).mockResolvedValue(mockDb);
  });

  describe("list", () => {
    it("should return properties for a landlord", async () => {
      const mockProperties = [
        { id: 1, name: "Property 1", ownerId: 1, status: "active" },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockProperties),
        }),
      });

      const caller = propertiesRouter.createCaller(mockCtx);
      const result = await caller.list();

      expect(result).toEqual(mockProperties);
    });

    it("should throw error if database is not available", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const caller = propertiesRouter.createCaller(mockCtx);

      await expect(caller.list()).rejects.toThrow("Database not available");
    });
  });

  describe("create", () => {
    it("should create a property for a landlord", async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue({ insertId: 1 }),
      });

      const caller = propertiesRouter.createCaller(mockCtx);
      const result = await caller.create({
        name: "New Property",
        address: "123 Main St",
        city: "Johannesburg",
        propertyType: "residential",
      });

      expect(result).toBeDefined();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should reject unauthorized users", async () => {
      const unauthorizedCtx = {
        user: {
          id: 2,
          role: "tenant",
        },
      };

      const caller = propertiesRouter.createCaller(unauthorizedCtx);

      await expect(
        caller.create({
          name: "New Property",
          address: "123 Main St",
          city: "Johannesburg",
        })
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("getStats", () => {
    it("should return property statistics", async () => {
      const mockUnits = [
        { id: 1, status: "occupied", rentAmount: "5000" },
        { id: 2, status: "vacant", rentAmount: "5000" },
        { id: 3, status: "maintenance", rentAmount: "5000" },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockUnits),
        }),
      });

      const caller = propertiesRouter.createCaller(mockCtx);
      const result = await caller.getStats({ propertyId: 1 });

      expect(result).toHaveProperty("totalUnits", 3);
      expect(result).toHaveProperty("occupiedCount", 1);
      expect(result).toHaveProperty("vacantCount", 1);
      expect(result).toHaveProperty("maintenanceCount", 1);
      expect(result).toHaveProperty("occupancyRate");
      expect(result).toHaveProperty("totalPotentialRent");
    });
  });
});
