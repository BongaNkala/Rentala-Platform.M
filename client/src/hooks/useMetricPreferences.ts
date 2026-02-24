import { useLocalStorage } from "./useLocalStorage";

export type ReportMetric = "overall" | "cleanliness" | "maintenance" | "communication" | "responsiveness" | "value" | "surveys" | "recommendations";

export interface MetricPreferences {
  selectedMetrics: ReportMetric[];
  lastUpdated: number;
}

const DEFAULT_METRICS: ReportMetric[] = [
  "overall",
  "cleanliness",
  "maintenance",
  "communication",
  "responsiveness",
  "value",
  "surveys",
  "recommendations",
];

const DEFAULT_PREFERENCES: MetricPreferences = {
  selectedMetrics: DEFAULT_METRICS,
  lastUpdated: Date.now(),
};

/**
 * Hook for managing metric preferences with localStorage persistence
 * @returns [preferences, updateMetrics, resetPreferences, isUsingDefaults]
 */
export function useMetricPreferences() {
  const [preferences, setPreferences, removePreferences] = useLocalStorage<MetricPreferences>(
    "rentala_metric_preferences",
    DEFAULT_PREFERENCES
  );

  const updateMetrics = (metrics: ReportMetric[]) => {
    setPreferences({
      selectedMetrics: metrics,
      lastUpdated: Date.now(),
    });
  };

  const resetPreferences = () => {
    removePreferences();
  };

  const isUsingDefaults = JSON.stringify(preferences.selectedMetrics) === JSON.stringify(DEFAULT_METRICS);

  return {
    selectedMetrics: preferences.selectedMetrics,
    updateMetrics,
    resetPreferences,
    isUsingDefaults,
    lastUpdated: new Date(preferences.lastUpdated),
  };
}

/**
 * Hook for managing schedule preferences with localStorage persistence
 */
export interface SchedulePreferences {
  defaultFrequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "annually";
  defaultHour: number;
  defaultMinute: number;
  defaultDayOfMonth: number;
  lastUpdated: number;
}

const DEFAULT_SCHEDULE_PREFERENCES: SchedulePreferences = {
  defaultFrequency: "monthly",
  defaultHour: 9,
  defaultMinute: 0,
  defaultDayOfMonth: 1,
  lastUpdated: Date.now(),
};

export function useSchedulePreferences() {
  const [preferences, setPreferences, removePreferences] = useLocalStorage<SchedulePreferences>(
    "rentala_schedule_preferences",
    DEFAULT_SCHEDULE_PREFERENCES
  );

  const updateSchedulePreferences = (updates: Partial<Omit<SchedulePreferences, "lastUpdated">>) => {
    setPreferences({
      ...preferences,
      ...updates,
      lastUpdated: Date.now(),
    });
  };

  const resetSchedulePreferences = () => {
    removePreferences();
  };

  return {
    defaultFrequency: preferences.defaultFrequency,
    defaultHour: preferences.defaultHour,
    defaultMinute: preferences.defaultMinute,
    defaultDayOfMonth: preferences.defaultDayOfMonth,
    updateSchedulePreferences,
    resetSchedulePreferences,
    lastUpdated: new Date(preferences.lastUpdated),
  };
}
