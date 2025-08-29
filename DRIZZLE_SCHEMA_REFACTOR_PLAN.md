# Drizzle ORM Complete Schema Refactor Plan

_Recovery Document for Schema Modernization_

## Executive Summary

The current Herit application has critical schema fragility issues causing authentication and data fetching failures. This comprehensive plan implements a modern, production-ready Drizzle ORM setup with single source of truth schema management.

## Current Critical Issues

### 1. Schema-Database Mismatch

- **Problem**: TypeScript interface `AuthUser` expects `onboarding_completed: boolean` but database table `app_users` doesn't have this column
- **Symptom**: Authentication works but onboarding page shows placeholder data instead of user's actual information
- **Root Cause**: Manual interface definitions don't match actual database schema

### 2. Fragmented Schema Truth

- **Database Reality**: `app_users` table has individual completion flags: `personal_info_completed`, `signature_completed`, `legal_consent_completed`, `verification_completed`
- **Code Expectation**: Single `onboarding_completed` boolean field
- **Consequence**: Data fetching APIs return data but UI components don't receive expected structure

### 3. Fragile Migration System

- **Current Approach**: Manual SQL execution via `npx tsx` scripts and unsafe `drizzle-kit push`
- **Problems**:
  - No migration history tracking
  - Manual schema changes prone to errors (recent `revoked_at` column issue)
  - Inconsistent schema evolution
  - No rollback capability

### 4. Type System Inconsistencies

- **Manual Types**: `types/auth.ts` manually defines interfaces that don't match database reality
- **API Mismatch**: API routes query database correctly but return data in wrong structure for frontend
- **Maintenance Burden**: Changes require manual updates to multiple type definition files

## Recommended Solution: Option B - Clean Database Reset

### Why Option B is Optimal

- **Clean Slate**: Eliminates all accumulated schema inconsistencies
- **Faster Implementation**: No need to reconcile complex migration history
- **Guaranteed Consistency**: Database and code schemas will be perfectly aligned
- **Development-Friendly**: No production data to preserve in current development phase

## Complete Implementation Plan

### Phase 1: Schema Definition as Single Source of Truth

#### 1.1 Modern Drizzle Schema Setup

```typescript
// db/schema.ts - AUTHORITATIVE SOURCE
import { pgTable, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("app_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),

  // Personal Information
  first_name: text("first_name"),
  last_name: text("last_name"),
  phone_number: text("phone_number"),
  date_of_birth: text("date_of_birth"),

  // Address
  address_line_1: text("address_line_1"),
  address_line_2: text("address_line_2"),
  city: text("city"),
  county: text("county"),
  eircode: text("eircode"),

  // Onboarding Progress
  personal_info_completed: boolean("personal_info_completed").default(false),
  signature_completed: boolean("signature_completed").default(false),
  legal_consent_completed: boolean("legal_consent_completed").default(false),
  verification_completed: boolean("verification_completed").default(false),

  // Timestamps
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  onboarding_completed_at: timestamp("onboarding_completed_at"),
});

// Auto-generated types (replaces manual interfaces)
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

#### 1.2 Replace Manual Type Definitions

- **Delete**: `types/auth.ts` manual interfaces
- **Replace**: All imports with Drizzle-inferred types
- **Update**: All API routes, components, hooks to use new types

### Phase 2: Migration System Overhaul

#### 2.1 Production-Safe Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import { env } from "./lib/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: env.POSTGRES_URL,
  },
  verbose: true,
  strict: true,
  migrations: {
    table: "drizzle_migrations",
    schema: "public",
  },
});
```

#### 2.2 Environment-Specific Configs

```bash
# Create separate configs for each environment
drizzle-dev.config.ts    # Development database
drizzle-staging.config.ts # Staging database
drizzle-prod.config.ts   # Production database
```

#### 2.3 Updated Package.json Scripts

```json
{
  "scripts": {
    // Remove unsafe scripts
    "db:push": "echo 'DEPRECATED: Use db:migrate instead'",

    // Add safe migration workflow
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:migrate:dev": "drizzle-kit migrate --config=drizzle-dev.config.ts",
    "db:migrate:staging": "drizzle-kit migrate --config=drizzle-staging.config.ts",
    "db:migrate:prod": "drizzle-kit migrate --config=drizzle-prod.config.ts",

    // Development helpers
    "db:reset": "npx tsx scripts/reset-database.ts",
    "db:seed": "npx tsx scripts/seed-database.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Phase 3: Database Reset Implementation

#### 3.1 Pre-Reset Backup (Safety)

```typescript
// scripts/backup-database.ts
import { db } from "../db/db";
import { writeFileSync } from "fs";

const backup = await db.execute(`
  SELECT json_agg(row_to_json(t)) 
  FROM app_users t
`);
writeFileSync(`backup-${Date.now()}.json`, JSON.stringify(backup, null, 2));
```

#### 3.2 Clean Database Reset

```typescript
// scripts/reset-database.ts
import { db } from "../db/db";
import { sql } from "drizzle-orm";

// Drop all tables
await db.execute(sql`DROP SCHEMA public CASCADE`);
await db.execute(sql`CREATE SCHEMA public`);

// Run fresh migrations
await migrate(db, { migrationsFolder: "./drizzle/migrations" });
```

#### 3.3 Initial Migration Generation

```bash
# Generate initial migration from schema
npm run db:generate

# Apply to clean database
npm run db:migrate
```

### Phase 4: Code Modernization

#### 4.1 Authentication System Updates

```typescript
// lib/auth.ts - Updated with computed onboarding status
export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePhotoUrl?: string | null;
  onboardingStatus?: string | null;
  onboardingCurrentStep?: string | null;
  // Computed property instead of database field
  onboarding_completed: boolean;
}

// Compute onboarding completion from individual flags
const computeOnboardingCompletion = (user: User): boolean => {
  return !!(
    user.personal_info_completed &&
    user.signature_completed &&
    user.legal_consent_completed &&
    user.verification_completed
  );
};
```

#### 4.2 API Route Updates

```typescript
// app/api/onboarding/personal-info/route.ts
import { users } from "@/db/schema";

export async function GET() {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return NextResponse.json({
    personalInfo: {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email,
      // ... properly mapped fields
    },
    completionStatus: {
      personal_info_completed: user.personal_info_completed,
      signature_completed: user.signature_completed,
      legal_consent_completed: user.legal_consent_completed,
      verification_completed: user.verification_completed,
    },
  });
}
```

#### 4.3 Frontend Component Updates

```typescript
// Ensure components receive correct data structure
const { personalInfo, completionStatus } = await response.json();

// Map API response to component state
setPersonalInfo({
  first_name: personalInfo.first_name,
  last_name: personalInfo.last_name,
  email: personalInfo.email,
  // ... other fields
});
```

### Phase 5: Migration Safety and Monitoring

#### 5.1 Migration Safety Scripts

```typescript
// scripts/safe-migration.ts
export async function safeMigration(
  name: string,
  migrationFn: () => Promise<void>,
) {
  console.log(`Starting migration: ${name}`);

  // Pre-migration backup
  await createBackup(`pre-${name}-${Date.now()}`);

  try {
    await migrationFn();
    console.log(`✅ Migration completed: ${name}`);
  } catch (error) {
    console.error(`❌ Migration failed: ${name}`, error);
    // Auto-rollback logic here
    throw error;
  }
}
```

#### 5.2 Schema Validation

```typescript
// scripts/validate-schema.ts
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "../db/schema";

// Validate schema matches database
export async function validateSchema() {
  try {
    const result = await db.select().from(users).limit(1);
    console.log("✅ Schema validation passed");
    return true;
  } catch (error) {
    console.error("❌ Schema validation failed:", error);
    return false;
  }
}
```

### Phase 6: Production Deployment Strategy

#### 6.1 Deployment Workflow

```bash
# 1. Generate migration
npm run db:generate

# 2. Test migration on staging
npm run db:migrate:staging

# 3. Validate schema
npm run validate:schema

# 4. Deploy to production
npm run db:migrate:prod

# 5. Verify deployment
npm run test:production
```

#### 6.2 Rollback Procedures

```typescript
// Each migration includes rollback SQL
export async function down(db: any) {
  // Rollback logic for this specific migration
  await db.execute(sql`-- Rollback SQL here`);
}
```

## Benefits of Complete Reset Approach

### Immediate Benefits

1. **Eliminates All Current Issues**: Authentication, data fetching, schema mismatches all resolved
2. **Clean Migration History**: Fresh start with proper migration tracking
3. **Type Safety**: Auto-generated types prevent future mismatches
4. **Development Speed**: No more manual schema debugging

### Long-Term Benefits

1. **Production Readiness**: Proper migration workflow for team collaboration
2. **Maintainability**: Single source of truth reduces maintenance burden
3. **Scalability**: Schema can evolve safely as application grows
4. **Team Collaboration**: Migration files in version control enable collaborative development

## Risk Mitigation

### Data Safety

- **Development Environment**: Current phase has minimal production data at risk
- **Backup Procedures**: All data backed up before any destructive operations
- **Rollback Plan**: Can restore from backup if issues arise
- **Testing**: Thorough testing on development before any production changes

### Implementation Safety

- **Incremental Steps**: Each phase can be implemented and tested independently
- **Validation Checks**: Schema validation after each major change
- **Environment Separation**: Changes tested in development before production
- **Feature Flags**: Can roll back individual features if issues arise

## Success Metrics

### Technical Metrics

- [ ] All API routes return data in expected format
- [ ] Frontend components receive and display correct user data
- [ ] No TypeScript errors related to schema types
- [ ] Migration history properly tracked in database
- [ ] All tests pass after schema changes

### User Experience Metrics

- [ ] Onboarding page displays user's actual information (not placeholders)
- [ ] Authentication flow works seamlessly
- [ ] No data fetching errors in browser console
- [ ] Page loads show real user data immediately

## Recovery Points

### If Issues Arise During Implementation

1. **Immediate Rollback**: Restore from pre-migration backup
2. **Partial Implementation**: Can implement phases incrementally
3. **Alternative Approach**: Fall back to minimal fixes if reset causes issues
4. **Expert Assistance**: This document provides context for troubleshooting

### Checkpoint Validations

- After each phase, run `npm run test:production` to validate functionality
- Use `npm run db:studio` to visually inspect database state
- Check browser console for any remaining data fetching errors
- Verify onboarding page shows actual user data

This plan provides a complete solution to the current schema fragility while establishing a robust foundation for future development. The verbose documentation ensures recovery from any implementation issues and serves as a reference for future schema evolution.
