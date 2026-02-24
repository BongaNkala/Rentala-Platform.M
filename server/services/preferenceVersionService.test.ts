import { describe, it, expect } from "vitest";
import {
  calculateVersionDiff,
  formatVersionTimestamp,
  type VersionDiff,
} from "./preferenceVersionService";

describe("preferenceVersionService", () => {
  describe("calculateVersionDiff", () => {
    it("should detect added metrics", () => {
      const diff = calculateVersionDiff(
        ["overall", "cleanliness"],
        ["overall", "cleanliness", "maintenance"],
        "monthly",
        "monthly",
        { hour: 9, minute: 0 },
        { hour: 9, minute: 0 }
      );

      expect(diff.metricsAdded).toContain("maintenance");
      expect(diff.metricsRemoved).toHaveLength(0);
    });

    it("should detect removed metrics", () => {
      const diff = calculateVersionDiff(
        ["overall", "cleanliness", "maintenance"],
        ["overall", "cleanliness"],
        "monthly",
        "monthly",
        { hour: 9, minute: 0 },
        { hour: 9, minute: 0 }
      );

      expect(diff.metricsRemoved).toContain("maintenance");
      expect(diff.metricsAdded).toHaveLength(0);
    });

    it("should detect frequency changes", () => {
      const diff = calculateVersionDiff(
        ["overall"],
        ["overall"],
        "monthly",
        "weekly",
        { hour: 9, minute: 0 },
        { hour: 9, minute: 0 }
      );

      expect(diff.frequencyChanged).toBe(true);
      expect(diff.oldFrequency).toBe("monthly");
      expect(diff.newFrequency).toBe("weekly");
    });

    it("should detect time changes", () => {
      const diff = calculateVersionDiff(
        ["overall"],
        ["overall"],
        "monthly",
        "monthly",
        { hour: 9, minute: 0 },
        { hour: 14, minute: 30 }
      );

      expect(diff.timeChanged).toBe(true);
      expect(diff.oldTime).toBe("09:00");
      expect(diff.newTime).toBe("14:30");
    });

    it("should handle no changes", () => {
      const diff = calculateVersionDiff(
        ["overall", "cleanliness"],
        ["overall", "cleanliness"],
        "monthly",
        "monthly",
        { hour: 9, minute: 0 },
        { hour: 9, minute: 0 }
      );

      expect(diff.metricsAdded).toHaveLength(0);
      expect(diff.metricsRemoved).toHaveLength(0);
      expect(diff.frequencyChanged).toBe(false);
      expect(diff.timeChanged).toBe(false);
    });

    it("should handle multiple metric changes", () => {
      const diff = calculateVersionDiff(
        ["overall", "cleanliness"],
        ["maintenance", "communication", "responsiveness"],
        "monthly",
        "monthly",
        { hour: 9, minute: 0 },
        { hour: 9, minute: 0 }
      );

      expect(diff.metricsAdded).toHaveLength(3);
      expect(diff.metricsRemoved).toHaveLength(2);
    });
  });

  describe("formatVersionTimestamp", () => {
    it("should format date correctly", () => {
      const date = new Date("2026-02-25T14:30:00Z");
      const formatted = formatVersionTimestamp(date);

      expect(formatted).toContain("Feb");
      expect(formatted).toContain("25");
      expect(formatted).toContain("2026");
    });

    it("should include time components", () => {
      const date = new Date("2026-02-25T14:30:45Z");
      const formatted = formatVersionTimestamp(date);

      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it("should handle different dates", () => {
      const date1 = new Date("2026-01-01T09:00:00Z");
      const date2 = new Date("2026-12-31T23:59:59Z");

      const formatted1 = formatVersionTimestamp(date1);
      const formatted2 = formatVersionTimestamp(date2);

      expect(formatted1).toContain("Jan");
      expect(formatted2).toContain("Dec");
      expect(formatted1).not.toBe(formatted2);
    });
  });

  describe("version diff structure", () => {
    it("should have all required diff properties", () => {
      const diff = calculateVersionDiff(
        ["overall"],
        ["overall", "cleanliness"],
        "monthly",
        "weekly",
        { hour: 9, minute: 0 },
        { hour: 14, minute: 30 }
      );

      expect(diff).toHaveProperty("metricsAdded");
      expect(diff).toHaveProperty("metricsRemoved");
      expect(diff).toHaveProperty("frequencyChanged");
      expect(diff).toHaveProperty("timeChanged");
      expect(diff).toHaveProperty("oldFrequency");
      expect(diff).toHaveProperty("newFrequency");
      expect(diff).toHaveProperty("oldTime");
      expect(diff).toHaveProperty("newTime");
    });

    it("should not include old values when unchanged", () => {
      const diff = calculateVersionDiff(
        ["overall"],
        ["overall"],
        "monthly",
        "monthly",
        { hour: 9, minute: 0 },
        { hour: 9, minute: 0 }
      );

      expect(diff.oldFrequency).toBeUndefined();
      expect(diff.newFrequency).toBeUndefined();
      expect(diff.oldTime).toBeUndefined();
      expect(diff.newTime).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle empty metric arrays", () => {
      const diff = calculateVersionDiff(
        [],
        ["overall"],
        "monthly",
        "monthly",
        { hour: 9, minute: 0 },
        { hour: 9, minute: 0 }
      );

      expect(diff.metricsAdded).toContain("overall");
      expect(diff.metricsRemoved).toHaveLength(0);
    });

    it("should handle midnight time", () => {
      const diff = calculateVersionDiff(
        ["overall"],
        ["overall"],
        "monthly",
        "monthly",
        { hour: 0, minute: 0 },
        { hour: 0, minute: 0 }
      );

      expect(diff.oldTime).toBeUndefined();
      expect(diff.newTime).toBeUndefined();
    });

    it("should handle end of day time", () => {
      const diff = calculateVersionDiff(
        ["overall"],
        ["overall"],
        "monthly",
        "monthly",
        { hour: 23, minute: 59 },
        { hour: 23, minute: 59 }
      );

      expect(diff.oldTime).toBeUndefined();
      expect(diff.newTime).toBeUndefined();
    });
  });
});
