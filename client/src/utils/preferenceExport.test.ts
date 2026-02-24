import { describe, it, expect, beforeEach } from "vitest";
import {
  exportPreferences,
  generateExportFilename,
  validatePreferences,
  parseImportedPreferences,
  mergePreferences,
  replacePreferences,
  type ExportedPreferences,
} from "./preferenceExport";
import type { MetricPreferences, SchedulePreferences } from "@/hooks/useMetricPreferences";

describe("preferenceExport utilities", () => {
  const mockMetrics: MetricPreferences = {
    selectedMetrics: ["overall", "cleanliness", "maintenance"],
    lastUpdated: Date.now(),
  };

  const mockSchedule: SchedulePreferences = {
    defaultFrequency: "monthly",
    defaultHour: 9,
    defaultMinute: 0,
    defaultDayOfMonth: 1,
    lastUpdated: Date.now(),
  };

  describe("exportPreferences", () => {
    it("should generate valid JSON with all required fields", () => {
      const exported = exportPreferences(mockMetrics, mockSchedule);
      const parsed = JSON.parse(exported);

      expect(parsed.version).toBeDefined();
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.metrics).toEqual(mockMetrics);
      expect(parsed.schedule).toEqual(mockSchedule);
    });

    it("should include ISO timestamp", () => {
      const exported = exportPreferences(mockMetrics, mockSchedule);
      const parsed = JSON.parse(exported);

      const timestamp = new Date(parsed.exportedAt);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("should be properly formatted JSON", () => {
      const exported = exportPreferences(mockMetrics, mockSchedule);
      expect(() => JSON.parse(exported)).not.toThrow();
    });
  });

  describe("generateExportFilename", () => {
    it("should generate filename with date", () => {
      const filename = generateExportFilename();
      expect(filename).toMatch(/rentala-preferences-\d{4}-\d{2}-\d{2}\.json/);
    });

    it("should include .json extension", () => {
      const filename = generateExportFilename();
      expect(filename).toEndWith(".json");
    });
  });

  describe("validatePreferences", () => {
    it("should validate correct preferences structure", () => {
      const valid: ExportedPreferences = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        metrics: mockMetrics,
        schedule: mockSchedule,
      };

      expect(validatePreferences(valid)).toBe(true);
    });

    it("should reject missing version", () => {
      const invalid = {
        exportedAt: new Date().toISOString(),
        metrics: mockMetrics,
        schedule: mockSchedule,
      };

      expect(validatePreferences(invalid)).toBe(false);
    });

    it("should reject missing metrics", () => {
      const invalid = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        schedule: mockSchedule,
      };

      expect(validatePreferences(invalid)).toBe(false);
    });

    it("should reject missing schedule", () => {
      const invalid = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        metrics: mockMetrics,
      };

      expect(validatePreferences(invalid)).toBe(false);
    });

    it("should reject invalid metrics structure", () => {
      const invalid = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        metrics: { selectedMetrics: "not-an-array" },
        schedule: mockSchedule,
      };

      expect(validatePreferences(invalid)).toBe(false);
    });

    it("should reject null or undefined", () => {
      expect(validatePreferences(null)).toBe(false);
      expect(validatePreferences(undefined)).toBe(false);
    });
  });

  describe("parseImportedPreferences", () => {
    it("should parse valid preferences file", () => {
      const valid: ExportedPreferences = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        metrics: mockMetrics,
        schedule: mockSchedule,
      };

      const result = parseImportedPreferences(JSON.stringify(valid));
      expect(result.success).toBe(true);
      expect(result.data).toEqual(valid);
    });

    it("should return error for invalid JSON", () => {
      const result = parseImportedPreferences("{ invalid json }");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return error for invalid structure", () => {
      const invalid = { version: "1.0.0" };
      const result = parseImportedPreferences(JSON.stringify(invalid));
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid preferences file format");
    });

    it("should reject newer version", () => {
      const newerVersion: ExportedPreferences = {
        version: "2.0.0",
        exportedAt: new Date().toISOString(),
        metrics: mockMetrics,
        schedule: mockSchedule,
      };

      const result = parseImportedPreferences(JSON.stringify(newerVersion));
      expect(result.success).toBe(false);
      expect(result.error).toContain("newer version");
    });
  });

  describe("mergePreferences", () => {
    it("should merge imported metrics with existing schedule", () => {
      const imported: ExportedPreferences = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        metrics: {
          selectedMetrics: ["overall", "cleanliness"],
          lastUpdated: Date.now(),
        },
        schedule: mockSchedule,
      };

      const existing = { metrics: mockMetrics, schedule: mockSchedule };
      const merged = mergePreferences(existing, imported);

      expect(merged.metrics.selectedMetrics).toEqual(["overall", "cleanliness"]);
      expect(merged.schedule).toEqual(mockSchedule);
    });

    it("should update lastUpdated timestamp", () => {
      const imported: ExportedPreferences = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        metrics: mockMetrics,
        schedule: mockSchedule,
      };

      const existing = { metrics: mockMetrics, schedule: mockSchedule };
      const beforeMerge = Date.now();
      const merged = mergePreferences(existing, imported);
      const afterMerge = Date.now();

      expect(merged.metrics.lastUpdated).toBeGreaterThanOrEqual(beforeMerge);
      expect(merged.metrics.lastUpdated).toBeLessThanOrEqual(afterMerge);
    });
  });

  describe("replacePreferences", () => {
    it("should replace all preferences with imported ones", () => {
      const imported: ExportedPreferences = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        metrics: {
          selectedMetrics: ["overall"],
          lastUpdated: Date.now(),
        },
        schedule: {
          defaultFrequency: "weekly",
          defaultHour: 14,
          defaultMinute: 30,
          defaultDayOfMonth: 1,
          lastUpdated: Date.now(),
        },
      };

      const replaced = replacePreferences(imported);

      expect(replaced.metrics.selectedMetrics).toEqual(["overall"]);
      expect(replaced.schedule.defaultFrequency).toBe("weekly");
      expect(replaced.schedule.defaultHour).toBe(14);
    });

    it("should update lastUpdated timestamp", () => {
      const imported: ExportedPreferences = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        metrics: mockMetrics,
        schedule: mockSchedule,
      };

      const beforeReplace = Date.now();
      const replaced = replacePreferences(imported);
      const afterReplace = Date.now();

      expect(replaced.metrics.lastUpdated).toBeGreaterThanOrEqual(beforeReplace);
      expect(replaced.metrics.lastUpdated).toBeLessThanOrEqual(afterReplace);
    });
  });
});
