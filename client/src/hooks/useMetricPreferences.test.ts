import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMetricPreferences, useSchedulePreferences, type ReportMetric } from "./useMetricPreferences";

describe("useMetricPreferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should initialize with all metrics selected", () => {
    const { result } = renderHook(() => useMetricPreferences());
    expect(result.current.selectedMetrics).toHaveLength(8);
    expect(result.current.isUsingDefaults).toBe(true);
  });

  it("should update metrics and persist to localStorage", () => {
    const { result } = renderHook(() => useMetricPreferences());

    const newMetrics: ReportMetric[] = ["overall", "cleanliness"];

    act(() => {
      result.current.updateMetrics(newMetrics);
    });

    expect(result.current.selectedMetrics).toEqual(newMetrics);
    expect(result.current.isUsingDefaults).toBe(false);
  });

  it("should retrieve saved metrics from localStorage", () => {
    const savedMetrics: ReportMetric[] = ["overall", "maintenance"];
    localStorage.setItem(
      "rentala_metric_preferences",
      JSON.stringify({
        selectedMetrics: savedMetrics,
        lastUpdated: Date.now(),
      })
    );

    const { result } = renderHook(() => useMetricPreferences());
    expect(result.current.selectedMetrics).toEqual(savedMetrics);
  });

  it("should reset preferences to defaults", () => {
    const { result } = renderHook(() => useMetricPreferences());

    const newMetrics: ReportMetric[] = ["overall"];

    act(() => {
      result.current.updateMetrics(newMetrics);
    });

    expect(result.current.isUsingDefaults).toBe(false);

    act(() => {
      result.current.resetPreferences();
    });

    expect(result.current.isUsingDefaults).toBe(true);
  });

  it("should track last updated timestamp", () => {
    const { result } = renderHook(() => useMetricPreferences());

    const beforeUpdate = new Date();

    act(() => {
      result.current.updateMetrics(["overall"]);
    });

    const afterUpdate = new Date();

    expect(result.current.lastUpdated.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    expect(result.current.lastUpdated.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
  });
});

describe("useSchedulePreferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should initialize with default schedule preferences", () => {
    const { result } = renderHook(() => useSchedulePreferences());
    expect(result.current.defaultFrequency).toBe("monthly");
    expect(result.current.defaultHour).toBe(9);
    expect(result.current.defaultMinute).toBe(0);
    expect(result.current.defaultDayOfMonth).toBe(1);
  });

  it("should update schedule preferences", () => {
    const { result } = renderHook(() => useSchedulePreferences());

    act(() => {
      result.current.updateSchedulePreferences({
        defaultFrequency: "weekly",
        defaultHour: 14,
        defaultMinute: 30,
      });
    });

    expect(result.current.defaultFrequency).toBe("weekly");
    expect(result.current.defaultHour).toBe(14);
    expect(result.current.defaultMinute).toBe(30);
  });

  it("should persist schedule preferences to localStorage", () => {
    const { result } = renderHook(() => useSchedulePreferences());

    act(() => {
      result.current.updateSchedulePreferences({
        defaultFrequency: "quarterly",
        defaultDayOfMonth: 15,
      });
    });

    const stored = localStorage.getItem("rentala_schedule_preferences");
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.defaultFrequency).toBe("quarterly");
    expect(parsed.defaultDayOfMonth).toBe(15);
  });

  it("should retrieve saved schedule preferences from localStorage", () => {
    localStorage.setItem(
      "rentala_schedule_preferences",
      JSON.stringify({
        defaultFrequency: "biweekly",
        defaultHour: 10,
        defaultMinute: 15,
        defaultDayOfMonth: 5,
        lastUpdated: Date.now(),
      })
    );

    const { result } = renderHook(() => useSchedulePreferences());
    expect(result.current.defaultFrequency).toBe("biweekly");
    expect(result.current.defaultHour).toBe(10);
    expect(result.current.defaultMinute).toBe(15);
    expect(result.current.defaultDayOfMonth).toBe(5);
  });

  it("should reset schedule preferences to defaults", () => {
    const { result } = renderHook(() => useSchedulePreferences());

    act(() => {
      result.current.updateSchedulePreferences({
        defaultFrequency: "annually",
        defaultHour: 20,
      });
    });

    expect(result.current.defaultFrequency).toBe("annually");

    act(() => {
      result.current.resetSchedulePreferences();
    });

    expect(result.current.defaultFrequency).toBe("monthly");
    expect(result.current.defaultHour).toBe(9);
  });

  it("should track last updated timestamp", () => {
    const { result } = renderHook(() => useSchedulePreferences());

    const beforeUpdate = new Date();

    act(() => {
      result.current.updateSchedulePreferences({ defaultHour: 15 });
    });

    const afterUpdate = new Date();

    expect(result.current.lastUpdated.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    expect(result.current.lastUpdated.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
  });
});
