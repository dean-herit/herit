# Testing Guide

## Overview

This project uses a comprehensive modern testing stack designed for reliability, speed, and maintainability. The testing infrastructure supports estate planning domain requirements with proper database safety protocols and audit trail verification.

## Test Stack

- **Vitest**: Unit testing with React Testing Library
- **Storybook**: Component development and interaction testing
- **MSW**: API mocking for all test types
- **Cypress**: Component and E2E testing with database integration
- **Enhanced CLI**: Agent-friendly test runner with JSON output and history tracking

## Test Organization

```
tests/
├── unit/           # Vitest unit tests
├── integration/    # API & database integration tests
├── setup.ts        # Vitest setup file
└── fixtures/       # Shared test data

cypress/
├── e2e/           # End-to-end tests
├── component/     # Component tests (colocated)
├── fixtures/      # Cypress test data
├── support/       # Commands and utilities
└── tasks/         # Database and custom tasks

components/
└── ComponentName/
    ├── ComponentName.tsx
    ├── ComponentName.stories.tsx  # Storybook
    └── ComponentName.cy.tsx       # Cypress component test

src/
├── mocks/         # MSW handlers
└── test-utils.tsx # Testing utilities and providers
```

## Quick Start

### Installation Verification

```bash
# Check test infrastructure status
pnpm cli status

# View recent test history
pnpm cli history --limit 5
```

### Running Tests

```bash
# Unit tests
pnpm test:unit              # Run all unit tests
pnpm test:unit:watch        # Watch mode
pnpm test:unit:ui           # Visual UI

# Component tests
pnpm test:ct                # Cypress component tests

# E2E tests
pnpm test:e2e               # Headless E2E tests
pnpm test:e2e:headed        # Headed mode for debugging

# Storybook
pnpm storybook              # Start dev server
pnpm storybook:build        # Build static version
pnpm test-storybook         # Run interaction tests

# All tests
pnpm test:all               # Run complete test suite

# CLI tool (recommended for agents)
pnpm cli test:unit          # JSON output to .artifacts/
pnpm cli test:e2e           # With history tracking
```

## Agent Integration

**Agents MUST use the CLI tool for all test operations:**

```bash
# ✅ Correct - Use CLI tool
pnpm cli test:unit
pnpm cli test:e2e

# ❌ Incorrect - Direct commands not supported
pnpm vitest run
pnpm cypress run
```

**Reading Results:**

```javascript
// After running: pnpm cli test:unit
const result = JSON.parse(fs.readFileSync(".artifacts/last-run.json"));
console.log(result.passed); // boolean
console.log(result.output); // truncated output
console.log(result.error); // error details if failed
```

**Test History:**

```bash
# View test execution history
pnpm cli history --limit 10

# Results stored in .artifacts/test-history.jsonl
```

## Writing Tests

### Unit Tests (Vitest)

**Basic component test:**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '../src/test-utils';
import { LoginForm } from '@/components/auth/LoginForm';

describe('LoginForm', () => {
  it('renders and handles user input', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });
});
```

**Testing utilities and helpers:**

```typescript
import { mockUser, mockAsset } from "../src/test-utils";

describe("Estate Planning Utils", () => {
  it("validates Irish IBAN correctly", () => {
    expect(validateIBAN("IE29AIBK93115212345678")).toBe(true);
    expect(validateIBAN("GB29NWBK60161331926819")).toBe(false);
  });

  it("formats EUR currency", () => {
    expect(formatCurrency(500000)).toBe("€500,000.00");
  });
});
```

### Component Stories (Storybook)

**Create ComponentName.stories.tsx next to your component:**

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "@storybook/test";
import { AssetForm } from "./AssetForm";

const meta: Meta<typeof AssetForm> = {
  title: "Estate/AssetForm",
  component: AssetForm,
  parameters: {
    msw: {
      handlers: [
        http.post("/api/assets", () =>
          HttpResponse.json({ success: true, id: "new-asset" }),
        ),
      ],
    },
  },
};

export default meta;

export const PropertyAsset: StoryObj = {
  args: {
    assetType: "property",
    onSave: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Fill form
    await userEvent.type(canvas.getByLabelText(/name/i), "Family Home");
    await userEvent.type(canvas.getByLabelText(/value/i), "500000");
    await userEvent.click(canvas.getByRole("button", { name: /save/i }));

    // Verify callback
    await expect(args.onSave).toHaveBeenCalled();
  },
};
```

### Cypress Component Tests

**Create ComponentName.cy.tsx next to your component:**

```typescript
import { AssetForm } from './AssetForm';

describe('AssetForm', () => {
  it('validates Irish property details', () => {
    cy.mount(<AssetForm assetType="property" />);

    cy.get('[data-testid="eircode-input"]').type('D02 X285');
    cy.get('[data-testid="eircode-validation"]').should('contain', 'Valid');

    cy.get('[data-testid="eircode-input"]').clear().type('INVALID');
    cy.get('[data-testid="eircode-validation"]').should('contain', 'Invalid');
  });
});
```

### E2E Tests

**Critical user journeys in cypress/e2e/:**

```typescript
describe("Asset Management Flow", () => {
  beforeEach(() => {
    cy.cleanupTestData();
    cy.setupTestUser();
    cy.loginWithAPI("cypress@test.com", "Test123!@#");
  });

  it("creates property asset with audit trail", () => {
    cy.fixture("estate-planning").then((data) => {
      cy.visit("/assets");

      // Create asset
      cy.get('[data-testid="add-asset-button"]').click();
      cy.get('[data-testid="asset-name-input"]').type(
        data.assetTypes.property.name,
      );
      cy.get('[data-testid="asset-value-input"]').type(
        data.assetTypes.property.value.toString(),
      );
      cy.get('[data-testid="save-button"]').click();

      // Verify creation
      cy.get('[data-testid="success-message"]').should("be.visible");

      // Verify audit log (critical for compliance)
      cy.verifyAuditLog("asset_created");
    });
  });
});
```

## Authentication Testing

**Use custom Cypress commands for auth flows:**

```typescript
// Setup test user
cy.setupTestUser();

// Login via API (faster than UI)
cy.loginWithAPI("test@example.com", "password");

// Seed test data
cy.seedTestAssets("user-id");
cy.seedTestBeneficiaries("user-id");

// Verify audit compliance
cy.verifyAuditLog("user_login");

// Cleanup after tests
cy.cleanupTestData();
```

## Database Testing

**Critical for estate planning data integrity:**

```typescript
// Cypress database tasks
cy.task("db:seed", {
  user: { email: "test@example.com", onboarding_completed: true },
  assets: [{ name: "Test Home", type: "property", value: 500000 }],
});

cy.task("db:clean"); // Removes test data, preserves audit logs

cy.task("db:verify-audit", "asset_created").then((audit) => {
  expect(audit.action).to.equal("asset_created");
  expect(audit.user_id).to.exist;
});
```

## MSW API Mocking

**Consistent mocking across all test types:**

```typescript
// src/mocks/handlers.ts
export const handlers = [
  http.post('/api/auth/login', ({ request }) => {
    return HttpResponse.json({
      accessToken: 'mock-token',
      user: { id: '1', email: 'test@example.com' }
    });
  }),

  http.get('/api/assets', () => {
    return HttpResponse.json([mockAsset]);
  }),
];

// Override in specific stories/tests
parameters: {
  msw: {
    handlers: [
      http.post('/api/assets', () => HttpResponse.error()),
    ],
  },
}
```

## Performance & Optimization

### Speed Optimizations

- **Animations disabled** in all test environments
- **MSW intercepts network** requests (no real API calls)
- **Database seeding** is fast and isolated
- **Parallel execution** in CI/CD
- **Smart retry logic** for flaky tests

### CI/CD Pipeline

```yaml
# .github/workflows/tests.yml
- Type checking (pnpm cli typecheck)
- Linting (pnpm cli lint)
- Unit tests with coverage
- Build verification
- Component tests
- Storybook interaction tests
- E2E tests with database
- Security audit
- Artifact collection
```

## Debugging

### Local Debugging

```bash
# Interactive mode
pnpm cy:open                # Cypress test runner
pnpm test:unit:ui          # Vitest UI
pnpm storybook             # Component development

# Headed E2E tests
pnpm test:e2e:headed       # See browser during tests

# CLI debug info
pnpm cli status            # Check infrastructure
pnpm cli history           # View recent failures
```

### CI/CD Debugging

```bash
# Download artifacts from failed runs
- Videos: cypress/videos/
- Screenshots: cypress/screenshots/
- Coverage: coverage/
- Test results: .artifacts/
- Logs: GitHub Actions logs
```

### Common Issues

**1. Database connection fails:**

```bash
# Verify database is running
pnpm db:validate

# Check environment variables
echo $POSTGRES_URL
```

**2. Tests hang on auth:**

```bash
# Check MSW handlers are loaded
# Verify test user is seeded
cy.setupTestUser();
```

**3. Cypress component tests fail:**

```bash
# Verify Next.js config in cypress.config.ts
# Check component imports and dependencies
```

## Estate Planning Domain

### Required Test Coverage

**Authentication & Onboarding:**

- Multi-step registration flow
- JWT token rotation and refresh
- Session management and security
- Audit logging for all auth events

**Asset Management:**

- Irish property validation (Eircode)
- Financial account validation (IBAN, BIC)
- Asset value calculations and totals
- Document attachment and storage
- Asset deletion with confirmation

**Beneficiary Management:**

- Relationship validation
- Allocation percentage calculations (must sum to 100%)
- Contact information validation
- Inheritance distribution logic

**Will Creation:**

- Legal template generation
- Digital signature integration
- Document versioning and history
- Compliance with Irish inheritance law

**Data Integrity & Audit:**

- All user actions logged to audit_events table
- Database changes tracked with before/after values
- Audit logs are append-only (never deleted)
- Recovery capabilities for data restoration

### Irish Legal Compliance

**Required validations:**

- Eircode format: `A65 F4E2` or `A65F4E2`
- IBAN format: `IE29AIBK93115212345678`
- Phone numbers: `+353` prefix for Irish numbers
- Currency: Euro (€) formatting with Irish locale
- Date formats: DD/MM/YYYY for Irish users

**Test fixtures include:**

- Valid Irish addresses with Eircodes
- Irish bank account details (IBAN/BIC)
- Common Irish surnames and locations
- Realistic property values for Irish market

## Best Practices

### Test Organization

1. **Colocate component tests** with components
2. **Use descriptive test names** that explain the business value
3. **Group related tests** in describe blocks
4. **Clean up after tests** (especially database state)
5. **Test user journeys**, not just individual functions

### Data Management

1. **Use fixtures** for consistent test data
2. **Seed database** with realistic estate planning data
3. **Clean up test data** but preserve audit logs
4. **Test with Irish-specific** data formats and validations

### Debugging Strategy

1. **Start with unit tests** for rapid feedback
2. **Use Storybook** for component development
3. **E2E tests** for critical user journeys
4. **Check audit logs** for compliance testing
5. **Use CLI tool results** for consistent agent integration

This testing infrastructure ensures the estate planning platform is reliable, secure, and compliant with Irish legal requirements while providing excellent developer experience and CI/CD integration.
