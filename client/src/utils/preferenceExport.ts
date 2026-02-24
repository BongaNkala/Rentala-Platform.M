import type { MetricPreferences, SchedulePreferences } from "@/hooks/useMetricPreferences";

export interface ExportedPreferences {
  version: string;
  exportedAt: string;
  metrics: MetricPreferences;
  schedule: SchedulePreferences;
}

const CURRENT_VERSION = "1.0.0";

/**
 * Export current preferences as a JSON file
 */
export function exportPreferences(
  metrics: MetricPreferences,
  schedule: SchedulePreferences
): string {
  const preferences: ExportedPreferences = {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    metrics,
    schedule,
  };

  return JSON.stringify(preferences, null, 2);
}

/**
 * Generate a filename for the exported preferences
 */
export function generateExportFilename(): string {
  const timestamp = new Date().toISOString().split("T")[0];
  return `rentala-preferences-${timestamp}.json`;
}

/**
 * Trigger browser download of preferences file
 */
export function downloadPreferencesFile(content: string, filename: string): void {
  const element = document.createElement("a");
  element.setAttribute("href", `data:application/json;charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Validate imported preferences structure
 */
export function validatePreferences(data: unknown): data is ExportedPreferences {
  if (!data || typeof data !== "object") {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Check required fields
  if (typeof obj.version !== "string" || typeof obj.exportedAt !== "string") {
    return false;
  }

  // Validate metrics object
  if (!obj.metrics || typeof obj.metrics !== "object") {
    return false;
  }

  const metrics = obj.metrics as Record<string, unknown>;
  if (!Array.isArray(metrics.selectedMetrics) || typeof metrics.lastUpdated !== "number") {
    return false;
  }

  // Validate schedule object
  if (!obj.schedule || typeof obj.schedule !== "object") {
    return false;
  }

  const schedule = obj.schedule as Record<string, unknown>;
  if (
    typeof schedule.defaultFrequency !== "string" ||
    typeof schedule.defaultHour !== "number" ||
    typeof schedule.defaultMinute !== "number" ||
    typeof schedule.defaultDayOfMonth !== "number" ||
    typeof schedule.lastUpdated !== "number"
  ) {
    return false;
  }

  return true;
}

/**
 * Parse and validate imported preferences file
 */
export function parseImportedPreferences(fileContent: string): {
  success: boolean;
  data?: ExportedPreferences;
  error?: string;
} {
  try {
    const parsed = JSON.parse(fileContent);

    if (!validatePreferences(parsed)) {
      return {
        success: false,
        error: "Invalid preferences file format. Please ensure the file is a valid exported preferences file.",
      };
    }

    // Check version compatibility
    const [major] = parsed.version.split(".").map(Number);
    const [currentMajor] = CURRENT_VERSION.split(".").map(Number);

    if (major > currentMajor) {
      return {
        success: false,
        error: `This preferences file was created with a newer version of Rentala (v${parsed.version}). Please update the application.`,
      };
    }

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse preferences file: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Merge imported preferences with existing ones
 */
export function mergePreferences(
  existing: { metrics: MetricPreferences; schedule: SchedulePreferences },
  imported: ExportedPreferences
): { metrics: MetricPreferences; schedule: SchedulePreferences } {
  return {
    metrics: {
      ...existing.metrics,
      selectedMetrics: imported.metrics.selectedMetrics,
      lastUpdated: Date.now(),
    },
    schedule: {
      ...existing.schedule,
      ...imported.schedule,
      lastUpdated: Date.now(),
    },
  };
}

/**
 * Replace existing preferences with imported ones
 */
export function replacePreferences(imported: ExportedPreferences): {
  metrics: MetricPreferences;
  schedule: SchedulePreferences;
} {
  return {
    metrics: {
      ...imported.metrics,
      lastUpdated: Date.now(),
    },
    schedule: {
      ...imported.schedule,
      lastUpdated: Date.now(),
    },
  };
}
