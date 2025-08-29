# Drizzle Migration Best Practices Guide

## 🎯 Overview

This guide documents the comprehensive approach to handling Drizzle ORM migrations reliably, based on solving recurring "table already exists" and interactive prompt issues.

## 🔧 Tools & Commands

### Enhanced Safe Commands

We've implemented custom scripts that bypass Drizzle's interactive limitations:

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run db:migrate:safe` | Run migrations programmatically | Always prefer over standard migrate |
| `npm run db:generate:safe` | Generate migrations non-interactively | CI/CD, when prompts appear |
| `npm run db:sync` | Direct schema sync | Development, quick fixes |

### Standard Drizzle Commands

| Command | Purpose | Limitations |
|---------|---------|-------------|
| `npm run db:generate` | Interactive migration generation | Blocks CI/CD, requires manual input |
| `npm run db:migrate` | Standard migration runner | Can fail with "table exists" errors |
| `npm run db:push` | Direct schema push | May have bugs, bypasses migration history |

## 📋 Development Workflow

### 1. Making Schema Changes

```bash
# 1. Edit schema in db/schema.ts
vim db/schema.ts

# 2. Generate migration (non-interactive)
npm run db:generate:safe

# 3. Apply migration safely
npm run db:migrate:safe

# 4. Verify changes
npm run db:studio
```

### 2. Team Collaboration

**Before Starting Schema Work:**
```bash
# Pull latest changes
git pull origin main

# Check migration state consistency
npx drizzle-kit check

# Verify database matches schema
npm run db:sync --dry-run  # if available
```

**After Schema Changes:**
```bash
# Verify everything works
npm run typecheck
npm run build

# Check migration integrity
npx drizzle-kit check

# Commit with descriptive message
git add -A
git commit -m "feat: add inheritance rules system with proper migrations"
```

### 3. CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
- name: Setup Database
  run: |
    npm run db:migrate:safe

- name: Verify Schema
  run: |
    npx drizzle-kit check
```

## 🚨 Troubleshooting Common Issues

### Issue 1: "Table Already Exists" Errors

**Symptoms:**
```
❌ Error: relation "assets" already exists
```

**Root Cause:** Database has tables but migration tracking doesn't know about them.

**Solution:**
```bash
# Option A: Use safe migration runner
npm run db:migrate:safe

# Option B: Mark existing migrations as applied
npx tsx -e "
import postgres from 'postgres';
import { env } from './lib/env';
const sql = postgres(env.POSTGRES_URL, { max: 1 });
await sql\`
  INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
  VALUES ('0000_initial_schema', \${Date.now()})
\`;
"
```

### Issue 2: Interactive Prompts Block Automation

**Symptoms:**
```
Is column_name created or renamed from another column?
❯ + column_name           create column
  ~ old_name › column_name rename column
```

**Root Cause:** Drizzle can't determine if column is new or renamed.

**Solution:**
```bash
# Use non-interactive generator
npm run db:generate:safe

# Or be explicit in schema to avoid ambiguity
// In schema.ts - be explicit about column names
column_name: varchar("column_name", { length: 255 }).notNull()
```

### Issue 3: Schema-Database Mismatch

**Symptoms:**
- Schema defines `app_users` table
- Database has `users` table
- Foreign keys fail

**Root Cause:** Schema doesn't match database reality.

**Solution (Nuclear Option):**
```bash
# 1. Backup important data
npx tsx -e "
import postgres from 'postgres';
import { env } from './lib/env';
const sql = postgres(env.POSTGRES_URL, { max: 1 });
// Backup logic here
"

# 2. Drop all tables
npx tsx -e "
import postgres from 'postgres';
import { env } from './lib/env';
const sql = postgres(env.POSTGRES_URL, { max: 1 });
(async () => {
  const tables = await sql\`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
  \`;
  for (const { tablename } of tables) {
    await sql.unsafe(\`DROP TABLE IF EXISTS \${tablename} CASCADE\`);
  }
  await sql\`DROP SCHEMA IF EXISTS drizzle CASCADE\`;
  await sql.end();
})();
"

# 3. Clean migration files
rm -rf drizzle/migrations/*

# 4. Generate fresh migration
npx drizzle-kit generate --name initial_schema

# 5. Apply clean migration
npm run db:migrate:safe
```

### Issue 4: Missing Snapshot Files

**Symptoms:**
```
Error: Missing snapshot file for migration 0004_add_columns
```

**Root Cause:** Custom migrations (--custom flag) don't generate snapshots.

**Solution:**
```bash
# Option A: Delete the broken migration entry
# Edit drizzle/migrations/meta/_journal.json
# Remove the problematic entry

# Option B: Recreate the migration properly
rm drizzle/migrations/0004_*
npm run db:generate:safe
```

## ✅ Best Practices

### 1. Schema Design

**DO:**
```typescript
// Explicit column names and types
export const users = pgTable("app_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Clear foreign key relationships
export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
});
```

**DON'T:**
```typescript
// Ambiguous column definitions that trigger prompts
export const users = pgTable("users", {
  // Missing explicit types
  id: uuid().primaryKey(),
  // Unclear column names
  name: text(),
});
```

### 2. Migration Generation

**DO:**
```bash
# Use safe commands in scripts and CI
npm run db:generate:safe
npm run db:migrate:safe

# Check state before generating
npx drizzle-kit check
```

**DON'T:**
```bash
# Avoid standard commands in automation
npm run db:generate  # Can block with prompts
npm run db:migrate   # Can fail with "exists" errors

# Never use custom migrations for regular schema changes
npx drizzle-kit generate --custom  # Breaks snapshot chain
```

### 3. Team Workflow

**DO:**
- Coordinate schema changes through single branch
- Always pull latest before schema work
- Use descriptive migration names
- Run `npx drizzle-kit check` before committing

**DON'T:**
- Work on schema changes in parallel branches
- Edit migration files after generation
- Ignore migration check warnings
- Commit migration files without testing

### 4. Environment Management

**Development:**
```bash
# Quick iteration with schema sync
npm run db:sync

# Or standard workflow
npm run db:generate:safe
npm run db:migrate:safe
```

**Staging/Production:**
```bash
# Always use migration files
npm run db:migrate:safe

# Never use db:sync or db:push in production
```

## 🔍 Debugging Commands

### Check Migration State
```bash
# Drizzle's built-in checker
npx drizzle-kit check

# View migrations in database
npx tsx -e "
import postgres from 'postgres';
import { env } from './lib/env';
const sql = postgres(env.POSTGRES_URL, { max: 1 });
(async () => {
  const migrations = await sql\`
    SELECT * FROM drizzle.__drizzle_migrations 
    ORDER BY id
  \`;
  console.log('Applied migrations:', migrations);
  await sql.end();
})();
"

# Check table structure
npx tsx -e "
import postgres from 'postgres';
import { env } from './lib/env';
const sql = postgres(env.POSTGRES_URL, { max: 1 });
(async () => {
  const tables = await sql\`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  \`;
  console.log('Database tables:', tables.map(t => t.tablename));
  await sql.end();
})();
"
```

### Verify Schema Alignment
```bash
# Compare schema with database
npm run db:studio  # Visual inspection

# Or programmatic check
npx tsx -e "
import postgres from 'postgres';
import { env } from './lib/env';
const sql = postgres(env.POSTGRES_URL, { max: 1 });
(async () => {
  const userCols = await sql\`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'app_users' 
    AND table_schema = 'public'
  \`;
  console.log('app_users columns:', userCols);
  await sql.end();
})();
"
```

## 🚨 Emergency Recovery

If migrations are completely broken:

1. **Backup Data** (if important)
2. **Reset Database** (nuclear option)
3. **Regenerate from Schema** (source of truth)
4. **Restore Data** (if backed up)

See `CLAUDE.md` for complete emergency recovery protocol.

## 📚 References

- [Drizzle Migration Docs](https://orm.drizzle.team/docs/migrations)
- [Team Collaboration Best Practices](https://github.com/drizzle-team/drizzle-orm/discussions/1104)
- [CI/CD Integration Guide](https://orm.drizzle.team/docs/drizzle-kit-migrate)

---

**Last Updated:** January 2025  
**Version:** 1.0.0