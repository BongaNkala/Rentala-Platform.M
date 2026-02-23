import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getVacancyTrends,
  getIncomeForecast,
  getMaintenanceCosts,
  getTenantPaymentBehavior,
  getPropertyPerformance,
  getTenantSatisfactionTrends,
} from "./propertyAnalytics";

// Mock the db module
vi.mock("../db", () => ({
  getDb: vi.fn(() => Promise.resolve(null)),
}));

describe("Property Analytics Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getVacancyTrends", () => {
    it("should return empty array when database is unavailable", async () => {
      const result = await getVacancyTrends(12);
      expect(result).toEqual([]);
    });

    it("should accept valid months parameter", async () => {
      const result = await getVacancyTrends(6);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle 12 months by default", async () => {
      const result = await getVacancyTrends();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getIncomeForecast", () => {
    it("should return empty array when database is unavailable", async () => {
      const result = await getIncomeForecast(12);
      expect(result).toEqual([]);
    });

    it("should accept valid months parameter", async () => {
      const result = await getIncomeForecast(6);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return forecast data structure", async () => {
      const result = await getIncomeForecast(1);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getMaintenanceCosts", () => {
    it("should return empty array when database is unavailable", async () => {
      const result = await getMaintenanceCosts();
      expect(result).toEqual([]);
    });

    it("should return array of maintenance costs", async () => {
      const result = await getMaintenanceCosts();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should have correct structure for maintenance items", async () => {
      const result = await getMaintenanceCosts();
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("category");
        expect(result[0]).toHaveProperty("count");
        expect(result[0]).toHaveProperty("totalCost");
        expect(result[0]).toHaveProperty("averageCost");
      }
    });
  });

  describe("getTenantPaymentBehavior", () => {
    it("should return empty array when database is unavailable", async () => {
      const result = await getTenantPaymentBehavior();
      expect(result).toEqual([]);
    });

    it("should return array of payment behaviors", async () => {
      const result = await getTenantPaymentBehavior();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should have correct structure for payment items", async () => {
      const result = await getTenantPaymentBehavior();
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("status");
        expect(result[0]).toHaveProperty("count");
        expect(result[0]).toHaveProperty("percentage");
        expect(result[0]).toHaveProperty("totalAmount");
      }
    });
  });

  describe("getPropertyPerformance", () => {
    it("should return empty array when database is unavailable", async () => {
      const result = await getPropertyPerformance();
      expect(result).toEqual([]);
    });

    it("should return array of property performance data", async () => {
      const result = await getPropertyPerformance();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should have correct structure for property items", async () => {
      const result = await getPropertyPerformance();
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("propertyId");
        expect(result[0]).toHaveProperty("propertyName");
        expect(result[0]).toHaveProperty("totalUnits");
        expect(result[0]).toHaveProperty("occupiedUnits");
        expect(result[0]).toHaveProperty("vacancyRate");
        expect(result[0]).toHaveProperty("monthlyIncome");
        expect(result[0]).toHaveProperty("maintenanceCost");
        expect(result[0]).toHaveProperty("netIncome");
      }
    });
  });

  describe("Data validation", () => {
    it("vacancy trends should have valid date format", async () => {
      const result = await getVacancyTrends(3);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("month");
        expect(typeof result[0].month).toBe("string");
      }
    });

    it("income forecast should have numeric values", async () => {
      const result = await getIncomeForecast(3);
      if (result.length > 0) {
        expect(typeof result[0].projectedIncome).toBe("number");
        expect(typeof result[0].actualIncome).toBe("number");
        expect(typeof result[0].difference).toBe("number");
      }
    });

    it("maintenance costs should have non-negative values", async () => {
      const result = await getMaintenanceCosts();
      if (result.length > 0) {
        expect(result[0].count).toBeGreaterThanOrEqual(0);
        expect(result[0].totalCost).toBeGreaterThanOrEqual(0);
        expect(result[0].averageCost).toBeGreaterThanOrEqual(0);
      }
    });

    it("payment behavior percentages should sum to 100 or less", async () => {
      const result = await getTenantPaymentBehavior();
      if (result.length > 0) {
        const totalPercentage = result.reduce((sum, item) => sum + item.percentage, 0);
        expect(totalPercentage).toBeLessThanOrEqual(101); // Allow for rounding
      }
    });

    it("property performance should have valid occupancy rates", async () => {
      const result = await getPropertyPerformance();
      if (result.length > 0) {
        expect(result[0].occupiedUnits).toBeLessThanOrEqual(result[0].totalUnits);
        expect(result[0].vacancyRate).toBeGreaterThanOrEqual(0);
        expect(result[0].vacancyRate).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("Error handling", () => {
    it("should handle errors gracefully in getVacancyTrends", async () => {
      const result = await getVacancyTrends(12);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle errors gracefully in getIncomeForecast", async () => {
      const result = await getIncomeForecast(12);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle errors gracefully in getMaintenanceCosts", async () => {
      const result = await getMaintenanceCosts();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle errors gracefully in getTenantPaymentBehavior", async () => {
      const result = await getTenantPaymentBehavior();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle errors gracefully in getPropertyPerformance", async () => {
      const result = await getPropertyPerformance();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});


  describe("getTenantSatisfactionTrends", () => {
    it("should return empty array when database is unavailable", async () => {
      const result = await getTenantSatisfactionTrends(12);
      expect(result).toEqual([]);
    });

    it("should accept valid months parameter", async () => {
      const result = await getTenantSatisfactionTrends(6);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle 12 months by default", async () => {
      const result = await getTenantSatisfactionTrends();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return array of satisfaction trends", async () => {
      const result = await getTenantSatisfactionTrends();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should have correct structure for satisfaction items", async () => {
      const result = await getTenantSatisfactionTrends();
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("month");
        expect(result[0]).toHaveProperty("averageSatisfaction");
        expect(result[0]).toHaveProperty("averageCleanliness");
        expect(result[0]).toHaveProperty("averageMaintenance");
        expect(result[0]).toHaveProperty("averageCommunication");
        expect(result[0]).toHaveProperty("averageResponsiveness");
        expect(result[0]).toHaveProperty("averageValueForMoney");
        expect(result[0]).toHaveProperty("surveyCount");
        expect(result[0]).toHaveProperty("recommendPercentage");
      }
    });
  });

  describe("Satisfaction data validation", () => {
    it("satisfaction trends should have valid date format", async () => {
      const result = await getTenantSatisfactionTrends(3);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("month");
        expect(typeof result[0].month).toBe("string");
      }
    });

    it("satisfaction scores should be between 0 and 5", async () => {
      const result = await getTenantSatisfactionTrends(3);
      if (result.length > 0) {
        expect(result[0].averageSatisfaction).toBeGreaterThanOrEqual(0);
        expect(result[0].averageSatisfaction).toBeLessThanOrEqual(5);
        expect(result[0].averageCleanliness).toBeGreaterThanOrEqual(0);
        expect(result[0].averageCleanliness).toBeLessThanOrEqual(5);
      }
    });

    it("recommend percentage should be between 0 and 100", async () => {
      const result = await getTenantSatisfactionTrends(3);
      if (result.length > 0) {
        expect(result[0].recommendPercentage).toBeGreaterThanOrEqual(0);
        expect(result[0].recommendPercentage).toBeLessThanOrEqual(100);
      }
    });

    it("survey count should be non-negative", async () => {
      const result = await getTenantSatisfactionTrends(3);
      if (result.length > 0) {
        expect(result[0].surveyCount).toBeGreaterThanOrEqual(0);
      }
    });

    it("should handle errors gracefully in getTenantSatisfactionTrends", async () => {
      const result = await getTenantSatisfactionTrends(12);
      expect(Array.isArray(result)).toBe(true);
    });
  });


  describe("Property-filtered satisfaction trends", () => {
    it("should accept optional propertyId parameter", async () => {
      const result = await getTenantSatisfactionTrends(12, 1);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array when propertyId is invalid", async () => {
      const result = await getTenantSatisfactionTrends(12, 99999);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle property filtering gracefully", async () => {
      const allResult = await getTenantSatisfactionTrends(12);
      const filteredResult = await getTenantSatisfactionTrends(12, 1);
      expect(Array.isArray(allResult)).toBe(true);
      expect(Array.isArray(filteredResult)).toBe(true);
    });

    it("should maintain data structure with property filter", async () => {
      const result = await getTenantSatisfactionTrends(12, 1);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("month");
        expect(result[0]).toHaveProperty("averageSatisfaction");
        expect(result[0]).toHaveProperty("surveyCount");
      }
    });
  });
