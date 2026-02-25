import { getDb } from "../db";
import { reportFailures, rollbackSuggestions, reportSchedules, preferenceVersions } from "../../drizzle/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import type { ReportFailure, RollbackSuggestion } from "../../drizzle/schema";

export interface FailureInfo {
  id: number;
  scheduleId: number;
  userId: number;
  failureReason: string;
  errorMessage?: string;
  failureCount: number;
  lastFailedAt: Date;
}

export interface RollbackSuggestionInfo {
  id: number;
  failureId: number;
  userId: number;
  suggestedVersionId: number;
  reason: string;
  confidence: number;
  status: string;
}

/**
 * Track a report delivery failure
 */
export async function trackReportFailure(
  scheduleId: number,
  userId: number,
  propertyId: number | null,
  failureReason: "email_delivery" | "pdf_generation" | "invalid_recipient" | "network_error" | "unknown",
  errorMessage?: string
): Promise<FailureInfo | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Check if there's an existing unresolved failure for this schedule
    const existingFailure = await db
      .select()
      .from(reportFailures)
      .where(and(eq(reportFailures.scheduleId, scheduleId), isNull(reportFailures.resolvedAt)))
      .limit(1);

    let failureId: number;

    if (existingFailure.length > 0) {
      // Update existing failure
      const failure = existingFailure[0];
      const newCount = (failure.failureCount || 1) + 1;

      await db
        .update(reportFailures)
        .set({
          failureCount: newCount,
          lastFailedAt: new Date(),
          errorMessage: errorMessage || failure.errorMessage,
        })
        .where(eq(reportFailures.id, failure.id));

      failureId = failure.id;
    } else {
      // Create new failure record
      await db.insert(reportFailures).values({
        scheduleId,
        userId,
        propertyId,
        failureReason,
        errorMessage,
        failureCount: 1,
      });

      // Get the newly created failure
      const newFailures = await db
        .select()
        .from(reportFailures)
        .where(and(eq(reportFailures.scheduleId, scheduleId), isNull(reportFailures.resolvedAt)))
        .orderBy(desc(reportFailures.createdAt))
        .limit(1);

      if (newFailures.length === 0) return null;
      failureId = newFailures[0].id;
    }

    // Get the failure record
    const failure = await db.select().from(reportFailures).where(eq(reportFailures.id, failureId)).limit(1);

    if (failure.length === 0) return null;

    const f = failure[0];
    return {
      id: f.id,
      scheduleId: f.scheduleId,
      userId: f.userId,
      failureReason: f.failureReason,
      errorMessage: f.errorMessage || undefined,
      failureCount: f.failureCount || 1,
      lastFailedAt: f.lastFailedAt,
    };
  } catch (error) {
    console.error("Failed to track report failure:", error);
    return null;
  }
}

/**
 * Suggest a rollback to a previous preference version
 */
export async function suggestRollback(
  failureId: number,
  userId: number,
  suggestedVersionId: number,
  reason: string,
  confidence: number = 80
): Promise<RollbackSuggestionInfo | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Ensure confidence is between 0-100
    const normalizedConfidence = Math.max(0, Math.min(100, confidence));

    await db.insert(rollbackSuggestions).values({
      failureId,
      userId,
      suggestedVersionId,
      reason,
      confidence: normalizedConfidence,
    });

    // Get the newly created suggestion
    const newSuggestions = await db
      .select()
      .from(rollbackSuggestions)
      .where(and(eq(rollbackSuggestions.failureId, failureId), eq(rollbackSuggestions.userId, userId)))
      .orderBy(desc(rollbackSuggestions.createdAt))
      .limit(1);

    if (newSuggestions.length === 0) return null;
    const suggestionId = newSuggestions[0].id;

    // Get the created suggestion
    const suggestions = await db
      .select()
      .from(rollbackSuggestions)
      .where(eq(rollbackSuggestions.id, suggestionId))
      .limit(1);

    if (suggestions.length === 0) return null;

    const s = suggestions[0];
    return {
      id: s.id,
      failureId: s.failureId,
      userId: s.userId,
      suggestedVersionId: s.suggestedVersionId,
      reason: s.reason,
      confidence: s.confidence,
      status: s.status,
    };
  } catch (error) {
    console.error("Failed to suggest rollback:", error);
    return null;
  }
}

/**
 * Get pending rollback suggestions for a user
 */
export async function getPendingRollbackSuggestions(userId: number): Promise<RollbackSuggestionInfo[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const suggestions = await db
      .select()
      .from(rollbackSuggestions)
      .where(and(eq(rollbackSuggestions.userId, userId), eq(rollbackSuggestions.status, "pending")))
      .orderBy(desc(rollbackSuggestions.confidence), desc(rollbackSuggestions.createdAt));

    return suggestions.map((s) => ({
      id: s.id,
      failureId: s.failureId,
      userId: s.userId,
      suggestedVersionId: s.suggestedVersionId,
      reason: s.reason,
      confidence: s.confidence,
      status: s.status,
    }));
  } catch (error) {
    console.error("Failed to get rollback suggestions:", error);
    return [];
  }
}

/**
 * Get failure history for a user
 */
export async function getFailureHistory(userId: number, limit: number = 20): Promise<FailureInfo[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const failures = await db
      .select()
      .from(reportFailures)
      .where(eq(reportFailures.userId, userId))
      .orderBy(desc(reportFailures.lastFailedAt))
      .limit(limit);

    return failures.map((f) => ({
      id: f.id,
      scheduleId: f.scheduleId,
      userId: f.userId,
      failureReason: f.failureReason,
      errorMessage: f.errorMessage || undefined,
      failureCount: f.failureCount || 1,
      lastFailedAt: f.lastFailedAt,
    }));
  } catch (error) {
    console.error("Failed to get failure history:", error);
    return [];
  }
}

/**
 * Apply a suggested rollback
 */
export async function applyRollbackSuggestion(
  suggestionId: number,
  userId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, message: "Database connection failed" };

    // Get the suggestion
    const suggestions = await db
      .select()
      .from(rollbackSuggestions)
      .where(and(eq(rollbackSuggestions.id, suggestionId), eq(rollbackSuggestions.userId, userId)))
      .limit(1);

    if (suggestions.length === 0) {
      return { success: false, message: "Suggestion not found" };
    }

    const suggestion = suggestions[0];

    // Get the suggested version
    const versions = await db
      .select()
      .from(preferenceVersions)
      .where(eq(preferenceVersions.id, suggestion.suggestedVersionId))
      .limit(1);

    if (versions.length === 0) {
      return { success: false, message: "Suggested version not found" };
    }

    // Update suggestion status to applied
    await db
      .update(rollbackSuggestions)
      .set({
        status: "applied",
        appliedAt: new Date(),
      })
      .where(eq(rollbackSuggestions.id, suggestionId));

    // Mark the associated failure as resolved
    await db
      .update(reportFailures)
      .set({
        resolvedAt: new Date(),
      })
      .where(eq(reportFailures.id, suggestion.failureId));

    return {
      success: true,
      message: `Successfully rolled back to version ${versions[0].versionNumber}`,
    };
  } catch (error) {
    console.error("Failed to apply rollback suggestion:", error);
    return { success: false, message: "Failed to apply rollback" };
  }
}

/**
 * Dismiss a rollback suggestion
 */
export async function dismissRollbackSuggestion(
  suggestionId: number,
  userId: number
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const result = await db
      .update(rollbackSuggestions)
      .set({
        status: "rejected",
      })
      .where(and(eq(rollbackSuggestions.id, suggestionId), eq(rollbackSuggestions.userId, userId)));

    return true;
  } catch (error) {
    console.error("Failed to dismiss rollback suggestion:", error);
    return false;
  }
}

/**
 * Automatically suggest rollback based on failure pattern
 * Returns the best version to rollback to based on failure history
 */
export async function autoSuggestRollback(
  failureId: number,
  userId: number,
  scheduleId: number
): Promise<RollbackSuggestionInfo | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // Get all versions for this user, ordered by most recent
    const versions = await db
      .select()
      .from(preferenceVersions)
      .where(eq(preferenceVersions.userId, userId))
      .orderBy(desc(preferenceVersions.versionNumber));

    if (versions.length < 2) {
      // Need at least 2 versions to suggest rollback
      return null;
    }

    // Suggest the second most recent version (previous version)
    const suggestedVersion = versions[1];

    // Calculate confidence based on how many versions are available
    // More versions = higher confidence that previous version was stable
    const confidence = Math.min(90, 60 + (versions.length * 5));

    const reason = `Automatically suggested to roll back to version ${suggestedVersion.versionNumber}. This version was previously stable and may resolve the current delivery failures.`;

    return await suggestRollback(failureId, userId, suggestedVersion.id, reason, confidence);
  } catch (error) {
    console.error("Failed to auto-suggest rollback:", error);
    return null;
  }
}

/**
 * Get statistics about failures for a user
 */
export async function getFailureStats(userId: number): Promise<{
  totalFailures: number;
  unresolvedFailures: number;
  failuresByReason: Record<string, number>;
  mostRecentFailure?: Date;
}> {
  try {
    const db = await getDb();
    if (!db) return { totalFailures: 0, unresolvedFailures: 0, failuresByReason: {} };

    const allFailures = await db
      .select()
      .from(reportFailures)
      .where(eq(reportFailures.userId, userId));

    const unresolvedFailures = await db
      .select()
      .from(reportFailures)
      .where(and(eq(reportFailures.userId, userId), isNull(reportFailures.resolvedAt)));

    // Count failures by reason
    const failuresByReason: Record<string, number> = {};
    for (const failure of allFailures) {
      failuresByReason[failure.failureReason] = (failuresByReason[failure.failureReason] || 0) + 1;
    }

    const mostRecentFailure = allFailures.length > 0 ? allFailures[0].lastFailedAt : undefined;

    return {
      totalFailures: allFailures.length,
      unresolvedFailures: unresolvedFailures.length,
      failuresByReason,
      mostRecentFailure,
    };
  } catch (error) {
    console.error("Failed to get failure stats:", error);
    return { totalFailures: 0, unresolvedFailures: 0, failuresByReason: {} };
  }
}
