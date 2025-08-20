# Claude Development Context

## Project Overview

HeroUI Heritage - Estate planning and asset management platform built with Next.js, TypeScript, and Drizzle ORM.

## Key Technologies

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, HeroUI components
- **Backend**: Next.js API routes, Drizzle ORM, PostgreSQL
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: PostgreSQL with Drizzle migrations
- **Development**: Visual component system with AST-based registry

## MCP Configuration

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
   - `componentId`: Optional component ID to highlight
   - `fullPage`: Whether to capture full page (default: true)

3. **`click`** - Click elements by selector or component ID

   - `selector`: CSS selector or component ID
   - `isComponentId`: Whether selector is a component ID (default: false)

4. **`get_components`** - List all components on current page

   - `visibleOnly`: Only return visible components (default: true)

5. **`visual_mode`** - Toggle visual development mode
   - `enabled`: Enable or disable visual mode

#### Usage Examples

```javascript
// Navigate to dashboard
await navigate({ path: "/dashboard" });

// Take screenshot with component highlight
await screenshot({
  filename: "dashboard-stats",
  componentId: "dashboard-stats-section",
});

// Click a component
await click({
  selector: "dashboard-client",
  isComponentId: true,
});

// Get all visible components
await get_components({ visibleOnly: true });

// Enable visual mode
await visual_mode({ enabled: true });
```

#### Component Testing Strategy

- Components are identified by `data-component-id` attributes
- Visual dev mode shows component metadata on hover
- Dev panel accessible via floating button (🛠️)
- 126 components registered across 8 categories

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

### Component Registry Usage

- **Total Components**: 124 across 8 categories
- **Component Lookup**: Use `COMPONENT_REGISTRY[componentId]`
- **Categories**: layout, navigation, data-display, input, feedback, authentication, business, ui

### Development Commands

```bash
# Start development server
npm run dev

# Generate component registry (run after adding new components)
node scripts/generate-component-registry.js

# Database operations
npm run db:push       # Push schema changes
npm run db:generate   # Generate migrations
npm run db:migrate    # Run migrations
npm run db:studio     # Open Drizzle Studio

# Type checking and linting
npm run typecheck     # TypeScript validation
npm run lint          # ESLint validation
```

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
- **Component Registry**: `/lib/component-registry.ts` (auto-generated)

### Visual Testing Workflow

1. Enable visual dev mode: Toggle in dev panel or `localStorage.setItem('visualDevMode', 'true')`
2. Use component IDs for reliable element selection
3. Hover components to see metadata (name, category, file path)
4. Use data attributes: `data-component-id`, `data-testid`, `data-component-category`

### Database Context

- **Primary Models**: users, assets, beneficiaries, documents
- **Authentication**: Session-based with NextAuth
- **Asset Types**: property, financial, personal, digital
- **Document Storage**: File system with metadata in database

### Common Issues & Solutions

1. **React Query Caching**: Use `staleTime: 0` to force fresh data when debugging
2. **Component Detection**: Regenerate registry after adding new components
3. **Build Issues**: Run `npm run typecheck` before deployment
4. **Database**: Use Drizzle as single source of truth, avoid raw SQL

### Testing Priorities

1. **Authentication Flow**: Login/logout, session management
2. **Asset Management**: Add, edit, delete assets with proper validation
3. **Dashboard**: Statistics calculation, card responsiveness
4. **Forms**: Validation, error handling, success states
5. **Navigation**: Page transitions, protected routes

### Performance Considerations

- Components marked with complexity levels in registry
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

### **Component Architecture**

- **Registry System**: 128 registered components with AST-based discovery
- **Visual Dev Mode**: Runtime component identification and metadata
- **Type-Safe Props**: All components use proper TypeScript interfaces
- **Category Organization**: 8 categories (layout, navigation, data-display, etc.)

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

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: JWT signing key (min 32 chars)
- `REFRESH_SECRET`: Refresh token signing key
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token
- `STRIPE_SECRET_KEY`: Stripe API key for identity verification
- `GOOGLE_CLIENT_ID/SECRET`: OAuth configuration

### **Database Deployment**

- **Provider**: PostgreSQL (Neon, Supabase, or Vercel Postgres)
- **Migration Command**: `npm run db:migrate`
- **Connection Pooling**: Configured in `DATABASE_URL`
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

## Project Cleanup & .gitignore Management

### **Comprehensive Git Ignore Patterns**

The project maintains a comprehensive `.gitignore` to prevent tracking of temporary files, test artifacts, and debugging outputs:

**Test Artifacts & Reports:**

```gitignore
# Test artifacts and reports
/tests/reports/                    # Jest/test runner reports
/tests/debug-reports/              # Debug test execution reports
/tests/debug-screenshots/          # Automated debug screenshots
/tests/debug-videos/               # Video recordings of test runs
/tests/screenshots/automation/     # Automation test screenshots
/tests/screenshots/*-test-*.png    # Temporary test screenshots
/tests/screenshots/auth-*.png      # Auth flow test artifacts
/tests/screenshots/direct-test-*.png # Direct test artifacts
/tests/screenshots/*verification*.png # Verification test artifacts
/tests/screenshots/home-page-test.png # Page test screenshots
/tests/screenshots/signup-test.png # Signup test artifacts
*.webm                            # Video files from test recordings
test-report.json                  # JSON test reports
junit.xml                         # JUnit test output
test-results.html                 # HTML test reports
test-results.json                 # JSON test results
```

**MCP & Debugging Files:**

```gitignore
# MCP test files (temporary debugging scripts)
test-mcp-*.js                     # MCP debugging scripts
MCP_PLAYWRIGHT_TEST_REPORT.md     # MCP test reports

# Test automation artifacts
/tests/automation/                # Automated test suites
/tests/debug-automation/          # Debug automation scripts
```

### **File Preservation Strategy**

**✅ Preserved Files:**

- `tests/screenshots/final-*.png` - Production-ready screenshots for documentation
- `tests/demo-tests/` - Core demonstration test suites
- `tests/integration-tests/` - Integration test files
- Core component test files and legitimate project assets

**🗑️ Ignored Files:**

- Temporary test artifacts and reports
- Debug screenshots and videos from development
- MCP debugging scripts (temporary tools)
- Automation test outputs and reports
- Build artifacts and temporary files

### **Cleanup Workflow**

**During Development:**

1. Test artifacts are automatically generated in ignored directories
2. Temporary MCP scripts can be created without git tracking
3. Debug outputs accumulate in ignored paths

**Periodic Cleanup:**

```bash
# Remove all ignored test artifacts (safe - won't delete tracked files)
git clean -fdX tests/

# Remove temporary MCP files
rm -f test-mcp-*.js MCP_PLAYWRIGHT_TEST_REPORT.md

# Verify clean status
git status --porcelain
```

**Pre-Deployment:**

- Ensure only production screenshots are committed
- Remove debugging scripts and temporary artifacts
- Maintain clean git history without development clutter

### **Git Ignore Best Practices**

1. **Pattern Specificity**: Use specific patterns like `/tests/screenshots/*-test-*.png` instead of broad wildcards
2. **Directory Structure**: Align ignore patterns with actual directory structure
3. **Preservation Safety**: Ensure production assets aren't accidentally ignored
4. **Development Efficiency**: Allow temporary files during development without git noise
5. **Documentation**: Document why patterns exist for future maintenance

## Important Notes

- NEVER commit without running typecheck and lint
- Always use component registry IDs for testing
- Enable visual dev mode for component identification
- Use TodoWrite tool for task tracking during complex implementations
- Run `npm run db:push` for schema changes in development
- Use `npm run db:migrate` for production deployments
- Monitor Stripe webhook events for verification status updates
- Clean up test artifacts regularly to maintain repository hygiene
