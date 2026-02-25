import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  date,
  boolean,
  longtext,
  index
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with Rentala-specific fields for multi-tenant support.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["super_admin", "agency_admin", "landlord", "staff", "tenant"]).default("tenant").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  profileImage: varchar("profileImage", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  roleIdx: index("role_idx").on(table.role),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agencies/Property Management Companies
 */
export const agencies = mysqlTable("agencies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("South Africa"),
  logo: varchar("logo", { length: 512 }),
  website: varchar("website", { length: 512 }),
  taxId: varchar("taxId", { length: 50 }),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  nameIdx: index("agency_name_idx").on(table.name),
}));

export type Agency = typeof agencies.$inferSelect;
export type InsertAgency = typeof agencies.$inferInsert;

/**
 * Agency-User relationships (staff assignments)
 */
export const agencyUsers = mysqlTable("agency_users", {
  id: int("id").autoincrement().primaryKey(),
  agencyId: int("agencyId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["admin", "manager", "staff"]).default("staff").notNull(),
  permissions: longtext("permissions"), // JSON array of permission strings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  agencyIdIdx: index("agency_user_agency_idx").on(table.agencyId),
  userIdIdx: index("agency_user_user_idx").on(table.userId),
}));

export type AgencyUser = typeof agencyUsers.$inferSelect;
export type InsertAgencyUser = typeof agencyUsers.$inferInsert;

/**
 * Properties (buildings/houses)
 */
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  agencyId: int("agencyId"),
  ownerId: int("ownerId").notNull(), // Landlord user ID
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }),
  country: varchar("country", { length: 100 }).default("South Africa"),
  postalCode: varchar("postalCode", { length: 10 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  propertyType: mysqlEnum("propertyType", ["residential", "commercial", "mixed"]).default("residential").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "for_sale"]).default("active").notNull(),
  totalUnits: int("totalUnits").default(1),
  description: longtext("description"),
  images: longtext("images"), // JSON array of image URLs
  documents: longtext("documents"), // JSON array of document URLs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerIdIdx: index("property_owner_idx").on(table.ownerId),
  agencyIdIdx: index("property_agency_idx").on(table.agencyId),
  cityIdx: index("property_city_idx").on(table.city),
}));

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * Units (apartments, rooms, etc. within properties)
 */
export const units = mysqlTable("units", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  unitNumber: varchar("unitNumber", { length: 50 }).notNull(),
  unitType: mysqlEnum("unitType", ["studio", "one_bedroom", "two_bedroom", "three_bedroom", "four_bedroom", "five_plus_bedroom", "commercial"]).default("one_bedroom").notNull(),
  bedrooms: int("bedrooms").default(1),
  bathrooms: int("bathrooms").default(1),
  squareFeet: int("squareFeet"),
  rentAmount: decimal("rentAmount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("ZAR"),
  deposit: decimal("deposit", { precision: 12, scale: 2 }),
  status: mysqlEnum("status", ["vacant", "occupied", "maintenance", "reserved"]).default("vacant").notNull(),
  description: text("description"),
  amenities: longtext("amenities"), // JSON array
  images: longtext("images"), // JSON array
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  propertyIdIdx: index("unit_property_idx").on(table.propertyId),
  statusIdx: index("unit_status_idx").on(table.status),
}));

export type Unit = typeof units.$inferSelect;
export type InsertUnit = typeof units.$inferInsert;

/**
 * Tenants (renters)
 */
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  idNumber: varchar("idNumber", { length: 50 }).notNull().unique(),
  idType: mysqlEnum("idType", ["national_id", "passport", "drivers_license"]).default("national_id").notNull(),
  dateOfBirth: date("dateOfBirth"),
  nationality: varchar("nationality", { length: 100 }),
  emergencyContact: varchar("emergencyContact", { length: 100 }),
  emergencyPhone: varchar("emergencyPhone", { length: 20 }),
  employmentStatus: mysqlEnum("employmentStatus", ["employed", "self_employed", "unemployed", "student", "retired"]).default("employed"),
  employer: varchar("employer", { length: 255 }),
  monthlyIncome: decimal("monthlyIncome", { precision: 12, scale: 2 }),
  documents: longtext("documents"), // JSON array of document URLs
  profileImage: varchar("profileImage", { length: 512 }),
  status: mysqlEnum("status", ["active", "inactive", "blacklisted"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index("tenant_email_idx").on(table.email),
  idNumberIdx: index("tenant_id_number_idx").on(table.idNumber),
}));

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

/**
 * Leases/Tenancies
 */
export const leases = mysqlTable("leases", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  tenantId: int("tenantId").notNull(),
  propertyId: int("propertyId").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  rentAmount: decimal("rentAmount", { precision: 12, scale: 2 }).notNull(),
  deposit: decimal("deposit", { precision: 12, scale: 2 }),
  depositPaid: boolean("depositPaid").default(false),
  currency: varchar("currency", { length: 3 }).default("ZAR"),
  rentEscalation: decimal("rentEscalation", { precision: 5, scale: 2 }).default("0.00"), // Percentage
  paymentDueDay: int("paymentDueDay").default(1), // Day of month
  leaseTerms: longtext("leaseTerms"), // JSON or text
  status: mysqlEnum("status", ["active", "expired", "terminated", "pending"]).default("active").notNull(),
  documents: longtext("documents"), // JSON array of lease document URLs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  unitIdIdx: index("lease_unit_idx").on(table.unitId),
  tenantIdIdx: index("lease_tenant_idx").on(table.tenantId),
  propertyIdIdx: index("lease_property_idx").on(table.propertyId),
  statusIdx: index("lease_status_idx").on(table.status),
}));

export type Lease = typeof leases.$inferSelect;
export type InsertLease = typeof leases.$inferInsert;

/**
 * Payments (rent collection)
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  leaseId: int("leaseId").notNull(),
  unitId: int("unitId").notNull(),
  tenantId: int("tenantId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("ZAR"),
  dueDate: date("dueDate").notNull(),
  paidDate: date("paidDate"),
  status: mysqlEnum("status", ["pending", "partial", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["bank_transfer", "cash", "cheque", "card", "eft", "other"]).default("bank_transfer"),
  reference: varchar("reference", { length: 255 }),
  notes: text("notes"),
  receiptUrl: varchar("receiptUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  leaseIdIdx: index("payment_lease_idx").on(table.leaseId),
  tenantIdIdx: index("payment_tenant_idx").on(table.tenantId),
  statusIdx: index("payment_status_idx").on(table.status),
  dueDateIdx: index("payment_due_date_idx").on(table.dueDate),
}));

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Maintenance Requests
 */
export const maintenanceRequests = mysqlTable("maintenance_requests", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  propertyId: int("propertyId").notNull(),
  tenantId: int("tenantId"),
  staffId: int("staffId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: longtext("description").notNull(),
  category: mysqlEnum("category", ["plumbing", "electrical", "structural", "appliances", "cleaning", "pest_control", "other"]).default("other").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "assigned", "in_progress", "completed", "cancelled"]).default("open").notNull(),
  estimatedCost: decimal("estimatedCost", { precision: 12, scale: 2 }),
  actualCost: decimal("actualCost", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("ZAR"),
  images: longtext("images"), // JSON array
  notes: longtext("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  unitIdIdx: index("maintenance_unit_idx").on(table.unitId),
  propertyIdIdx: index("maintenance_property_idx").on(table.propertyId),
  statusIdx: index("maintenance_status_idx").on(table.status),
  priorityIdx: index("maintenance_priority_idx").on(table.priority),
}));

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = typeof maintenanceRequests.$inferInsert;

/**
 * Inspections (move-in, move-out, periodic)
 */
export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  propertyId: int("propertyId").notNull(),
  leaseId: int("leaseId"),
  tenantId: int("tenantId"),
  staffId: int("staffId").notNull(),
  inspectionType: mysqlEnum("inspectionType", ["move_in", "move_out", "periodic", "maintenance", "other"]).default("periodic").notNull(),
  date: date("date").notNull(),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  findings: longtext("findings"),
  damageReport: longtext("damageReport"), // JSON array of damages
  images: longtext("images"), // JSON array of inspection photos
  estimatedRepairCost: decimal("estimatedRepairCost", { precision: 12, scale: 2 }),
  notes: longtext("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  unitIdIdx: index("inspection_unit_idx").on(table.unitId),
  propertyIdIdx: index("inspection_property_idx").on(table.propertyId),
  leaseIdIdx: index("inspection_lease_idx").on(table.leaseId),
  typeIdx: index("inspection_type_idx").on(table.inspectionType),
}));

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

/**
 * Accounting/Transactions (for reporting)
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("ZAR"),
  description: text("description"),
  date: date("date").notNull(),
  reference: varchar("reference", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  propertyIdIdx: index("transaction_property_idx").on(table.propertyId),
  typeIdx: index("transaction_type_idx").on(table.type),
  dateIdx: index("transaction_date_idx").on(table.date),
}));

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Video Format Analytics (track which video formats are used)
 */
export const videoAnalytics = mysqlTable("video_analytics", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  userId: int("userId"),
  format: mysqlEnum("format", ["webm", "hevc", "mp4", "image"]).notNull(),
  loadTime: int("loadTime"), // milliseconds
  playbackTime: int("playbackTime"), // milliseconds
  browserName: varchar("browserName", { length: 100 }),
  browserVersion: varchar("browserVersion", { length: 50 }),
  osName: varchar("osName", { length: 100 }),
  osVersion: varchar("osVersion", { length: 50 }),
  deviceType: mysqlEnum("deviceType", ["desktop", "tablet", "mobile"]).default("desktop"),
  screenResolution: varchar("screenResolution", { length: 50 }),
  connectionSpeed: varchar("connectionSpeed", { length: 50 }), // 4g, 3g, slow-2g, etc
  pageUrl: varchar("pageUrl", { length: 512 }),
  referrer: varchar("referrer", { length: 512 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  country: varchar("country", { length: 100 }),
  region: varchar("region", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  formatIdx: index("video_format_idx").on(table.format),
  userIdIdx: index("video_user_idx").on(table.userId),
  sessionIdIdx: index("video_session_idx").on(table.sessionId),
  createdAtIdx: index("video_created_idx").on(table.createdAt),
  deviceTypeIdx: index("video_device_idx").on(table.deviceType),
}));
export type VideoAnalytics = typeof videoAnalytics.$inferSelect;
export type InsertVideoAnalytics = typeof videoAnalytics.$inferInsert;

/**
 * Audit Log (for compliance and tracking)
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: int("entityId"),
  changes: longtext("changes"), // JSON of what changed
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("audit_user_idx").on(table.userId),
  entityTypeIdx: index("audit_entity_type_idx").on(table.entityType),
}));

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

/**
 * Tenant Satisfaction Surveys
 * Tracks tenant satisfaction feedback over time for analytics and improvement
 */
export const tenantSatisfactionSurveys = mysqlTable("tenant_satisfaction_surveys", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  propertyId: int("propertyId").notNull(),
  leaseId: int("leaseId"),
  overallSatisfaction: int("overallSatisfaction").notNull(), // 1-5 scale
  cleanliness: int("cleanliness"), // 1-5 scale
  maintenance: int("maintenance"), // 1-5 scale
  communication: int("communication"), // 1-5 scale
  responsiveness: int("responsiveness"), // 1-5 scale
  valueForMoney: int("valueForMoney"), // 1-5 scale
  comments: longtext("comments"),
  wouldRecommend: boolean("wouldRecommend"),
  surveyDate: timestamp("surveyDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantIdIdx: index("satisfaction_tenant_idx").on(table.tenantId),
  propertyIdIdx: index("satisfaction_property_idx").on(table.propertyId),
  surveyDateIdx: index("satisfaction_date_idx").on(table.surveyDate),
}));

export type TenantSatisfactionSurvey = typeof tenantSatisfactionSurveys.$inferSelect;
export type InsertTenantSatisfactionSurvey = typeof tenantSatisfactionSurveys.$inferInsert;


/**
 * Scheduled report delivery configuration
 */
export const reportSchedules = mysqlTable("report_schedules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  propertyId: int("propertyId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  frequency: mysqlEnum("frequency", ["weekly", "biweekly", "monthly", "quarterly", "annually"]).notNull(),
  dayOfWeek: int("dayOfWeek"), // 0-6 for weekly schedules
  dayOfMonth: int("dayOfMonth"), // 1-31 for monthly schedules
  hour: int("hour").default(9), // Hour of day to send (0-23)
  minute: int("minute").default(0), // Minute of hour (0-59)
  recipientEmails: text("recipientEmails").notNull(), // JSON array of email addresses
  metrics: text("metrics").notNull(), // JSON array of selected metrics
  status: mysqlEnum("status", ["active", "paused", "completed"]).default("active").notNull(),
  lastSentAt: timestamp("lastSentAt"),
  nextSendAt: timestamp("nextSendAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("schedule_user_idx").on(table.userId),
  propertyIdIdx: index("schedule_property_idx").on(table.propertyId),
  statusIdx: index("schedule_status_idx").on(table.status),
  nextSendIdx: index("schedule_next_send_idx").on(table.nextSendAt),
}));

export type ReportSchedule = typeof reportSchedules.$inferSelect;
export type InsertReportSchedule = typeof reportSchedules.$inferInsert;

/**
 * Report delivery history and tracking
 */
export const reportDeliveryHistory = mysqlTable("report_delivery_history", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").notNull(),
  userId: int("userId").notNull(),
  propertyId: int("propertyId"),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "bounced"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  pdfUrl: varchar("pdfUrl", { length: 512 }),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  scheduleIdIdx: index("delivery_schedule_idx").on(table.scheduleId),
  userIdIdx: index("delivery_user_idx").on(table.userId),
  statusIdx: index("delivery_status_idx").on(table.status),
  sentAtIdx: index("delivery_sent_idx").on(table.sentAt),
}));

export type ReportDeliveryHistory = typeof reportDeliveryHistory.$inferSelect;
export type InsertReportDeliveryHistory = typeof reportDeliveryHistory.$inferInsert;


/**
 * User preferences for analytics and reporting
 * Stores metric selections and schedule defaults per user
 */
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  metrics: text("metrics").notNull(), // JSON array of selected metrics
  defaultFrequency: mysqlEnum("defaultFrequency", ["weekly", "biweekly", "monthly", "quarterly", "annually"]).default("monthly").notNull(),
  defaultHour: int("defaultHour").default(9).notNull(), // 0-23
  defaultMinute: int("defaultMinute").default(0).notNull(), // 0-59
  defaultDayOfMonth: int("defaultDayOfMonth").default(1).notNull(), // 1-31
  syncedAt: timestamp("syncedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("preferences_user_idx").on(table.userId),
  syncedAtIdx: index("preferences_synced_idx").on(table.syncedAt),
}));

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;


/**
 * Preference version history for auditing and restoration
 * Stores snapshots of user preferences over time
 */
export const preferenceVersions = mysqlTable("preference_versions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  versionNumber: int("versionNumber").notNull(), // Sequential version number per user
  metrics: text("metrics").notNull(), // JSON array of selected metrics
  defaultFrequency: mysqlEnum("defaultFrequency", ["weekly", "biweekly", "monthly", "quarterly", "annually"]).notNull(),
  defaultHour: int("defaultHour").notNull(),
  defaultMinute: int("defaultMinute").notNull(),
  defaultDayOfMonth: int("defaultDayOfMonth").notNull(),
  changeDescription: varchar("changeDescription", { length: 255 }), // Optional description of what changed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("version_user_idx").on(table.userId),
  versionIdx: index("version_number_idx").on(table.userId, table.versionNumber),
  createdAtIdx: index("version_created_idx").on(table.createdAt),
}));

export type PreferenceVersion = typeof preferenceVersions.$inferSelect;
export type InsertPreferenceVersion = typeof preferenceVersions.$inferInsert;


/**
 * Report delivery failures tracking
 */
export const reportFailures = mysqlTable("report_failures", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").notNull(),
  userId: int("userId").notNull(),
  propertyId: int("propertyId"),
  failureReason: mysqlEnum("failureReason", ["email_delivery", "pdf_generation", "invalid_recipient", "network_error", "unknown"]).notNull(),
  errorMessage: text("errorMessage"),
  failureCount: int("failureCount").default(1), // Number of consecutive failures
  lastFailedAt: timestamp("lastFailedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, (table) => ({
  scheduleIdIdx: index("failure_schedule_idx").on(table.scheduleId),
  userIdIdx: index("failure_user_idx").on(table.userId),
  reasonIdx: index("failure_reason_idx").on(table.failureReason),
  lastFailedIdx: index("failure_last_failed_idx").on(table.lastFailedAt),
}));
export type ReportFailure = typeof reportFailures.$inferSelect;
export type InsertReportFailure = typeof reportFailures.$inferInsert;

/**
 * Automatic rollback suggestions for failed reports
 */
export const rollbackSuggestions = mysqlTable("rollback_suggestions", {
  id: int("id").autoincrement().primaryKey(),
  failureId: int("failureId").notNull(),
  userId: int("userId").notNull(),
  suggestedVersionId: int("suggestedVersionId").notNull(), // Reference to preference_versions
  reason: text("reason").notNull(), // Why this version is suggested
  confidence: int("confidence").notNull(), // 0-100 confidence score
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "applied"]).default("pending").notNull(),
  appliedAt: timestamp("appliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  failureIdIdx: index("suggestion_failure_idx").on(table.failureId),
  userIdIdx: index("suggestion_user_idx").on(table.userId),
  statusIdx: index("suggestion_status_idx").on(table.status),
  versionIdIdx: index("suggestion_version_idx").on(table.suggestedVersionId),
}));
export type RollbackSuggestion = typeof rollbackSuggestions.$inferSelect;
export type InsertRollbackSuggestion = typeof rollbackSuggestions.$inferInsert;
