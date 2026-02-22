import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { propertiesRouter } from "./routers/properties";
import { unitsRouter } from "./routers/units";
import { tenantsRouter } from "./routers/tenants";
import { leasesRouter } from "./routers/leases";
import { paymentsRouter } from "./routers/payments";
import { maintenanceRouter } from "./routers/maintenance";
import { inspectionsRouter } from "./routers/inspections";
import { accountingRouter } from "./routers/accounting";
import { pdfExportRouter } from "./routers/pdfExport";
import { notificationsRouter } from "./routers/notifications";
import { smsNotificationsRouter } from "./routers/smsNotifications";
import { videoAnalyticsRouter } from "./routers/videoAnalytics";
import { propertyAnalyticsRouter } from "./routers/propertyAnalytics";

export const appRouter = router({
  // Core system routes
  system: systemRouter,
  
  // Authentication
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Property Management System Routes
  properties: propertiesRouter,
  units: unitsRouter,
  tenants: tenantsRouter,
  leases: leasesRouter,
  payments: paymentsRouter,
  maintenance: maintenanceRouter,
  inspections: inspectionsRouter,
  accounting: accountingRouter,
  pdfExport: pdfExportRouter,
  notifications: notificationsRouter,
  smsNotifications: smsNotificationsRouter,
  videoAnalytics: videoAnalyticsRouter,
  propertyAnalytics: propertyAnalyticsRouter,
});

export type AppRouter = typeof appRouter;
