import { relations, sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["issuer", "holder", "employer", "admin"]);
export const credentialType = pgEnum("credential_type", ["EDUCATION", "EMPLOYMENT", "WORKSHOP", "LICENSE", "OTHER"]);
export const consentStatus = pgEnum("consent_status", ["pending", "approved", "denied", "expired"]);
export const jobStatus = pgEnum("job_status", ["open", "closed"]);
export const applicationStatus = pgEnum("application_status", ["submitted", "reviewing", "verified", "rejected", "hired"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  didHash: varchar("did_hash", { length: 66 }).notNull().unique(),
  displayName: varchar("display_name", { length: 160 }).notNull(),
  email: varchar("email", { length: 255 }),
  role: userRole("role").notNull(),
  ndiVerified: boolean("ndi_verified").default(false).notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

export const issuers = pgTable("issuers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  organizationName: varchar("organization_name", { length: 220 }).notNull(),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull().unique(),
  issuerDidHash: varchar("issuer_did_hash", { length: 66 }).notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
});

export const holders = pgTable("holders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  walletAddress: varchar("wallet_address", { length: 42 }),
  holderDidHash: varchar("holder_did_hash", { length: 66 }).notNull(),
  ...timestamps,
});

export const credentials = pgTable("credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  credentialId: varchar("credential_id", { length: 66 }).notNull().unique(),
  documentHash: varchar("document_hash", { length: 66 }).notNull(),
  holderDidHash: varchar("holder_did_hash", { length: 66 }).notNull(),
  issuerId: uuid("issuer_id").references(() => issuers.id).notNull(),
  credentialType: credentialType("credential_type").notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(),
  qrUrl: text("qr_url").notNull(),
  txHash: varchar("tx_hash", { length: 66 }),
  revoked: boolean("revoked").default(false).notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
  ...timestamps,
});

export const resumes = pgTable("resumes", {
  id: uuid("id").defaultRandom().primaryKey(),
  holderId: uuid("holder_id").references(() => holders.id).notNull(),
  education: jsonb("education").$type<Record<string, unknown>[]>().default(sql`'[]'::jsonb`).notNull(),
  workExperience: jsonb("work_experience").$type<Record<string, unknown>[]>().default(sql`'[]'::jsonb`).notNull(),
  workshops: jsonb("workshops").$type<Record<string, unknown>[]>().default(sql`'[]'::jsonb`).notNull(),
  certifications: jsonb("certifications").$type<Record<string, unknown>[]>().default(sql`'[]'::jsonb`).notNull(),
  gpaConversion: jsonb("gpa_conversion").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
  selectiveDisclosure: jsonb("selective_disclosure").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
  ...timestamps,
});

export const consentRequests = pgTable("consent_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  requesterId: uuid("requester_id").references(() => users.id).notNull(),
  holderId: uuid("holder_id").references(() => holders.id).notNull(),
  scopes: jsonb("scopes").$type<string[]>().notNull(),
  selectiveDisclosure: jsonb("selective_disclosure").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
  status: consentStatus("status").default("pending").notNull(),
  ndiConsentProof: text("ndi_consent_proof"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  employerId: uuid("employer_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description").notNull(),
  requirements: jsonb("requirements").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  status: jobStatus("status").default("open").notNull(),
  ...timestamps,
});

export const jobApplications = pgTable("job_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").references(() => jobs.id).notNull(),
  holderId: uuid("holder_id").references(() => holders.id).notNull(),
  resumeId: uuid("resume_id").references(() => resumes.id),
  status: applicationStatus("status").default("submitted").notNull(),
  verificationSummary: jsonb("verification_summary").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
  ...timestamps,
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id),
  action: varchar("action", { length: 160 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userRelations = relations(users, ({ many }) => ({
  auditLogs: many(auditLogs),
}));
