# Claude Development Context

## 🚀 WORKFLOW PRIORITIES - READ FIRST

### Quick Decision Guide

- **Need a screenshot?** → Use MCP `screenshot` tool directly (NOT Task agent, NOT custom scripts)
- **Need to test UI?** → Use MCP `navigate` + `click` tools directly
- **Need documentation?** → Use Context7 with "use context7" in prompt
- **Multiple complex operations?** → Only then use Task agent

### ✅ DO THIS (Direct MCP Tools)

```javascript
// Screenshot - THIS IS ALL YOU NEED:
await screenshot({ filename: "mobile-test" });

// Navigate and interact - DIRECT CALLS:
await navigate({ path: "/signup" });
await click({ selector: "signup-button" });

// Get component info - ONE CALL:
await get_components({ visibleOnly: true });
```

### ❌ AVOID These Anti-patterns

- Writing custom Playwright/Node.js scripts when MCP tools exist
- Using Task agent for single screenshot captures
- Creating temporary test files for one-off operations
- Overcomplicating simple direct tool calls
- Going through multiple agents when direct MCP tool works

### 🎯 Speed Rule: Direct MCP Tools > Task Agent > Custom Scripts

---

## 🔒 CRITICAL: AUDIT SYSTEM & DATA PROTECTION PROTOCOLS

### **🚨 MANDATORY DATABASE SAFETY RULES**

#### **RULE #1: NEVER Run Database Operations Without Audit Safety**

```typescript
// ❌ FORBIDDEN - Direct database changes without safety
await db.execute(sql`ALTER TABLE...`);
await db.execute(sql`DROP TABLE...`);
await db.execute(sql`DELETE FROM...`);

// ✅ REQUIRED - Always use safety wrapper for schema changes
import { safeMigration } from "@/scripts/migration-safety-protocol";
await safeMigration("operation-name", async () => {
  await db.execute(sql`ALTER TABLE...`);
});
```

#### **RULE #2: ALWAYS Use Audit Logging for User Actions**

```typescript
// ✅ REQUIRED - Log all significant user actions
import { audit } from "@/lib/audit-middleware";

await audit.logUserAction(
  userId,
  "action_performed",
  "resource_type",
  resourceId,
  metadata,
);

await audit.logDataChange(
  userId,
  "update",
  "table_name",
  recordId,
  oldData,
  newData,
);
```

#### **RULE #3: NEVER Delete Audit Records**

- Audit logs are **APPEND-ONLY** by law (GDPR, SOX compliance)
- Use data retention policies, never manual deletion
- Audit log deletion violates legal requirements

### **🛡️ IMPLEMENTED DATA PROTECTION SYSTEM**

**Status:** ✅ **OPERATIONAL** - Enterprise-grade 4-layer protection active

#### **Layer 1: Comprehensive Audit Trail**

- **Location:** `audit_events` table + database triggers
- **Coverage:** All CRUD operations automatically logged
- **Features:** old_data/new_data capture for rollback capability
- **Performance:** Optimized indexes for fast audit queries

#### **Layer 2: Migration Safety Protocol**

- **Location:** `scripts/migration-safety-protocol.ts`
- **Features:** Pre-migration backups, rollback scripts, validation
- **Backup Location:** `database-backups/` directory
- **Usage:** Wrap ALL schema changes with `safeMigration()`

#### **Layer 3: Real-Time Data Protection**

- **Database Triggers:** Automatic audit on assets, beneficiaries, wills, users
- **Application Middleware:** `lib/audit-middleware.ts` for API logging
- **Session Tracking:** User context, IP address, session correlation

#### **Layer 4: Recovery & Compliance**

- **Documentation:** `docs/AUDIT_SYSTEM_OPERATIONS_MANUAL.md`
- **Recovery Procedures:** Complete data restoration capabilities
- **Compliance:** GDPR, SOX, HIPAA ready with audit trails

### **⚡ IMMEDIATE REQUIREMENTS FOR ALL DATABASE WORK**

1. **Before Any Schema Change:**

   ```bash
   # Verify clean state
   npm run typecheck
   git status

   # Use safety wrapper
   npx tsx -e "
   import { safeMigration } from './scripts/migration-safety-protocol';
   await safeMigration('your-change-name', async () => {
     // Your migration code here
   });
   "
   ```

2. **Before Any Data Operations:**

   ```typescript
   // Log the operation
   await audit.logDataChange(userId, action, table, id, oldData, newData);
   ```

3. **Emergency Recovery Information:**

   ```bash
   # Latest backup location
   ls -1t database-backups/*.sql | head -1

   # Rollback script location
   ls -1t database-backups/rollback-*.sh | head -1

   # Emergency recovery
   ./database-backups/rollback-[timestamp].sh
   ```

### **🚨 DATA LOSS PREVENTION LEARNED FROM RECENT INCIDENT**

**What Happened:** Lost 13 assets due to NULL user_id values during schema changes
**Root Cause:** No audit trail to recover original ownership
**Prevention:** Complete audit system now captures all ownership changes  
**Recovery:** Audit trails now enable complete data relationship recovery

**Never Again:** The implemented system makes this type of data loss impossible

---

## Project Overview

HeroUI Heritage - Estate planning and asset management platform built with Next.js, TypeScript, and Drizzle ORM.

## Key Technologies

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, HeroUI components
- **Backend**: Next.js API routes, Drizzle ORM, PostgreSQL
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: PostgreSQL with Drizzle migrations

## MCP Configuration

### Vercel CLI Debug Commands (2024)

For debugging failed deployments and accessing build logs:

- `vercel inspect --logs <deployment-url>` - Shows build logs for an existing deployment
- `vercel deploy --logs` - Deploys and shows build logs in real-time  
- `vercel logs <deployment-url>` - Shows runtime logs for deployments in ready state
- `vercel ls` - List recent deployments with status
- Add `--json` flag to any log command for JSON output (useful with jq)

**Note:** For failed deployments, use `vercel inspect --logs` rather than `vercel logs` (which only works for ready deployments).

### Playwright MCP Server

The Playwright MCP server provides visual testing and component interaction capabilities.

### Context7 MCP Server

Context7 provides up-to-date documentation for LLMs and AI code editors, pulling current official documentation for rapidly evolving frameworks directly into prompts.

#### Available MCP Tools

1. **`navigate`** - Navigate to any page in the application

   - `path`: The route to navigate to (e.g., "/dashboard")
   - `waitForSelector`: Optional selector to wait for after navigation

2. **`screenshot`** - Capture screenshots with component highlighting

   - `filename`: Name for the screenshot (saved to tests/screenshots/)
   - `fullPage`: Whether to capture full page (default: true)

3. **`click`** - Click elements by selector or component ID

   - `selector`: CSS selector

4. **`get_components`** - List all components on current page

   - `visibleOnly`: Only return visible components (default: true)

#### Usage Examples

```javascript
// Navigate to dashboard
await navigate({ path: "/dashboard" });

// Take screenshot
await screenshot({
  filename: "dashboard-stats",
});

// Click a component
await click({
  selector: ".dashboard-button",
});

// Get all visible components
await get_components({ visibleOnly: true });
```

#### Context7 Usage Patterns

Context7 is particularly valuable for this project's rapidly evolving tech stack. Use "use context7" in prompts when working with:

**Core Frameworks & Libraries:**

- **Next.js 15**: App Router patterns, Server Actions, latest routing features
- **Drizzle ORM**: Schema definitions, query patterns, migrations, relations
- **TanStack Query v5**: Caching strategies, mutations, optimistic updates
- **HeroUI Components**: Latest component APIs, props, and styling patterns
- **Zod**: Schema validation patterns, type inference

**Usage Examples:**

```javascript
// Database schema with Context7 - get latest Drizzle patterns
"Create a Drizzle schema for Irish estate planning with proper relations between users, assets, and beneficiaries. Include Irish-specific fields like Eircode and IBAN validation. use context7";

// Component development with Context7 - get current HeroUI APIs
"Create a HeroUI card component for displaying asset information with proper TypeScript props and responsive design. use context7";

// API routes with Context7 - get latest Next.js patterns
"Create a Next.js 15 API route for asset management with proper error handling and TypeScript. use context7";

// Query patterns with Context7 - get current TanStack Query v5 syntax
"Implement TanStack Query mutations for estate planning asset updates with optimistic updates and error handling. use context7";
```

**When to Use Context7:**

- Creating new database schemas or migrations
- Implementing new UI components with latest APIs
- Setting up API routes with current best practices
- Configuring query caching and mutations
- Working with form validation using Zod
- Implementing authentication flows with latest patterns

### Development Commands

```bash
# Start development server
npm run dev

# Database operations
npm run db:generate   # Generate migrations
npm run db:migrate    # Apply migrations safely
npm run db:validate   # Validate schema health
npm run db:studio     # Open Drizzle Studio

# Type checking and linting
npm run typecheck     # TypeScript validation
npm run lint          # ESLint validation
```

## 🧪 **MANDATORY: Component Testing Workflow** 

### **🚨 CRITICAL RULE: 100% Storybook & Cypress Compliance**

**EVERY React component MUST have:**
- ✅ **Storybook story** (`.stories.tsx`) 
- ✅ **Cypress component test** (`.cy.tsx`)
- ✅ **data-testid attributes** on interactive elements

**This is enforced by ESLint rules and pre-commit hooks. Non-compliant code will not pass CI/CD.**

### **Component Development Checklist**

When creating or modifying components, follow this **mandatory** workflow:

#### 1. **Component Creation** 
```bash
# Create component
touch components/[category]/MyComponent.tsx

# Auto-generate tests (or create manually)
npx tsx scripts/generate-component-tests.ts
```

#### 2. **Required Files Structure**
```
components/[category]/
├── MyComponent.tsx           # ✅ Main component
├── MyComponent.stories.tsx   # ✅ REQUIRED: Storybook stories  
└── MyComponent.cy.tsx        # ✅ REQUIRED: Cypress tests
```

#### 3. **Storybook Story Requirements**
Every `.stories.tsx` file must include:
- **Default story** with basic rendering
- **Interactive story** with user interactions
- **Error/Loading states** (if applicable)
- **MSW mocking** for API calls
- **Interaction tests** using `@storybook/test`

```typescript
// Example story template
import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect, fn } from "@storybook/test";
import { MyComponent } from "./MyComponent";

const meta: Meta<typeof MyComponent> = {
  title: "Category/MyComponent",
  component: MyComponent,
  args: { onClick: fn() },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("button")).toBeVisible();
  },
};
```

#### 4. **Cypress Test Requirements**  
Every `.cy.tsx` file must include:
- **Rendering tests** (component mounts without errors)
- **Interaction tests** (user actions work correctly)
- **Accessibility tests** (ARIA, keyboard navigation)
- **Responsive tests** (works on mobile/tablet/desktop)

```typescript
// Example Cypress test template
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("renders without crashing", () => {
    cy.mount(<MyComponent />);
    cy.get('[data-testid*="my-component"]').should("be.visible");
  });
  
  it("handles user interactions", () => {
    const onClick = cy.stub();
    cy.mount(<MyComponent onClick={onClick} />);
    cy.get('[data-testid*="button"]').click();
    cy.wrap(onClick).should("have.been.called");
  });
});
```

#### 5. **data-testid Requirements**
All interactive elements MUST have `data-testid` attributes:
- ✅ Buttons: `data-testid="button-action-name"`  
- ✅ Inputs: `data-testid="input-field-name"`
- ✅ Links: `data-testid="link-destination"`
- ✅ Forms: `data-testid="form-name"`

**ESLint will auto-add these if missing, but always use semantic names!**

### **Testing Commands**

```bash
# Run all tests
npm run test:all          # Unit + Component + E2E

# Individual test types
npm run test:unit         # Vitest unit tests
npm run test:ct           # Cypress component tests  
npm run test:e2e          # Cypress E2E tests
npm run storybook         # Start Storybook dev server
npm run storybook:test    # Test interactions in Storybook

# Linting (enforces test compliance)
npm run lint              # ESLint with component test rules
npm run typecheck         # TypeScript validation
```

### **MSW Integration for API Mocking**

All components that make API calls must use MSW mocking in stories:

```typescript
// In .stories.tsx files
import { http, HttpResponse } from "msw";

export const WithApiData: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/beneficiaries", () => {
          return HttpResponse.json([mockBeneficiary]);
        }),
      ],
    },
  },
};
```

### **Pre-commit Enforcement**

The following checks run automatically on every commit:

1. **ESLint compliance** - Ensures stories & tests exist
2. **TypeScript check** - No type errors allowed
3. **Test execution** - Component tests must pass
4. **Formatting** - Prettier auto-formatting

**Commits will be rejected if any component lacks required test files.**

### **CI/CD Pipeline**

Our GitHub Actions workflow validates:
- ✅ All components have stories and tests
- ✅ Storybook builds successfully
- ✅ All Cypress tests pass
- ✅ Coverage thresholds met (>70%)
- ✅ No ESLint violations

### **Developer Productivity Tools**

- **Auto-generation**: `npx tsx scripts/generate-component-tests.ts`
- **Live testing**: Storybook with hot reload
- **Visual debugging**: Cypress Test Runner  
- **Coverage reports**: Generated after test runs

### **Quick Reference**

| Task | Command | Required |
|------|---------|----------|
| Create component story | Auto-generated or manual | ✅ **MANDATORY** |
| Create component test | Auto-generated or manual | ✅ **MANDATORY** |  
| Add data-testid | ESLint auto-fix or manual | ✅ **MANDATORY** |
| Run component tests | `npm run test:ct` | Before commit |
| Check compliance | `npm run lint` | Before commit |

**❌ BLOCKED ACTIONS:**
- Cannot commit without component stories
- Cannot commit without component tests  
- Cannot deploy without passing tests
- Cannot merge PR without 100% compliance

---

### MCP Development Workflow

**Combined MCP Usage:**

- **Playwright MCP**: Use for visual testing, component interaction, and screenshot capture
- **Context7 MCP**: Use for getting latest framework documentation when implementing features
- **Workflow**: Often combine both - use Context7 for implementation guidance, then Playwright MCP for testing

**Example Combined Workflow:**

1. "Create an asset management component with proper HeroUI patterns. use context7"
2. Implement the component based on current documentation
3. Use Playwright MCP tools to test the component visually and capture screenshots
4. Iterate based on visual feedback and component behavior

### Key File Locations

- **Components**: `/components/` (UI components)
- **Pages**: `/app/` (Next.js App Router)
- **API Routes**: `/app/api/`
- **Database Schema**: `/drizzle/schema.ts`
- **Types**: `/types/` (TypeScript definitions)
- **Hooks**: `/hooks/` (React hooks)

### Database Context

- **Primary Models**: users, assets, beneficiaries, documents
- **Authentication**: Session-based with NextAuth
- **Asset Types**: property, financial, personal, digital
- **Document Storage**: File system with metadata in database

### Common Issues & Solutions

1. **React Query Caching**: Use `staleTime: 0` to force fresh data when debugging
2. **Build Issues**: Run `npm run typecheck` before deployment
3. **Database**: Use Drizzle as single source of truth, avoid raw SQL

### Testing Priorities

1. **Authentication Flow**: Login/logout, session management
2. **Asset Management**: Add, edit, delete assets with proper validation
3. **Dashboard**: Statistics calculation, card responsiveness
4. **Forms**: Validation, error handling, success states
5. **Navigation**: Page transitions, protected routes

### Performance Considerations

- Use React.memo for expensive re-renders
- Lazy load heavy components
- Optimize images and assets

## Architecture Insights

### **Authentication & Security**

- **JWT Implementation**: Dual-token system (access + refresh tokens) with 24-hour access token life
- **Refresh Token Rotation**: Automatic rotation prevents token theft
- **Database Sessions**: Stored in `app_refresh_tokens` table with family tracking
- **Password Security**: Argon2 hashing with memory cost: 64MB, time cost: 3, parallelism: 1

### **Database Design Excellence**

- **Type Safety**: All tables use Drizzle ORM with proper `$inferSelect`/`$inferInsert` patterns
- **Proper Relations**: Cascade deletes, foreign keys, and indexes properly configured
- **Migration Strategy**: Incremental migrations in `/drizzle/migrations/`
- **Schema as Source of Truth**: Frontend types derived from database schema

### **Document Storage Architecture**

- **Vercel Blob Integration**: Production-ready file storage with proper error handling
- **Storage Quotas**: Per-user limits (MAX_TOTAL_STORAGE_PER_USER)
- **File Validation**: Type and size validation before upload
- **Audit Trail**: Complete document action logging in `document_audit_log`
- **Security**: User authorization on all document operations

### **TanStack Query Patterns**

- **Centralized Auth**: `useAuth` hook with 5-minute stale time
- **Optimistic Updates**: Immediate cache updates on mutations
- **Error Handling**: Proper retry strategies and error boundaries
- **Session Management**: Auto-refresh token rotation on 401 errors
- **Cache Invalidation**: Strategic query invalidation on auth state changes

### **Asset Management System**

- **Discriminated Unions**: V2 schema with type-specific validation
- **Irish Compliance**: Specialized schemas for Irish asset types (IBAN, Eircode, etc.)
- **Document Requirements**: Asset-type specific document requirements
- **Priority System**: Document priority calculation based on asset type

### **Onboarding Flow**

- **Multi-Step Process**: personal_info → signature → legal_consent → verification
- **Progress Tracking**: Individual step completion flags in database
- **Stripe Identity**: KYC verification with document + selfie requirements
- **Signature Handling**: OpenCV-based signature extraction and validation

## Deployment & Services

### **Vercel Configuration**

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

### **Environment Variables (Production)**

- `POSTGRES_URL`: PostgreSQL connection string
- `SESSION_SECRET`: JWT signing key (min 32 chars)
- `REFRESH_SECRET`: Refresh token signing key
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token
- `STRIPE_SECRET_KEY`: Stripe API key for identity verification
- `GOOGLE_CLIENT_ID/SECRET`: OAuth configuration

### **Database Deployment**

- **Provider**: PostgreSQL (Neon, Supabase, or Vercel Postgres)
- **Migration Command**: `npm run db:migrate`
- **Connection Pooling**: Configured in `POSTGRES_URL`
- **Backup Strategy**: Automated via provider

### **Performance Optimizations**

- **Bundle Analysis**: `npm run analyze` shows bundle composition
- **Image Optimization**: Next.js automatic image optimization
- **API Caching**: Strategic `staleTime` configuration
- **Component Lazy Loading**: Dynamic imports for heavy components

### **Monitoring & Observability**

- **Error Boundaries**: React error boundaries in place
- **Logging**: Structured logging via custom logger (`lib/logger.ts`)
- **Health Checks**: `/api/health` endpoint for monitoring
- **Database Monitoring**: Connection pool and query performance

### **Security Considerations**

- **CSRF Protection**: SameSite cookie configuration
- **XSS Prevention**: Proper input sanitization
- **Rate Limiting**: Implemented in `lib/rate-limit.ts`
- **SQL Injection**: Drizzle ORM prevents injection attacks
- **File Upload Security**: Type validation and size limits

## Important Notes

### **🚨 CRITICAL - DATABASE SAFETY FIRST**

- **NEVER run database operations without `safeMigration()` wrapper**
- **NEVER delete audit logs** (legal compliance requirement)
- **ALWAYS use audit logging** for user actions and data changes
- **VERIFY backups exist** before any risky operations
- See `docs/AUDIT_SYSTEM_OPERATIONS_MANUAL.md` for complete procedures

### **Development Standards**

- NEVER commit without running typecheck and lint
- Use `npm run db:migrate` for safe schema changes (deprecated: db:push)
- Use `npm run db:migrate` for production deployments (with safety wrapper)
- Monitor Stripe webhook events for verification status updates

### **Emergency Contacts & Procedures**

- **Data Loss Emergency:** Check `database-backups/` for latest backup
- **Audit System Failure:** Run `npx tsx scripts/fix-audit-system.ts`
- **Schema Recovery:** Run `npx tsx scripts/emergency-schema-recovery.ts`
- **Complete Operations Manual:** `docs/AUDIT_SYSTEM_OPERATIONS_MANUAL.md`

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.

      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.
