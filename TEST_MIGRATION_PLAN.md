# Test Stack Migration Plan: Storybook + MSW + Cypress (Production-Ready)

## Current State Analysis

- **Package Manager**: npm (has package-lock.json, will migrate to pnpm)
- **Node Version**: Currently v23.7.0 (will pin to v20.18.2 LTS)
- **MCP Server**: Located in `/mcp-playwright/` directory with full Playwright integration
- **Test Files**: Minimal test files in `/tests/` (2 JS files + screenshots)
- **No CI/CD**: No `.github/workflows/` directory exists yet
- **Authentication**: Complex JWT refresh token system requiring test utilities
- **Database**: PostgreSQL with Drizzle ORM, audit system, migration safety protocols

## Migration Steps

### 1. Create Branch & Safety Tag

```bash
git checkout -b chore/test-reset-cypress-storybook
git tag pre-test-reset
```

### 2. Purge MCP/Playwright Infrastructure

**Delete:**

- `/mcp-playwright/` directory entirely
- `/tests/` directory (preserve any valuable test logic for migration)
- `playwright` dependency from package.json
- MCP-related dependencies (@upstash/context7-mcp)
- All test scripts from package.json (lines 27-40)

### 3. Migrate to pnpm & Pin Node 20

- Install pnpm globally
- Convert npm to pnpm: `pnpm import && rm package-lock.json`
- Create `.nvmrc` with `20.18.2`
- Update engines in package.json

### 4. Install New Testing Stack

```bash
pnpm add -D @storybook/nextjs@latest @storybook/test @storybook/testing-library \
  @storybook/addon-essentials @storybook/addon-interactions \
  msw@latest msw-storybook-addon \
  cypress@latest @testing-library/cypress @cypress/code-coverage \
  cypress-real-events start-server-and-test wait-on \
  @testing-library/react @testing-library/dom \
  vitest @vitest/ui happy-dom \
  typescript tsx esbuild \
  commander zod
```

### 5. Configure Storybook

**Create `.storybook/main.ts`:**

```typescript
import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  framework: "@storybook/nextjs",
  stories: [
    "../components/**/*.stories.@(js|jsx|ts|tsx)",
    "../app/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "msw-storybook-addon",
  ],
  staticDirs: ["../public"],
};

export default config;
```

**Create `.storybook/preview.ts`:**

```typescript
import { initialize, mswDecorator } from "msw-storybook-addon";
import "../app/globals.css";

initialize();

export const decorators = [mswDecorator];

export const parameters = {
  controls: { expanded: true },
  actions: { argTypesRegex: "^on[A-Z].*" },
};
```

### 6. Setup MSW

**Create `src/mocks/handlers.ts`:**

```typescript
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/auth/session", () => {
    return HttpResponse.json({ user: { id: "1", email: "test@example.com" } });
  }),
  http.post("/api/auth/login", () => {
    return HttpResponse.json({ success: true });
  }),
];
```

### 7. Configure Cypress (Enhanced for Next.js 15)

**Create `cypress.config.ts`:**

```typescript
import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "herit-estate",
  video: true,
  videoCompression: 32,
  videosFolder: "cypress/videos",
  screenshotsFolder: "cypress/screenshots",
  retries: { runMode: 2, openMode: 0 },
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 10000,
  reporter: "spec",
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      require("@cypress/code-coverage/task")(on, config);
      // Database tasks
      on("task", {
        "db:seed": require("./cypress/tasks/db-tasks").seed,
        "db:clean": require("./cypress/tasks/db-tasks").clean,
        "db:verify-audit": require("./cypress/tasks/db-tasks").verifyAudit,
      });
      return config;
    },
  },
  component: {
    devServer: {
      framework: "next", // Use 'next' not 'react' for Next.js 15
      bundler: "webpack", // Next.js uses webpack, not vite
    },
    supportFile: "cypress/support/component.ts",
    specPattern: "components/**/*.cy.{js,jsx,ts,tsx}", // Colocated tests
    indexHtmlFile: "cypress/support/component-index.html",
  },
});
```

### 8. Database Testing Support

**Create `cypress/tasks/db-tasks.ts`:**

```typescript
import postgres from "postgres";
import { env } from "../../lib/env";

const sql = postgres(env.POSTGRES_URL, { max: 1 });

export const seed = async (data: any) => {
  // Seed test user
  if (data.user) {
    await sql`
      INSERT INTO app_users (email, password_hash, onboarding_completed)
      VALUES (${data.user.email}, ${"test_hash"}, ${data.user.onboarding_completed})
      ON CONFLICT (email) DO UPDATE SET
        onboarding_completed = ${data.user.onboarding_completed}
    `;
  }
  return null;
};

export const clean = async () => {
  // Clean test data (preserve audit logs)
  await sql`DELETE FROM app_users WHERE email LIKE '%@test.com'`;
  return null;
};

export const verifyAudit = async (action: string) => {
  const audit = await sql`
    SELECT * FROM audit_events 
    WHERE action = ${action} 
    ORDER BY created_at DESC 
    LIMIT 1
  `;
  return audit[0] || null;
};
```

### 9. Authentication Testing Utilities

**Create `cypress/support/commands.ts`:**

```typescript
/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      loginWithAPI(email: string, password: string): Chainable<void>;
      setupTestUser(): Chainable<void>;
      verifyAuditLog(action: string): Chainable<void>;
      cleanupTestData(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("loginWithAPI", (email: string, password: string) => {
  cy.request("POST", "/api/auth/login", { email, password }).then(
    (response) => {
      window.localStorage.setItem("access_token", response.body.accessToken);
      cy.setCookie("refresh_token", response.body.refreshToken, {
        httpOnly: true,
        secure: false, // Set to true in production
        sameSite: "lax",
      });
    },
  );
});

Cypress.Commands.add("setupTestUser", () => {
  cy.task("db:seed", {
    user: {
      email: "cypress@test.com",
      onboarding_completed: true,
    },
  });
});

Cypress.Commands.add("verifyAuditLog", (action: string) => {
  cy.task("db:verify-audit", action).then((audit) => {
    expect(audit).to.not.be.null;
    expect(audit).to.have.property("action", action);
  });
});

Cypress.Commands.add("cleanupTestData", () => {
  cy.task("db:clean");
});
```

### 10. Enhanced CLI Tool

**Create `tools/cli.ts`:**

```typescript
#!/usr/bin/env node
import { program } from "commander";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";

const out = ".artifacts";
const file = `${out}/last-run.json`;
const historyFile = `${out}/test-history.jsonl`;

function run(cmd: string, task: string) {
  const t0 = Date.now();
  let ok = true;
  let output = "";

  try {
    output = execSync(cmd, {
      encoding: "utf-8",
      env: { ...process.env, FORCE_COLOR: "0" },
    }).toString();
  } catch (e: any) {
    ok = false;
    output = e.stdout || e.message || "";
  }

  const result = {
    task,
    passed: ok,
    durationMs: Date.now() - t0,
    cmd,
    timestamp: new Date().toISOString(),
    output: output.slice(0, 2000),
  };

  mkdirSync(out, { recursive: true });
  writeFileSync(file, JSON.stringify(result, null, 2));
  appendFileSync(historyFile, JSON.stringify(result) + "\n");

  process.exit(ok ? 0 : 1);
}

// Core commands
program.command("build").action(() => run("pnpm build", "build"));
program
  .command("typecheck")
  .action(() => run("pnpm tsc --noEmit --skipLibCheck", "typecheck"));
program.command("lint").action(() => run("pnpm eslint .", "lint"));

// Test commands
program.command("test:unit").action(() => run("pnpm vitest run", "test:unit"));
program
  .command("test:ct")
  .action(() => run("pnpm cypress run --component", "test:ct"));
program
  .command("test:e2e")
  .action(() => run("pnpm cypress run --e2e", "test:e2e"));
program
  .command("test:headed")
  .action(() => run("pnpm cypress run --headed", "test:headed"));
program
  .command("storybook:test")
  .action(() => run("pnpm test-storybook", "storybook:test"));

// Database commands
program.command("test:db").action(() => run("pnpm db:validate", "db:validate"));
program.command("test:security").action(() => run("pnpm audit", "security"));

program.parse();
```

### 11. Update package.json Scripts

```json
{
  "scripts": {
    "dev": "./scripts/dev.sh",
    "build": "next build",
    "start": "next start",
    "lint": "eslint --fix",
    "typecheck": "tsc --noEmit --skipLibCheck",
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build",
    "test-storybook": "test-storybook --watch=false",
    "cy:open": "cypress open",
    "cy:run": "cypress run",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest watch",
    "test:unit:ui": "vitest --ui",
    "test:ct": "cypress run --component",
    "test:e2e": "cypress run --e2e",
    "test:e2e:headed": "cypress run --headed --e2e",
    "test:all": "pnpm test:unit && pnpm test:ct && pnpm test:e2e",
    "cli": "tsx tools/cli.ts"
    // ... keep existing db: scripts
  },
  "engines": {
    "node": ">=20.18.2 <21",
    "pnpm": ">=9.0.0"
  }
}
```

### 12. Create Test Fixtures

**Create `cypress/fixtures/estate-planning.json`:**

```json
{
  "validAsset": {
    "name": "Family Home",
    "type": "property",
    "value": 500000,
    "location": "Dublin, Ireland",
    "eircode": "D02 X285"
  },
  "validBeneficiary": {
    "name": "John Doe",
    "relationship": "spouse",
    "allocation": 50,
    "email": "john.doe@test.com"
  },
  "testUser": {
    "email": "cypress@test.com",
    "password": "Test123!@#",
    "firstName": "Cypress",
    "lastName": "TestUser"
  }
}
```

### 13. Create Example Tests

**Component Story: `components/auth/LoginForm.stories.tsx`:**

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect } from "@storybook/test";
import { LoginForm } from "./LoginForm";

const meta: Meta<typeof LoginForm> = {
  title: "Auth/LoginForm",
  component: LoginForm,
};

export default meta;

export const Default: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emailInput = canvas.getByLabelText(/email/i);
    const passwordInput = canvas.getByLabelText(/password/i);

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");

    await expect(emailInput).toHaveValue("test@example.com");
  },
};
```

**Cypress Component Test: `cypress/component/LoginForm.cy.tsx`:**

```typescript
import { LoginForm } from '../../components/auth/LoginForm';

describe('LoginForm', () => {
  it('renders and accepts input', () => {
    cy.mount(<LoginForm />);
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="email-input"]').should('have.value', 'test@example.com');
  });
});
```

**E2E Test with Auth: `cypress/e2e/auth-flow.cy.ts`:**

```typescript
describe("Authentication Flow", () => {
  beforeEach(() => {
    cy.cleanupTestData();
    cy.setupTestUser();
  });

  it("completes full login flow with audit verification", () => {
    cy.visit("/login");
    cy.get('[data-testid="email-input"]').type("cypress@test.com");
    cy.get('[data-testid="password-input"]').type("Test123!@#");
    cy.get('[data-testid="login-button"]').click();

    // Verify redirect to dashboard
    cy.url().should("include", "/dashboard");
    cy.get('[data-testid="welcome-message"]').should("contain", "Cypress");

    // Verify audit log was created
    cy.verifyAuditLog("user_login");
  });

  it("handles JWT refresh token rotation", () => {
    cy.loginWithAPI("cypress@test.com", "Test123!@#");
    cy.visit("/dashboard");

    // Force token expiry
    cy.window().then((win) => {
      win.localStorage.setItem("access_token", "expired_token");
    });

    // Make API call that triggers refresh
    cy.visit("/assets");

    // Should still be authenticated
    cy.get('[data-testid="assets-list"]').should("be.visible");
  });
});
```

### 14. Performance Optimizations

**Create `cypress/support/e2e.ts`:**

```typescript
// Disable unnecessary features for speed
Cypress.Screenshot.defaults({ capture: "runner" });
Cypress.config("watchForFileChanges", false);

// Skip UI animations during tests
beforeEach(() => {
  cy.visit("/", {
    onBeforeLoad(win) {
      win.localStorage.setItem("reduceMotion", "true");
    },
  });
});

// Import commands
import "./commands";
```

### 15. Update .gitignore

Add:

```
# New test artifacts
.artifacts/
cypress/videos/
cypress/screenshots/
cypress/downloads/
storybook-static/

# Remove old MCP references
# Remove lines 88-94
```

### 16. Configure Vitest for Unit Testing

**Create `vitest.config.ts`:**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/", "*.config.ts", ".next/", "cypress/"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@/components": path.resolve(__dirname, "./components"),
      "@/lib": path.resolve(__dirname, "./lib"),
      "@/db": path.resolve(__dirname, "./db"),
    },
  },
});
```

**Create `tests/setup.ts`:**

```typescript
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
```

### 17. Create Enhanced GitHub Actions Workflow

**`.github/workflows/tests.yml`:**

```yaml
name: Comprehensive Test Suite
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_ENV: test
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/herit_test

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: herit_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    strategy:
      matrix:
        node-version: [20.18.2]

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup test database
        run: |
          pnpm db:migrate
          pnpm db:validate
        env:
          POSTGRES_URL: ${{ env.DATABASE_URL }}

      - name: Type checking
        run: pnpm cli typecheck

      - name: Linting
        run: pnpm cli lint

      - name: Unit tests with coverage
        run: pnpm vitest run --coverage

      - name: Build application
        run: pnpm build

      - name: Component tests
        run: pnpm cli test:ct

      - name: Storybook tests
        run: |
          pnpm storybook:build
          npx concurrently -k -s first -n "SB,TEST" \
            "npx http-server storybook-static --port 6006 --silent" \
            "npx wait-on tcp:6006 && pnpm test-storybook --url http://localhost:6006"

      - name: E2E tests
        run: |
          pnpm start &
          npx wait-on http://localhost:3000
          pnpm cli test:e2e
        env:
          POSTGRES_URL: ${{ env.DATABASE_URL }}
          SESSION_SECRET: test-secret-for-ci-only-32-characters-minimum
          REFRESH_SECRET: test-refresh-secret-for-ci-only-32-chars

      - name: Database audit verification
        run: pnpm cli test:db

      - name: Security audit
        run: pnpm audit --audit-level=high
        continue-on-error: true

      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-${{ matrix.node-version }}
          path: |
            .artifacts/
            cypress/videos/
            cypress/screenshots/
            coverage/
            test-results/

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        if: always()
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella
```

### 18. Create Documentation

**`docs/testing.md`:**

```markdown
# Testing Guide

## Test Stack

- **Vitest**: Unit testing with React Testing Library
- **Storybook**: Component development and interaction testing
- **MSW**: API mocking for all test types
- **Cypress**: Component and E2E testing
- **Thin CLI**: Agent-friendly test runner with JSON output

## Test Organization
```

tests/
├── unit/ # Vitest unit tests
├── integration/ # API & database integration tests
├── setup.ts # Vitest setup file
└── fixtures/ # Shared test data

cypress/
├── e2e/ # End-to-end tests
├── component/ # Component tests (colocated)
├── fixtures/ # Cypress test data
├── support/ # Commands and utilities
└── tasks/ # Database and custom tasks

components/
└── ComponentName/
├── ComponentName.tsx
├── ComponentName.stories.tsx # Storybook
└── ComponentName.cy.tsx # Cypress component test

````

## Agent Contract
Agents MUST:
1. Run tests via: `pnpm cli <task>`
2. Read results from: `./.artifacts/last-run.json`
3. Check history in: `./.artifacts/test-history.jsonl`
4. NEVER parse console output directly

## Writing Tests

### Unit Tests (Vitest)
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
````

### Component Story (Storybook)

Create `ComponentName.stories.tsx` next to component.

### Cypress Component Test

Create `ComponentName.cy.tsx` next to component.

### E2E Test

Critical user paths in `cypress/e2e/`.

## Authentication Testing

Use custom Cypress commands:

- `cy.loginWithAPI(email, password)`
- `cy.setupTestUser()`
- `cy.verifyAuditLog(action)`
- `cy.cleanupTestData()`

## Database Testing

Use Cypress tasks:

- `cy.task('db:seed', data)`
- `cy.task('db:clean')`
- `cy.task('db:verify-audit', action)`

```

## Files to Delete
- `/mcp-playwright/` (entire directory)
- `/tests/` (entire directory)
- Any MCP/Playwright references in package.json

## Dependencies to Remove
- playwright
- @upstash/context7-mcp
- Any @modelcontextprotocol packages

## New Files Structure
```

.
├── .artifacts/
│ └── last-run.json
├── .storybook/
│ ├── main.ts
│ └── preview.ts
├── cypress/
│ ├── component/
│ ├── e2e/
│ ├── fixtures/
│ └── support/
├── src/
│ ├── mocks/
│ │ └── handlers.ts
│ └── test-utils.tsx
├── tools/
│ └── cli.ts
├── docs/
│ └── testing.md
├── .github/
│ └── workflows/
│ └── tests.yml
├── .nvmrc
├── cypress.config.ts
└── pnpm-lock.yaml

```

## 🚀 MIGRATION CHECKLIST

### Phase 1: Preparation (Day 1)
- [ ] Create branch: `git checkout -b test/cypress-storybook-migration`
- [ ] Create safety tag: `git tag pre-cypress-migration`
- [ ] Document current test coverage and critical user paths
- [ ] Set up Node.js 20.18.2 LTS environment
- [ ] Install pnpm globally and convert package-lock.json

### Phase 2: Core Installation (Day 1-2)
- [ ] Install Cypress, Vitest, Storybook, and MSW packages
- [ ] Create enhanced `cypress.config.ts` with Next.js 15 support
- [ ] Set up `vitest.config.ts` with proper aliases and coverage
- [ ] Configure Storybook with MSW addon integration
- [ ] Create MSW handlers for authentication and API endpoints

### Phase 3: Test Infrastructure (Day 2-3)
- [ ] Create database testing tasks in `cypress/tasks/db-tasks.ts`
- [ ] Add authentication utilities to `cypress/support/commands.ts`
- [ ] Set up test fixtures for estate planning domain objects
- [ ] Create enhanced CLI tool with JSON output and history
- [ ] Configure performance optimizations in `cypress/support/e2e.ts`

### Phase 4: Test Migration (Day 3-4)
- [ ] Port existing critical test scenarios to Cypress
- [ ] Create Storybook stories for major UI components
- [ ] Write unit tests for utility functions and hooks
- [ ] Implement authentication flow E2E tests with audit verification
- [ ] Add component tests for form validation and interactions

### Phase 5: CI/CD Integration (Day 4-5)
- [ ] Create comprehensive GitHub Actions workflow
- [ ] Set up PostgreSQL service for database testing
- [ ] Configure test environment variables and secrets
- [ ] Add coverage reporting to Codecov
- [ ] Test parallel execution and artifact uploads

### Phase 6: Cleanup & Documentation (Day 5)
- [ ] Remove `/mcp-playwright/` directory completely
- [ ] Remove `/tests/` directory after migrating valuable tests
- [ ] Update `.gitignore` with new test artifact patterns
- [ ] Create comprehensive `docs/testing.md` documentation
- [ ] Update `package.json` engines and scripts

## ✅ VERIFICATION STEPS

### Development Environment
1. **Storybook**: `pnpm storybook` starts with MSW active on port 6006
2. **Unit Tests**: `pnpm test:unit` runs Vitest with React Testing Library
3. **Component Tests**: `pnpm test:ct` executes Cypress component tests
4. **E2E Tests**: `pnpm test:e2e` completes authentication and critical flows
5. **CLI Tool**: All commands write JSON to `.artifacts/last-run.json`

### Database Integration
6. **Test Seeding**: `cy.setupTestUser()` creates test data successfully
7. **Audit Verification**: `cy.verifyAuditLog('user_login')` passes
8. **Data Cleanup**: `cy.cleanupTestData()` removes test data properly
9. **Migration Safety**: Database operations use audit-safe patterns

### CI/CD Pipeline
10. **Build Pipeline**: All steps pass in GitHub Actions
11. **PostgreSQL Service**: Database tests execute in CI environment
12. **Artifact Collection**: Videos, screenshots, coverage reports upload
13. **Performance**: Full test suite completes under 15 minutes
14. **Security**: `pnpm audit` passes with no high-severity issues

### Code Quality
15. **Type Safety**: `pnpm typecheck` passes with no errors
16. **Linting**: `pnpm lint` passes with auto-fix enabled
17. **Coverage**: Unit test coverage > 70% for critical paths
18. **Test Stability**: E2E tests pass consistently (< 1% flaky rate)

### Agent Compatibility
19. **JSON Output**: All CLI commands write parseable JSON results
20. **History Tracking**: Test execution history preserved in JSONL format
21. **Error Details**: Failures include actionable error information
22. **Command Interface**: Agents can execute all test types via CLI

## 🎯 SUCCESS METRICS

- **Performance**: 80% reduction in test execution time vs current MCP setup
- **Stability**: < 1% test flakiness rate
- **Coverage**: > 80% coverage for authentication and asset management flows
- **Developer Experience**: New developer can run full test suite in < 5 minutes
- **Maintainability**: Test debugging and updating simplified with modern tooling

## 🚨 ROLLBACK PLAN

If migration fails or causes critical issues:

1. **Immediate Rollback**: `git checkout main && git branch -D test/cypress-storybook-migration`
2. **Restore MCP**: MCP/Playwright infrastructure preserved in `pre-cypress-migration` tag
3. **Emergency Recovery**: All existing test patterns documented and preserved
4. **Database Safety**: All audit and safety protocols maintained throughout migration

This migration provides a comprehensive, modern testing infrastructure that maintains the project's high quality standards while dramatically improving developer productivity and test execution speed.
```
