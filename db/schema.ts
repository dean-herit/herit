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
  primaryKey
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table - core user information
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash'),
  
  // Personal Information
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phoneNumber: varchar('phone_number', { length: 50 }),
  dateOfBirth: varchar('date_of_birth', { length: 50 }),
  
  // Address
  addressLine1: varchar('address_line_1', { length: 255 }),
  addressLine2: varchar('address_line_2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  eircode: varchar('eircode', { length: 20 }),
  
  // Onboarding Status
  onboardingStatus: varchar('onboarding_status', { length: 50 }).default('not_started'),
  onboardingCurrentStep: varchar('onboarding_current_step', { length: 50 }).default('personal_info'),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  
  // Step Completion Tracking
  personalInfoCompleted: boolean('personal_info_completed').default(false),
  personalInfoCompletedAt: timestamp('personal_info_completed_at'),
  
  signatureCompleted: boolean('signature_completed').default(false),
  signatureCompletedAt: timestamp('signature_completed_at'),
  
  legalConsentCompleted: boolean('legal_consent_completed').default(false),
  legalConsentCompletedAt: timestamp('legal_consent_completed_at'),
  legalConsents: jsonb('legal_consents'),
  
  verificationCompleted: boolean('verification_completed').default(false),
  verificationCompletedAt: timestamp('verification_completed_at'),
  verificationSessionId: varchar('verification_session_id', { length: 255 }),
  verificationStatus: varchar('verification_status', { length: 50 }),
  
  // Auth Provider Info
  authProvider: varchar('auth_provider', { length: 50 }),
  authProviderId: varchar('auth_provider_id', { length: 255 }),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
})

// Refresh tokens for JWT authentication
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tokenHash: text('token_hash').notNull(),
  family: uuid('family').notNull(),
  revoked: boolean('revoked').default(false),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Assets table
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Asset Details
  name: varchar('name', { length: 255 }).notNull(),
  assetType: varchar('asset_type', { length: 100 }).notNull(),
  value: real('value').notNull().default(0),
  description: text('description'),
  
  // Asset Metadata
  accountNumber: varchar('account_number', { length: 255 }),
  bankName: varchar('bank_name', { length: 255 }),
  propertyAddress: text('property_address'),
  
  // Status and Timestamps
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
})

// Beneficiaries table
export const beneficiaries = pgTable('beneficiaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Beneficiary Details
  name: varchar('name', { length: 255 }).notNull(),
  relationshipType: varchar('relationship_type', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  
  // Address
  addressLine1: varchar('address_line_1', { length: 255 }),
  addressLine2: varchar('address_line_2', { length: 255 }),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  eircode: varchar('eircode', { length: 20 }),
  country: varchar('country', { length: 100 }).default('Ireland'),
  
  // Inheritance Details
  percentage: real('percentage'),
  specificAssets: jsonb('specific_assets'),
  conditions: text('conditions'),
  
  // Status and Timestamps
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
})

// Wills table
export const wills = pgTable('wills', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Will Metadata
  title: varchar('title', { length: 255 }).notNull().default('Last Will and Testament'),
  willType: varchar('will_type', { length: 100 }).default('simple'),
  
  // Will Content
  content: text('content'),
  preferences: jsonb('preferences'),
  
  // Legal Status
  status: varchar('status', { length: 50 }).default('draft'),
  legalReviewStatus: varchar('legal_review_status', { length: 50 }),
  legalReviewer: varchar('legal_reviewer', { length: 255 }),
  
  // Document Management
  documentHash: varchar('document_hash', { length: 255 }),
  documentUrl: varchar('document_url', { length: 500 }),
  version: integer('version').default(1),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
  finalizedAt: timestamp('finalized_at'),
})

// Signatures table
export const signatures = pgTable('signatures', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Signature Details
  name: varchar('name', { length: 255 }).notNull(),
  signatureType: varchar('signature_type', { length: 50 }).notNull(),
  data: text('data').notNull(),
  hash: varchar('hash', { length: 255 }).notNull(),
  
  // Signature Metadata
  signatureMetadata: jsonb('signature_metadata'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
  lastUsed: timestamp('last_used'),
})

// Signature Usage table (audit trail)
export const signatureUsage = pgTable('signature_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  signatureId: uuid('signature_id').references(() => signatures.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Usage Context
  documentType: varchar('document_type', { length: 100 }).notNull(),
  documentId: varchar('document_id', { length: 255 }),
  context: jsonb('context'),
  
  // Timestamps
  usedAt: timestamp('used_at').defaultNow(),
})

// Audit Events table (comprehensive audit trail)
export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  // Event Details
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventAction: varchar('event_action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }),
  resourceId: varchar('resource_id', { length: 255 }),
  
  // Event Metadata
  eventData: jsonb('event_data'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // Timestamps
  eventTime: timestamp('event_time').defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  assets: many(assets),
  beneficiaries: many(beneficiaries),
  wills: many(wills),
  signatures: many(signatures),
  signatureUsage: many(signatureUsage),
  auditEvents: many(auditEvents),
}))

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}))

export const assetsRelations = relations(assets, ({ one }) => ({
  user: one(users, {
    fields: [assets.userId],
    references: [users.id],
  }),
}))

export const beneficiariesRelations = relations(beneficiaries, ({ one }) => ({
  user: one(users, {
    fields: [beneficiaries.userId],
    references: [users.id],
  }),
}))

export const willsRelations = relations(wills, ({ one }) => ({
  user: one(users, {
    fields: [wills.userId],
    references: [users.id],
  }),
}))

export const signaturesRelations = relations(signatures, ({ one, many }) => ({
  user: one(users, {
    fields: [signatures.userId],
    references: [users.id],
  }),
  usage: many(signatureUsage),
}))

export const signatureUsageRelations = relations(signatureUsage, ({ one }) => ({
  signature: one(signatures, {
    fields: [signatureUsage.signatureId],
    references: [signatures.id],
  }),
  user: one(users, {
    fields: [signatureUsage.userId],
    references: [users.id],
  }),
}))

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  user: one(users, {
    fields: [auditEvents.userId],
    references: [users.id],
  }),
}))

// Export types for TypeScript inference
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type RefreshToken = typeof refreshTokens.$inferSelect
export type NewRefreshToken = typeof refreshTokens.$inferInsert

export type Asset = typeof assets.$inferSelect
export type NewAsset = typeof assets.$inferInsert

export type Beneficiary = typeof beneficiaries.$inferSelect
export type NewBeneficiary = typeof beneficiaries.$inferInsert

export type Will = typeof wills.$inferSelect
export type NewWill = typeof wills.$inferInsert

export type Signature = typeof signatures.$inferSelect
export type NewSignature = typeof signatures.$inferInsert

export type SignatureUsage = typeof signatureUsage.$inferSelect
export type NewSignatureUsage = typeof signatureUsage.$inferInsert

export type AuditEvent = typeof auditEvents.$inferSelect
export type NewAuditEvent = typeof auditEvents.$inferInsert