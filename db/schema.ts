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
  date,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Enums for better type safety and database constraints
export const onboardingStatusEnum = pgEnum("onboarding_status", [
  "not_started",
  "in_progress",
  "personal_info",
  "signature",
  "legal_consent",
  "verification",
  "completed",
]);

export const onboardingStepEnum = pgEnum("onboarding_step", [
  "personal_info",
  "signature",
  "legal_consent",
  "verification",
  "completed",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "not_started",
  "pending",
  "requires_input",
  "processing",
  "verified",
  "failed",
]);

export const assetTypeEnum = pgEnum("asset_type", [
  "property",
  "financial",
  "personal",
  "business",
  "digital",
]);

export const authProviderEnum = pgEnum("auth_provider", [
  "email",
  "google",
  "apple",
]);

// Custom users table - core user information (renamed to avoid Supabase auth conflict)
export const users = pgTable(
  "app_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    password_hash: text("password_hash"),

    // Personal Information
    first_name: varchar("first_name", { length: 100 }),
    last_name: varchar("last_name", { length: 100 }),
    phone_number: varchar("phone_number", { length: 50 }),
    date_of_birth: varchar("date_of_birth", { length: 50 }),
    pps_number: varchar("pps_number", { length: 20 }),
    profile_photo_url: varchar("profile_photo_url", { length: 500 }),

    // Address
    address_line_1: varchar("address_line_1", { length: 255 }),
    address_line_2: varchar("address_line_2", { length: 255 }),
    city: varchar("city", { length: 100 }),
    county: varchar("county", { length: 100 }),
    eircode: varchar("eircode", { length: 20 }),

    // Onboarding Status
    onboarding_status:
      onboardingStatusEnum("onboarding_status").default("not_started"),
    onboarding_current_step: onboardingStepEnum(
      "onboarding_current_step",
    ).default("personal_info"),
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
    verification_session_id: varchar("verification_session_id", {
      length: 255,
    }),
    verification_status: verificationStatusEnum("verification_status"),

    // Computed column for overall onboarding completion
    // This is a PostgreSQL generated column that automatically calculates
    // based on the individual step completion flags
    onboarding_completed: boolean("onboarding_completed").generatedAlwaysAs(
      sql`COALESCE(personal_info_completed, false) AND 
            COALESCE(signature_completed, false) AND 
            COALESCE(legal_consent_completed, false) AND 
            COALESCE(verification_completed, false)`,
    ),

    // Auth Provider Info
    auth_provider: authProviderEnum("auth_provider"),
    auth_provider_id: varchar("auth_provider_id", { length: 255 }),

    // Timestamps
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Indexes for performance optimization
    emailIndex: uniqueIndex("users_email_idx").on(table.email),
    onboardingStatusIndex: index("users_onboarding_status_idx").on(
      table.onboarding_status,
    ),
    verificationStatusIndex: index("users_verification_status_idx").on(
      table.verification_status,
    ),
    authProviderIndex: index("users_auth_provider_idx").on(table.auth_provider),
    createdAtIndex: index("users_created_at_idx").on(table.created_at),
  }),
);

// Refresh tokens for JWT authentication (renamed to avoid Supabase auth conflict)
export const refreshTokens = pgTable(
  "app_refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token_hash: text("token_hash").notNull(),
    family: uuid("family").notNull(),
    revoked: boolean("revoked").default(false),
    revoked_at: timestamp("revoked_at"),
    expires_at: timestamp("expires_at").notNull(),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    // Indexes for refresh token queries
    userIdIndex: index("refresh_tokens_user_id_idx").on(table.user_id),
    familyIndex: index("refresh_tokens_family_idx").on(table.family),
    expiresAtIndex: index("refresh_tokens_expires_at_idx").on(table.expires_at),
    tokenHashIndex: index("refresh_tokens_token_hash_idx").on(table.token_hash),
  }),
);

// Assets table
export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").notNull(),

    // Asset Details
    name: varchar("name", { length: 255 }).notNull(),
    asset_type: assetTypeEnum("asset_type").notNull(),
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
  },
  (table) => ({
    // Indexes for asset queries
    userIdIndex: index("assets_user_id_idx").on(table.user_id),
    assetTypeIndex: index("assets_type_idx").on(table.asset_type),
    valueIndex: index("assets_value_idx").on(table.value),
    createdAtIndex: index("assets_created_at_idx").on(table.created_at),
    // Composite index for common queries
    userTypeIndex: index("assets_user_type_idx").on(
      table.user_id,
      table.asset_type,
    ),
  }),
);

// Beneficiaries table
export const beneficiaries = pgTable("beneficiaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),

  // Beneficiary Details
  name: varchar("name", { length: 255 }).notNull(),
  relationship_type: varchar("relationship_type", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  pps_number: varchar("pps_number", { length: 20 }),
  photo_url: text("photo_url"),

  // Address
  address_line_1: varchar("address_line_1", { length: 255 }),
  address_line_2: varchar("address_line_2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  eircode: varchar("eircode", { length: 20 }),
  country: varchar("country", { length: 100 }).default("Ireland"),

  // Inheritance Details (deprecated - handled by wills)
  percentage: real("percentage"), // deprecated
  specific_assets: jsonb("specific_assets"), // deprecated
  conditions: text("conditions"), // deprecated

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
  user_id: uuid("user_id").notNull(),

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
  user_id: uuid("user_id"),

  // Event Details
  event_type: varchar("event_type", { length: 100 }).notNull(),
  event_action: varchar("event_action", { length: 100 }).notNull(),
  resource_type: varchar("resource_type", { length: 100 }),
  resource_id: varchar("resource_id", { length: 255 }),
  event_data: jsonb("event_data"),

  // Rollback Data
  old_data: jsonb("old_data"),
  new_data: jsonb("new_data"),

  // Request Context
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  session_id: varchar("session_id", { length: 255 }),

  // Timestamps
  event_time: timestamp("event_time").defaultNow(),
});

// Document Storage Tables
export const assetDocuments = pgTable("asset_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  asset_id: uuid("asset_id")
    .references(() => assets.id, { onDelete: "cascade" })
    .notNull(),
  user_email: varchar("user_email", { length: 255 }).notNull(),

  // File metadata
  file_name: varchar("file_name", { length: 255 }).notNull(),
  original_name: varchar("original_name", { length: 255 }).notNull(),
  file_type: varchar("file_type", { length: 100 }).notNull(),
  file_size: integer("file_size").notNull(),
  mime_type: varchar("mime_type", { length: 100 }).notNull(),

  // Storage information
  blob_url: text("blob_url").notNull(),
  blob_pathname: text("blob_pathname").notNull(),
  blob_download_url: text("blob_download_url"),

  // Categorization
  document_category: varchar("document_category", { length: 100 }).notNull(),
  document_type: varchar("document_type", { length: 100 }).notNull(),
  is_required: boolean("is_required").default(false),

  // Additional metadata
  description: text("description"),
  expiry_date: date("expiry_date"),
  issue_date: date("issue_date"),

  // Timestamps
  uploaded_at: timestamp("uploaded_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const documentRequirements = pgTable("document_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  asset_type: varchar("asset_type", { length: 100 }).notNull(),
  document_type: varchar("document_type", { length: 100 }).notNull(),
  display_name: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  is_required: boolean("is_required").default(false),
  category: varchar("category", { length: 100 }).notNull(),
  help_text: text("help_text"),
  example_formats: text("example_formats"),
  sort_order: integer("sort_order").default(0),

  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const documentAuditLog = pgTable("document_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  document_id: uuid("document_id")
    .references(() => assetDocuments.id, { onDelete: "cascade" })
    .notNull(),
  user_email: varchar("user_email", { length: 255 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // 'upload', 'view', 'download', 'delete'
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at").defaultNow(),
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
  inheritanceRules: many(inheritanceRules),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.user_id],
    references: [users.id],
  }),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  user: one(users, {
    fields: [assets.user_id],
    references: [users.id],
  }),
  documents: many(assetDocuments),
}));

export const beneficiariesRelations = relations(beneficiaries, ({ one }) => ({
  user: one(users, {
    fields: [beneficiaries.user_id],
    references: [users.id],
  }),
}));

export const willsRelations = relations(wills, ({ one }) => ({
  user: one(users, {
    fields: [wills.user_id],
    references: [users.id],
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
    fields: [auditEvents.user_id],
    references: [users.id],
  }),
}));

export const assetDocumentsRelations = relations(
  assetDocuments,
  ({ one, many }) => ({
    asset: one(assets, {
      fields: [assetDocuments.asset_id],
      references: [assets.id],
    }),
    user: one(users, {
      fields: [assetDocuments.user_email],
      references: [users.email],
    }),
    auditLogs: many(documentAuditLog),
  }),
);

export const documentRequirementsRelations = relations(
  documentRequirements,
  () => ({
    // No direct relations needed for this reference table
  }),
);

export const documentAuditLogRelations = relations(
  documentAuditLog,
  ({ one }) => ({
    document: one(assetDocuments, {
      fields: [documentAuditLog.document_id],
      references: [assetDocuments.id],
    }),
    user: one(users, {
      fields: [documentAuditLog.user_email],
      references: [users.email],
    }),
  }),
);

// Will move this later after table definitions

// Will move this later after table definitions

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

export type AssetDocument = typeof assetDocuments.$inferSelect;
export type NewAssetDocument = typeof assetDocuments.$inferInsert;

export type DocumentRequirement = typeof documentRequirements.$inferSelect;
export type NewDocumentRequirement = typeof documentRequirements.$inferInsert;

export type DocumentAuditLog = typeof documentAuditLog.$inferSelect;
export type NewDocumentAuditLog = typeof documentAuditLog.$inferInsert;

// Inheritance Rules table
export const inheritanceRules = pgTable(
  "inheritance_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    rule_definition: jsonb("rule_definition").notNull(),
    priority: integer("priority").default(1),
    is_active: boolean("is_active").default(true),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("inheritance_rules_user_id_idx").on(table.user_id),
    activeIdx: index("inheritance_rules_active_idx").on(table.is_active),
    priorityIdx: index("inheritance_rules_priority_idx").on(table.priority),
  }),
);

// Rule Allocations table
export const ruleAllocations = pgTable(
  "rule_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    rule_id: uuid("rule_id")
      .notNull()
      .references(() => inheritanceRules.id, { onDelete: "cascade" }),
    asset_id: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    beneficiary_id: uuid("beneficiary_id")
      .notNull()
      .references(() => beneficiaries.id, { onDelete: "cascade" }),
    allocation_percentage: real("allocation_percentage"),
    allocation_amount: real("allocation_amount"),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    ruleIdIdx: index("rule_allocations_rule_id_idx").on(table.rule_id),
    assetIdIdx: index("rule_allocations_asset_id_idx").on(table.asset_id),
    beneficiaryIdIdx: index("rule_allocations_beneficiary_id_idx").on(
      table.beneficiary_id,
    ),
  }),
);

export type InheritanceRule = typeof inheritanceRules.$inferSelect;
export type NewInheritanceRule = typeof inheritanceRules.$inferInsert;

export type RuleAllocation = typeof ruleAllocations.$inferSelect;
export type NewRuleAllocation = typeof ruleAllocations.$inferInsert;

// Relations for inheritance rules (moved here to avoid circular references)
export const inheritanceRulesRelations = relations(
  inheritanceRules,
  ({ one, many }) => ({
    user: one(users, {
      fields: [inheritanceRules.user_id],
      references: [users.id],
    }),
    allocations: many(ruleAllocations),
  }),
);

export const ruleAllocationsRelations = relations(
  ruleAllocations,
  ({ one }) => ({
    rule: one(inheritanceRules, {
      fields: [ruleAllocations.rule_id],
      references: [inheritanceRules.id],
    }),
    asset: one(assets, {
      fields: [ruleAllocations.asset_id],
      references: [assets.id],
    }),
    beneficiary: one(beneficiaries, {
      fields: [ruleAllocations.beneficiary_id],
      references: [beneficiaries.id],
    }),
  }),
);
