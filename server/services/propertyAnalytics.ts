import { getDb } from "../db";
import { properties, units, leases, payments, maintenanceRequests, tenantSatisfactionSurveys } from "../../drizzle/schema";
import { gte, sql, and, eq } from "drizzle-orm";

/**
 * Property Analytics Service
 * Provides insights on vacancy trends, income forecasts, maintenance costs, and tenant payment behavior
 */

export interface VacancyTrend {
  month: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  vacancyRate: number;
}

export interface IncomeForecast {
  month: string;
  projectedIncome: number;
  actualIncome: number;
  difference: number;
}

export interface MaintenanceCost {
  category: string;
  count: number;
  totalCost: number;
  averageCost: number;
}

export interface TenantPaymentBehavior {
  status: string;
  count: number;
  percentage: number;
  totalAmount: number;
}

export interface PropertyPerformance {
  propertyId: number;
  propertyName: string;
  totalUnits: number;
  occupiedUnits: number;
  vacancyRate: number;
  monthlyIncome: number;
  maintenanceCost: number;
  netIncome: number;
}

export interface TenantSatisfactionTrend {
  month: string;
  averageSatisfaction: number;
  averageCleanliness: number;
  averageMaintenance: number;
  averageCommunication: number;
  averageResponsiveness: number;
  averageValueForMoney: number;
  surveyCount: number;
  recommendPercentage: number;
}

/**
 * Get vacancy trends over time
 */
export async function getVacancyTrends(months: number = 12): Promise<VacancyTrend[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const trends: VacancyTrend[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Get total units
      const totalUnitsResult = await db
        .select({ count: sql<number>`COUNT(*) as count` })
        .from(units);

      // Get occupied units (active leases in this month)
      const occupiedResult = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${units.id}) as count` })
        .from(leases)
        .innerJoin(units, eq(leases.unitId, units.id))
        .where(
          and(
            gte(leases.startDate, sql`${monthStart}`),
            gte(sql`${monthEnd}`, leases.startDate)
          )
        );

      const totalUnits = totalUnitsResult[0]?.count || 0;
      const occupiedUnits = occupiedResult[0]?.count || 0;
      const vacantUnits = totalUnits - occupiedUnits;
      const vacancyRate = totalUnits > 0 ? (vacantUnits / totalUnits) * 100 : 0;

      trends.push({
        month: monthStart.toLocaleDateString("en-US", { year: "numeric", month: "short" }),
        totalUnits,
        occupiedUnits,
        vacantUnits,
        vacancyRate: Math.round(vacancyRate * 10) / 10,
      });
    }

    return trends;
  } catch (error) {
    console.error("Failed to get vacancy trends:", error);
    return [];
  }
}

/**
 * Get income forecast vs actual
 */
export async function getIncomeForecast(months: number = 12): Promise<IncomeForecast[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const forecasts: IncomeForecast[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Get actual income from payments
      const actualResult = await db
        .select({ total: sql<number>`SUM(amount) as total` })
        .from(payments)
        .where(
          and(
            gte(payments.paidDate, sql`${monthStart}`),
            gte(sql`${monthEnd}`, payments.paidDate),
            eq(payments.status, "paid")
          )
        );

      // Get projected income from active leases
      const projectedResult = await db
        .select({ total: sql<number>`SUM(${units.rentAmount}) as total` })
        .from(leases)
        .innerJoin(units, eq(leases.unitId, units.id))
        .where(
          and(
            gte(leases.startDate, sql`${monthStart}`),
            gte(sql`${monthEnd}`, leases.startDate)
          )
        );

      const actualIncome = actualResult[0]?.total || 0;
      const projectedIncome = projectedResult[0]?.total || 0;
      const difference = projectedIncome - actualIncome;

      forecasts.push({
        month: monthStart.toLocaleDateString("en-US", { year: "numeric", month: "short" }),
        projectedIncome: Math.round(projectedIncome),
        actualIncome: Math.round(actualIncome),
        difference: Math.round(difference),
      });
    }

    return forecasts;
  } catch (error) {
    console.error("Failed to get income forecast:", error);
    return [];
  }
}

/**
 * Get maintenance cost breakdown
 */
export async function getMaintenanceCosts(): Promise<MaintenanceCost[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const costs = await db
      .select({
        category: maintenanceRequests.category,
        count: sql<number>`COUNT(*) as count`,
        totalCost: sql<number>`SUM(COALESCE(cost, 0)) as totalCost`,
      })
      .from(maintenanceRequests)
      .groupBy(maintenanceRequests.category);

    return costs.map((c) => ({
      category: c.category || "Other",
      count: c.count || 0,
      totalCost: Math.round(c.totalCost || 0),
      averageCost: Math.round((c.totalCost || 0) / (c.count || 1)),
    }));
  } catch (error) {
    console.error("Failed to get maintenance costs:", error);
    return [];
  }
}

/**
 * Get tenant payment behavior
 */
export async function getTenantPaymentBehavior(): Promise<TenantPaymentBehavior[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const total = await db
      .select({ count: sql<number>`COUNT(*) as count` })
      .from(payments);

    const totalCount = total[0]?.count || 1;

    const behavior = await db
      .select({
        status: payments.status,
        count: sql<number>`COUNT(*) as count`,
        totalAmount: sql<number>`SUM(amount) as totalAmount`,
      })
      .from(payments)
      .groupBy(payments.status);

    return behavior.map((b) => ({
      status: b.status || "unknown",
      count: b.count || 0,
      percentage: Math.round(((b.count || 0) / totalCount) * 100),
      totalAmount: Math.round(b.totalAmount || 0),
    }));
  } catch (error) {
    console.error("Failed to get tenant payment behavior:", error);
    return [];
  }
}

/**
 * Get property performance metrics
 */
export async function getPropertyPerformance(): Promise<PropertyPerformance[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const props = await db
      .select({
        id: properties.id,
        name: properties.name,
      })
      .from(properties);

    const performance: PropertyPerformance[] = [];

    for (const prop of props) {
      // Get total units
      const totalUnitsResult = await db
        .select({ count: sql<number>`COUNT(*) as count` })
        .from(units)
        .where(eq(units.propertyId, prop.id));

      // Get occupied units
      const occupiedResult = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${units.id}) as count` })
        .from(leases)
        .innerJoin(units, eq(leases.unitId, units.id))
        .where(eq(units.propertyId, prop.id));

      // Get monthly income
      const incomeResult = await db
        .select({ total: sql<number>`SUM(amount) as total` })
        .from(payments)
        .innerJoin(leases, eq(payments.leaseId, leases.id))
        .innerJoin(units, eq(leases.unitId, units.id))
        .where(eq(units.propertyId, prop.id));

      // Get maintenance costs
      const maintenanceResult = await db
        .select({ total: sql<number>`SUM(COALESCE(cost, 0)) as total` })
        .from(maintenanceRequests)
        .where(eq(maintenanceRequests.propertyId, prop.id));

      const totalUnits = totalUnitsResult[0]?.count || 0;
      const occupiedUnits = occupiedResult[0]?.count || 0;
      const monthlyIncome = incomeResult[0]?.total || 0;
      const maintenanceCost = maintenanceResult[0]?.total || 0;
      const vacancyRate = totalUnits > 0 ? ((totalUnits - occupiedUnits) / totalUnits) * 100 : 0;

      performance.push({
        propertyId: prop.id,
        propertyName: prop.name,
        totalUnits,
        occupiedUnits,
        vacancyRate: Math.round(vacancyRate * 10) / 10,
        monthlyIncome: Math.round(monthlyIncome),
        maintenanceCost: Math.round(maintenanceCost),
        netIncome: Math.round(monthlyIncome - maintenanceCost),
      });
    }

    return performance;
  } catch (error) {
    console.error("Failed to get property performance:", error);
    return [];
  }
}

/**
 * Get tenant satisfaction trends over time
 */
export async function getTenantSatisfactionTrends(months: number = 12): Promise<TenantSatisfactionTrend[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const trends: TenantSatisfactionTrend[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Get satisfaction data for the month
      const satisfactionData = await db
        .select({
          overallSatisfaction: sql<number>`AVG(${tenantSatisfactionSurveys.overallSatisfaction}) as overallSatisfaction`,
          cleanliness: sql<number>`AVG(${tenantSatisfactionSurveys.cleanliness}) as cleanliness`,
          maintenance: sql<number>`AVG(${tenantSatisfactionSurveys.maintenance}) as maintenance`,
          communication: sql<number>`AVG(${tenantSatisfactionSurveys.communication}) as communication`,
          responsiveness: sql<number>`AVG(${tenantSatisfactionSurveys.responsiveness}) as responsiveness`,
          valueForMoney: sql<number>`AVG(${tenantSatisfactionSurveys.valueForMoney}) as valueForMoney`,
          surveyCount: sql<number>`COUNT(*) as surveyCount`,
          recommendCount: sql<number>`SUM(CASE WHEN ${tenantSatisfactionSurveys.wouldRecommend} = true THEN 1 ELSE 0 END) as recommendCount`,
        })
        .from(tenantSatisfactionSurveys)
        .where(
          and(
            gte(tenantSatisfactionSurveys.surveyDate, sql`${monthStart}`),
            gte(sql`${monthEnd}`, tenantSatisfactionSurveys.surveyDate)
          )
        );

      const data = satisfactionData[0];
      const surveyCount = data?.surveyCount || 0;
      const recommendCount = data?.recommendCount || 0;

      if (surveyCount > 0) {
        trends.push({
          month: monthStart.toLocaleDateString("en-US", { year: "numeric", month: "short" }),
          averageSatisfaction: Math.round((data?.overallSatisfaction || 0) * 10) / 10,
          averageCleanliness: Math.round((data?.cleanliness || 0) * 10) / 10,
          averageMaintenance: Math.round((data?.maintenance || 0) * 10) / 10,
          averageCommunication: Math.round((data?.communication || 0) * 10) / 10,
          averageResponsiveness: Math.round((data?.responsiveness || 0) * 10) / 10,
          averageValueForMoney: Math.round((data?.valueForMoney || 0) * 10) / 10,
          surveyCount,
          recommendPercentage: Math.round((recommendCount / surveyCount) * 100),
        });
      }
    }

    return trends;
  } catch (error) {
    console.error("Failed to get tenant satisfaction trends:", error);
    return [];
  }
}

