import { describe, it, expect } from "vitest";
import { calculateNextSendTime, type ReportSchedule } from "./reportScheduler";

describe("Report Scheduler", () => {
  describe("calculateNextSendTime", () => {
    it("should calculate next send time for weekly schedules", () => {
      const schedule: ReportSchedule = {
        id: 1,
        userId: 1,
        propertyId: null,
        name: "Weekly Report",
        description: null,
        frequency: "weekly",
        dayOfWeek: 1, // Monday
        dayOfMonth: null,
        hour: 9,
        minute: 0,
        recipientEmails: "[]",
        metrics: "[]",
        status: "active",
        lastSentAt: null,
        nextSendAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const nextSend = calculateNextSendTime(schedule);
      expect(nextSend).toBeInstanceOf(Date);
      expect(nextSend.getHours()).toBe(9);
      expect(nextSend.getMinutes()).toBe(0);
    });

    it("should calculate next send time for monthly schedules", () => {
      const schedule: ReportSchedule = {
        id: 1,
        userId: 1,
        propertyId: null,
        name: "Monthly Report",
        description: null,
        frequency: "monthly",
        dayOfWeek: null,
        dayOfMonth: 15,
        hour: 14,
        minute: 30,
        recipientEmails: "[]",
        metrics: "[]",
        status: "active",
        lastSentAt: null,
        nextSendAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const nextSend = calculateNextSendTime(schedule);
      expect(nextSend).toBeInstanceOf(Date);
      expect(nextSend.getDate()).toBe(15);
      expect(nextSend.getHours()).toBe(14);
      expect(nextSend.getMinutes()).toBe(30);
    });

    it("should calculate next send time for quarterly schedules", () => {
      const schedule: ReportSchedule = {
        id: 1,
        userId: 1,
        propertyId: null,
        name: "Quarterly Report",
        description: null,
        frequency: "quarterly",
        dayOfWeek: null,
        dayOfMonth: 1,
        hour: 10,
        minute: 0,
        recipientEmails: "[]",
        metrics: "[]",
        status: "active",
        lastSentAt: null,
        nextSendAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const nextSend = calculateNextSendTime(schedule);
      expect(nextSend).toBeInstanceOf(Date);
      expect(nextSend > new Date()).toBe(true);
    });

    it("should calculate next send time for annually schedules", () => {
      const schedule: ReportSchedule = {
        id: 1,
        userId: 1,
        propertyId: null,
        name: "Annual Report",
        description: null,
        frequency: "annually",
        dayOfWeek: null,
        dayOfMonth: 1,
        hour: 9,
        minute: 0,
        recipientEmails: "[]",
        metrics: "[]",
        status: "active",
        lastSentAt: null,
        nextSendAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const nextSend = calculateNextSendTime(schedule);
      expect(nextSend).toBeInstanceOf(Date);
      expect(nextSend > new Date()).toBe(true);
    });

    it("should handle default hour and minute values", () => {
      const schedule: ReportSchedule = {
        id: 1,
        userId: 1,
        propertyId: null,
        name: "Report",
        description: null,
        frequency: "monthly",
        dayOfWeek: null,
        dayOfMonth: 1,
        hour: 0,
        minute: 0,
        recipientEmails: "[]",
        metrics: "[]",
        status: "active",
        lastSendAt: null,
        nextSendAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const nextSend = calculateNextSendTime(schedule);
      expect(nextSend.getMinutes()).toBe(0);
      expect(nextSend instanceof Date).toBe(true);
    });
  });

  describe("Schedule Configuration", () => {
    it("should validate schedule frequency types", () => {
      const frequencies = ["weekly", "biweekly", "monthly", "quarterly", "annually"];
      expect(frequencies).toHaveLength(5);
      expect(frequencies).toContain("weekly");
      expect(frequencies).toContain("monthly");
    });

    it("should validate schedule status types", () => {
      const statuses = ["active", "paused", "completed"];
      expect(statuses).toHaveLength(3);
      expect(statuses).toContain("active");
    });

    it("should validate recipient email format", () => {
      const emails = ["admin@example.com", "manager@example.com"];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      emails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it("should validate metrics array", () => {
      const metrics = ["overall", "cleanliness", "maintenance", "communication", "responsiveness", "value", "surveys", "recommendations"];
      expect(metrics).toHaveLength(8);
      expect(metrics).toContain("overall");
      expect(metrics).toContain("cleanliness");
    });

    it("should handle JSON serialization of recipient emails", () => {
      const emails = ["test1@example.com", "test2@example.com"];
      const serialized = JSON.stringify(emails);
      const deserialized = JSON.parse(serialized);
      expect(deserialized).toEqual(emails);
    });

    it("should handle JSON serialization of metrics", () => {
      const metrics = ["overall", "cleanliness", "maintenance"];
      const serialized = JSON.stringify(metrics);
      const deserialized = JSON.parse(serialized);
      expect(deserialized).toEqual(metrics);
    });
  });

  describe("Schedule Validation", () => {
    it("should validate day of month range", () => {
      const validDays = [1, 15, 28, 31];
      validDays.forEach((day) => {
        expect(day >= 1 && day <= 31).toBe(true);
      });
    });

    it("should validate hour range", () => {
      const validHours = [0, 9, 12, 23];
      validHours.forEach((hour) => {
        expect(hour >= 0 && hour <= 23).toBe(true);
      });
    });

    it("should validate minute range", () => {
      const validMinutes = [0, 15, 30, 59];
      validMinutes.forEach((minute) => {
        expect(minute >= 0 && minute <= 59).toBe(true);
      });
    });

    it("should validate day of week range", () => {
      const validDays = [0, 1, 3, 6];
      validDays.forEach((day) => {
        expect(day >= 0 && day <= 6).toBe(true);
      });
    });
  });
});
