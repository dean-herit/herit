import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Custom users table - core user information (renamed to avoid Supabase auth conflict)
export const users = pgTable("app_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password_hash: text("password_hash"),

  // Personal Information
  first_name: varchar("first_name", { length: 100 }),
  last_name: varchar("last_name", { length: 100 }),
  phone_number: varchar("phone_number", { length: 50 }),
  date_of_birth: varchar("date_of_birth", { length: 50 }),
  profile_photo_url: varchar("profile_photo_url", { length: 500 }),

  // Address
  address_line_1: varchar("address_line_1", { length: 255 }),
  address_line_2: varchar("address_line_2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  eircode: varchar("eircode", { length: 20 }),

  // Onboarding Status
  onboarding_status: varchar("onboarding_status", { length: 50 }).default(
    "not_started",
  ),
  onboarding_current_step: varchar("onboarding_current_step", {
    length: 50,
  }).default("personal_info"),
  onboarding_completed_at: timestamp("onboarding_completed_at"),

  // Step Completion Tracking
  personal_info_completed: boolean("personal_info_completed").default(false),
  personal_info_completed_at: timestamp("personal_info_completed_at"),

  signature_completed: boolean("signature_completed").default(false),
  signature_completed_at: timestamp("signature_completed_at"),

  legal_consent_completed: boolean("legal_consent_completed").default(false),
  legal_consent_completed_at: timestamp("legal_consent_completed_at"),
  legal_consents: jsonb("legal_consents"),

  verification_completed: boolean("verification_completed").default(false),
  verification_completed_at: timestamp("verification_completed_at"),
  verification_session_id: varchar("verification_session_id", { length: 255 }),
  verification_status: varchar("verification_status", { length: 50 }),

  // Auth Provider Info
  auth_provider: varchar("auth_provider", { length: 50 }),
  auth_provider_id: varchar("auth_provider_id", { length: 255 }),

  // Timestamps
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Refresh tokens for JWT authentication (renamed to avoid Supabase auth conflict)
export const refreshTokens = pgTable("app_refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token_hash: text("token_hash").notNull(),
  family: uuid("family").notNull(),
  revoked: boolean("revoked").default(false),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Assets table
export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_email: varchar("user_email", { length: 255 }).notNull(),

  // Asset Details
  name: varchar("name", { length: 255 }).notNull(),
  asset_type: varchar("asset_type", { length: 100 }).notNull(),
  value: real("value").notNull().default(0),
  description: text("description"),

  // Asset Metadata
  account_number: varchar("account_number", { length: 255 }),
  bank_name: varchar("bank_name", { length: 255 }),
  property_address: text("property_address"),

  // Status and Timestamps
  status: varchar("status", { length: 50 }).default("active"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Beneficiaries table
export const beneficiaries = pgTable("beneficiaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_email: varchar("user_email", { length: 255 }).notNull(),

  // Beneficiary Details
  name: varchar("name", { length: 255 }).notNull(),
  relationship_type: varchar("relationship_type", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),

  // Address
  address_line_1: varchar("address_line_1", { length: 255 }),
  address_line_2: varchar("address_line_2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  eircode: varchar("eircode", { length: 20 }),
  country: varchar("country", { length: 100 }).default("Ireland"),

  // Inheritance Details
  percentage: real("percentage"),
  specific_assets: jsonb("specific_assets"),
  conditions: text("conditions"),

  // Status and Timestamps
  status: varchar("status", { length: 50 }).default("active"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Wills table
export const wills = pgTable("wills", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_email: varchar("user_email", { length: 255 }).notNull(),

  // Will Metadata
  title: varchar("title", { length: 255 })
    .notNull()
    .default("Last Will and Testament"),
  will_type: varchar("will_type", { length: 100 }).default("simple"),

  // Will Content
  content: text("content"),
  preferences: jsonb("preferences"),

  // Legal Status
  status: varchar("status", { length: 50 }).default("draft"),
  legal_review_status: varchar("legal_review_status", { length: 50 }),
  legal_reviewer: varchar("legal_reviewer", { length: 255 }),

  // Document Management
  document_hash: varchar("document_hash", { length: 255 }),
  document_url: varchar("document_url", { length: 500 }),
  version: integer("version").default(1),

  // Timestamps
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  finalized_at: timestamp("finalized_at"),
});

// Signatures table
export const signatures = pgTable("signatures", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // Signature Details
  name: varchar("name", { length: 255 }).notNull(),
  signature_type: varchar("signature_type", { length: 50 }).notNull(),
  data: text("data").notNull(),
  hash: varchar("hash", { length: 255 }).notNull(),

  // Font Information (for template signatures)
  font_name: varchar("font_name", { length: 100 }),
  font_class_name: varchar("font_class_name", { length: 100 }),

  // Signature Metadata
  signature_metadata: jsonb("signature_metadata"),

  // Timestamps
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  last_used: timestamp("last_used"),
});

// Signature Usage table (audit trail)
export const signatureUsage = pgTable("signature_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  signature_id: uuid("signature_id")
    .references(() => signatures.id, { onDelete: "cascade" })
    .notNull(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // Usage Context
  document_type: varchar("document_type", { length: 100 }).notNull(),
  document_id: varchar("document_id", { length: 255 }),
  usage_metadata: jsonb("usage_metadata"),

  // Timestamps
  created_at: timestamp("created_at").defaultNow(),
});

// Audit Events table (comprehensive audit trail)
export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_email: varchar("user_email", { length: 255 }),

  // Event Details
  action: varchar("action", { length: 100 }).notNull(),
  entity_type: varchar("entity_type", { length: 100 }),
  entity_id: varchar("entity_id", { length: 255 }),

  // Event Metadata
  event_metadata: jsonb("event_metadata"),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  session_id: varchar("session_id", { length: 255 }),

  // Timestamps
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  assets: many(assets),
  beneficiaries: many(beneficiaries),
  wills: many(wills),
  signatures: many(signatures),
  signatureUsage: many(signatureUsage),
  auditEvents: many(auditEvents),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.user_id],
    references: [users.id],
  }),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  user: one(users, {
    fields: [assets.user_email],
    references: [users.email],
  }),
}));

export const beneficiariesRelations = relations(beneficiaries, ({ one }) => ({
  user: one(users, {
    fields: [beneficiaries.user_email],
    references: [users.email],
  }),
}));

export const willsRelations = relations(wills, ({ one }) => ({
  user: one(users, {
    fields: [wills.user_email],
    references: [users.email],
  }),
}));

export const signaturesRelations = relations(signatures, ({ one, many }) => ({
  user: one(users, {
    fields: [signatures.user_id],
    references: [users.id],
  }),
  usage: many(signatureUsage),
}));

export const signatureUsageRelations = relations(signatureUsage, ({ one }) => ({
  signature: one(signatures, {
    fields: [signatureUsage.signature_id],
    references: [signatures.id],
  }),
  user: one(users, {
    fields: [signatureUsage.user_id],
    references: [users.id],
  }),
}));

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  user: one(users, {
    fields: [auditEvents.user_email],
    references: [users.email],
  }),
}));

// Export types for TypeScript inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

export type Beneficiary = typeof beneficiaries.$inferSelect;
export type NewBeneficiary = typeof beneficiaries.$inferInsert;

export type Will = typeof wills.$inferSelect;
export type NewWill = typeof wills.$inferInsert;

export type Signature = typeof signatures.$inferSelect;
export type NewSignature = typeof signatures.$inferInsert;

export type SignatureUsage = typeof signatureUsage.$inferSelect;
export type NewSignatureUsage = typeof signatureUsage.$inferInsert;

export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
