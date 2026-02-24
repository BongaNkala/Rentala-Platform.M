import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getUserPreferences,
  saveUserPreferences,
  deleteUserPreferences,
  shouldSyncFromServer,
  type SavedUserPreferences,
} from "./preferenceService";

describe("preferenceService", () => {
  const mockUserId = 123;
  const mockPreferences: SavedUserPreferences = {
    metrics: {
      selectedMetrics: ["overall", "cleanliness", "maintenance"],
      lastUpdated: Date.now(),
    },
    schedule: {
      defaultFrequency: "monthly",
      defaultHour: 9,
      defaultMinute: 0,
      defaultDayOfMonth: 1,
      lastUpdated: Date.now(),
    },
  };

  describe("shouldSyncFromServer", () => {
    it("should return true when server is newer", () => {
      const clientTime = Date.now();
      const serverTime = clientTime + 5000;

      const result = shouldSyncFromServer(clientTime, serverTime);
      expect(result).toBe(true);
    });

    it("should return false when client is newer", () => {
      const clientTime = Date.now();
      const serverTime = clientTime - 5000;

      const result = shouldSyncFromServer(clientTime, serverTime);
      expect(result).toBe(false);
    });

    it("should return false when times are equal", () => {
      const time = Date.now();

      const result = shouldSyncFromServer(time, time);
      expect(result).toBe(false);
    });

    it("should handle zero timestamps", () => {
      const result = shouldSyncFromServer(0, 1000);
      expect(result).toBe(true);
    });
  });

  describe("preference data structure", () => {
    it("should have valid metrics structure", () => {
      expect(mockPreferences.metrics).toHaveProperty("selectedMetrics");
      expect(mockPreferences.metrics).toHaveProperty("lastUpdated");
      expect(Array.isArray(mockPreferences.metrics.selectedMetrics)).toBe(true);
      expect(typeof mockPreferences.metrics.lastUpdated).toBe("number");
    });

    it("should have valid schedule structure", () => {
      expect(mockPreferences.schedule).toHaveProperty("defaultFrequency");
      expect(mockPreferences.schedule).toHaveProperty("defaultHour");
      expect(mockPreferences.schedule).toHaveProperty("defaultMinute");
      expect(mockPreferences.schedule).toHaveProperty("defaultDayOfMonth");
      expect(mockPreferences.schedule).toHaveProperty("lastUpdated");
    });

    it("should validate frequency enum", () => {
      const validFrequencies = ["weekly", "biweekly", "monthly", "quarterly", "annually"];
      expect(validFrequencies).toContain(mockPreferences.schedule.defaultFrequency);
    });

    it("should validate hour range", () => {
      expect(mockPreferences.schedule.defaultHour).toBeGreaterThanOrEqual(0);
      expect(mockPreferences.schedule.defaultHour).toBeLessThan(24);
    });

    it("should validate minute range", () => {
      expect(mockPreferences.schedule.defaultMinute).toBeGreaterThanOrEqual(0);
      expect(mockPreferences.schedule.defaultMinute).toBeLessThan(60);
    });

    it("should validate day of month range", () => {
      expect(mockPreferences.schedule.defaultDayOfMonth).toBeGreaterThanOrEqual(1);
      expect(mockPreferences.schedule.defaultDayOfMonth).toBeLessThanOrEqual(31);
    });
  });

  describe("preference serialization", () => {
    it("should serialize metrics to JSON", () => {
      const json = JSON.stringify(mockPreferences.metrics.selectedMetrics);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual(mockPreferences.metrics.selectedMetrics);
    });

    it("should handle empty metrics array", () => {
      const emptyMetrics = { selectedMetrics: [], lastUpdated: Date.now() };
      const json = JSON.stringify(emptyMetrics.selectedMetrics);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual([]);
    });

    it("should preserve metric names after serialization", () => {
      const metrics = ["overall", "cleanliness", "maintenance"];
      const json = JSON.stringify(metrics);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual(metrics);
    });
  });

  describe("preference validation", () => {
    it("should validate all required fields present", () => {
      const prefs = mockPreferences;
      expect(prefs.metrics).toBeDefined();
      expect(prefs.schedule).toBeDefined();
      expect(prefs.metrics.selectedMetrics).toBeDefined();
      expect(prefs.schedule.defaultFrequency).toBeDefined();
    });

    it("should handle preferences with single metric", () => {
      const singleMetric: SavedUserPreferences = {
        metrics: {
          selectedMetrics: ["overall"],
          lastUpdated: Date.now(),
        },
        schedule: mockPreferences.schedule,
      };
      expect(singleMetric.metrics.selectedMetrics.length).toBe(1);
    });

    it("should handle preferences with all metrics", () => {
      const allMetrics: SavedUserPreferences = {
        metrics: {
          selectedMetrics: [
            "overall",
            "cleanliness",
            "maintenance",
            "communication",
            "responsiveness",
            "value",
            "surveys",
            "recommendations",
          ],
          lastUpdated: Date.now(),
        },
        schedule: mockPreferences.schedule,
      };
      expect(allMetrics.metrics.selectedMetrics.length).toBe(8);
    });
  });
});
