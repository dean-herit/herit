# Testing Master Plan 2025 - Estate Planning Platform

## 🎯 Overview

This document outlines a **comprehensive 2025-grade testing strategy** for our estate planning platform. Based on critical analysis against modern best practices, this plan addresses significant gaps while building on our solid foundation.

## 🚨 Critical Assessment Summary

**Current Testing Maturity Score: 4/10**
- ✅ **Strong Foundation**: Modern stack with Vitest, Storybook, MSW, Cypress
- 🔥 **Critical Gaps**: Database integration, security testing, domain logic validation
- ⚠️ **Risk Level**: HIGH - Insufficient for production estate planning platform

## 🔧 Enhanced Test Stack (2025 Grade)

### Core Testing Framework
- **Vitest 3.2+**: Unit testing with React Testing Library
- **Storybook 8.6+**: Component development and interaction testing  
- **MSW 2.11+**: API mocking for all test types
- **Cypress 15+**: Component and E2E testing with database integration
- **Enhanced CLI**: Agent-friendly test runner with JSON output

### New Infrastructure Components (REQUIRED)
- **SuperTest**: Real API integration testing
- **Drizzle Seed**: Database seeding and cleanup
- **TestContainers**: Isolated database testing
- **Faker.js**: Realistic test data generation
- **Security Test Suite**: Authentication and authorization validation

## 📁 Enhanced Test Organization (2025 Architecture)

```
tests/
├── unit/                           # Vitest unit tests
├── integration/                    # 🆕 API & database integration tests
│   ├── api/                       # 🆕 Real API endpoint tests
│   ├── database/                  # 🆕 Database operation tests
│   └── helpers/                   # 🆕 Integration test utilities
├── security/                      # 🆕 Security & auth testing
│   ├── auth.security.test.ts      # 🆕 JWT, session, rate limiting
│   ├── access-control.test.ts     # 🆕 Authorization testing
│   └── data-protection.test.ts    # 🆕 PII/sensitive data handling
├── domain/                        # 🆕 Estate planning business logic
│   ├── beneficiaries.domain.test.ts  # 🆕 Allocation logic
│   ├── assets.domain.test.ts         # 🆕 Irish compliance
│   └── wills.domain.test.ts          # 🆕 Legal requirements
├── fixtures/                      # Enhanced test data
│   ├── irish-data.ts             # 🆕 Irish-specific test data
│   └── estate-planning.ts         # 🆕 Domain-specific fixtures
├── setup.ts                       # Enhanced Vitest setup
└── helpers/                       # 🆕 Test utilities
    ├── database-helpers.ts        # 🆕 DB seeding/cleanup
    ├── auth-helpers.ts            # 🆕 Authentication utilities
    └── test-app.ts               # 🆕 Test application factory

cypress/
├── e2e/                          # End-to-end tests
├── component/                    # Component tests (colocated)
├── fixtures/                     # Cypress test data
├── support/                      # Commands and utilities
└── tasks/                        # Database and custom tasks

components/
└── ComponentName/
    ├── ComponentName.tsx
    ├── ComponentName.stories.tsx  # Storybook
    └── ComponentName.cy.tsx       # Cypress component test

src/
├── mocks/                        # MSW handlers
└── test-utils.tsx               # Testing utilities and providers
```

## 🚀 Enhanced Test Commands (2025 Grade)

### **New Package Dependencies Required**

```json
{
  "devDependencies": {
    "supertest": "^7.1.0",
    "drizzle-seed": "^0.1.0", 
    "testcontainers": "^10.4.0",
    "@faker-js/faker": "^8.4.1",
    "nodemailer-mock": "^2.0.0",
    "stripe-mock": "^3.0.0"
  }
}
```

### **Enhanced NPM Scripts**

```json
{
  "scripts": {
    // Existing scripts
    "test:unit": "vitest run",
    "test:unit:watch": "vitest watch", 
    "test:unit:ui": "vitest --ui",
    "test:ct": "cypress run --component",
    "test:e2e": "cypress run --e2e",
    "test:e2e:headed": "cypress run --headed --e2e",
    "test:all": "pnpm test:unit && pnpm test:ct && pnpm test:e2e",
    
    // 🆕 NEW: Integration & Database Testing
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:db": "vitest run tests/integration/database/",
    "test:api": "vitest run tests/integration/api/",
    
    // 🆕 NEW: Security Testing  
    "test:security": "vitest run tests/security/",
    "test:security:auth": "vitest run tests/security/auth.security.test.ts",
    "test:security:access": "vitest run tests/security/access-control.test.ts",
    
    // 🆕 NEW: Domain Testing
    "test:domain": "vitest run tests/domain/",
    "test:domain:beneficiaries": "vitest run tests/domain/beneficiaries.domain.test.ts",
    "test:domain:assets": "vitest run tests/domain/assets.domain.test.ts",
    
    
    // 🆕 NEW: Comprehensive Test Suites
    "test:backend": "pnpm test:unit && pnpm test:integration && pnpm test:security && pnpm test:domain",
    "test:full": "pnpm test:backend && pnpm test:ct && pnpm test:e2e",
    
    // 🆕 NEW: Database Operations
    "test:db:seed": "npx tsx tests/helpers/seed-test-database.ts",
    "test:db:clean": "npx tsx tests/helpers/clean-test-database.ts",
    "test:db:reset": "pnpm test:db:clean && pnpm test:db:seed",
    
    // Enhanced CLI
    "cli": "tsx tools/cli.ts",
    "test:cli": "pnpm cli status && pnpm cli history --limit 5"
  }
}
```

### **Running Tests (Enhanced)**

```bash
# 🆕 Database Integration Tests
pnpm test:db                # Database operation tests
pnpm test:integration       # Full API integration tests

# 🆕 Security Tests
pnpm test:security          # Complete security test suite
pnpm test:security:auth     # Authentication flow tests

# 🆕 Estate Planning Domain Tests  
pnpm test:domain            # Business logic validation
pnpm test:domain:assets     # Irish compliance testing

# 🆕 Comprehensive Test Suites
pnpm test:backend           # All backend tests (unit + integration + security + domain)
pnpm test:full              # Complete test suite
```

## 🤖 Enhanced Agent Integration (2025)

**Agents MUST use the enhanced CLI tool for all test operations:**

```bash
# ✅ Correct - Enhanced CLI tool usage
pnpm cli test:unit
pnpm cli test:integration      # 🆕 NEW
pnpm cli test:security        # 🆕 NEW 
pnpm cli test:domain          # 🆕 NEW
pnpm cli test:backend         # 🆕 NEW - Complete backend suite

# ❌ Incorrect - Direct commands not supported  
pnpm vitest run
pnpm cypress run
```

**Enhanced Results Structure:**

```typescript
// 🆕 Enhanced result structure after: pnpm cli test:backend
interface TestResult {
  passed: boolean;
  output: string;
  error?: string;
  suites: {
    unit: TestSuiteResult;
    integration: TestSuiteResult;    // 🆕 NEW
    security: TestSuiteResult;       // 🆕 NEW
    domain: TestSuiteResult;         // 🆕 NEW
  };
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  securityIssues?: SecurityIssue[]; // 🆕 NEW
}

interface SecurityIssue {          // 🆕 NEW
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  file?: string;
  line?: number;
}
```

**Enhanced Test History:**

```bash
# View enhanced test execution history
pnpm cli history --limit 10 --type=backend
pnpm cli history --security-issues           # 🆕 NEW: Security issue history

# Enhanced results stored in multiple files
# .artifacts/test-history.jsonl              (existing)
# .artifacts/security-history.jsonl          # 🆕 NEW
```

## 📋 Test Configuration Files (Required)

### **🆕 vitest.integration.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    name: "integration",
    environment: "node", // Real Node.js environment for API tests
    setupFiles: ["./tests/integration/setup.ts"],
    include: ["tests/integration/**/*.test.ts"],
    timeout: 30000, // Longer timeout for database operations
    pool: "forks", // Isolated processes for database tests
    testTimeout: 10000,
    teardownTimeout: 5000,
    env: {
      NODE_ENV: "test",
      // Use TestContainers PostgreSQL instance
      POSTGRES_URL: "postgresql://test:test@localhost:5433/test_integration_db",
      SESSION_SECRET: "integration-test-secret-min-32-chars",
      REFRESH_SECRET: "integration-refresh-secret-min-32-chars",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
});
```


### **🆕 TestContainers Database Setup**

```typescript
// tests/helpers/test-containers.ts
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

export class TestDatabaseContainer {
  private container: PostgreSqlContainer;
  private connectionString: string;
  public db: ReturnType<typeof drizzle>;

  async start() {
    this.container = new PostgreSqlContainer("postgres:15")
      .withDatabase("test_herit")
      .withUsername("test")
      .withPassword("test")
      .withTmpFs({ "/var/lib/postgresql/data": "rw" }); // Faster in-memory storage
      
    const startedContainer = await this.container.start();
    
    this.connectionString = startedContainer.getConnectionUri();
    const client = postgres(this.connectionString);
    this.db = drizzle(client, { schema });
    
    // Run migrations
    await this.runMigrations();
    
    return this;
  }

  async stop() {
    if (this.container) {
      await this.container.stop();
    }
  }

  getConnectionString() {
    return this.connectionString;
  }

  private async runMigrations() {
    // Apply migrations to test database
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    await migrate(this.db, { migrationsFolder: "./drizzle" });
  }
}
```

## 📝 Enhanced Testing Patterns (2025)

### **🆕 Database Integration Tests**

```typescript
// tests/integration/database/assets.db.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { TestDatabaseContainer } from "../../helpers/test-containers";
import { seedTestData, createTestUser } from "../../helpers/database-helpers";
import * as schema from "@/db/schema";

describe("Assets Database Integration", () => {
  let testDb: TestDatabaseContainer;
  let testUser: { id: string; email: string };

  beforeAll(async () => {
    testDb = await new TestDatabaseContainer().start();
  });

  afterAll(async () => {
    await testDb.stop();
  });

  beforeEach(async () => {
    // Clean and seed test data
    await seedTestData(testDb.db);
    testUser = await createTestUser(testDb.db, {
      email: "test@example.com",
      firstName: "Test",
      lastName: "User"
    });
  });

  afterEach(async () => {
    // Clean up test data but preserve schema
    await testDb.db.delete(schema.assets);
    await testDb.db.delete(schema.auditEvents);
    await testDb.db.delete(schema.users);
  });

  it("creates asset with audit trail", async () => {
    // Insert asset
    const [asset] = await testDb.db.insert(schema.assets).values({
      userId: testUser.id,
      name: "Family Home",
      type: "property", 
      value: 500000,
      metadata: { eircode: "D02 X285", location: "Dublin" }
    }).returning();

    expect(asset).toBeDefined();
    expect(asset.name).toBe("Family Home");
    expect(asset.userId).toBe(testUser.id);

    // Verify audit trail was created by database trigger
    const auditLogs = await testDb.db.select()
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.tableName, "assets"));

    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].action).toBe("CREATE");
    expect(auditLogs[0].userId).toBe(testUser.id);
    expect(JSON.parse(auditLogs[0].newData!)).toMatchObject({
      name: "Family Home",
      type: "property"
    });
  });

  it("handles asset deletion with audit preservation", async () => {
    // Create asset
    const [asset] = await testDb.db.insert(schema.assets).values({
      userId: testUser.id,
      name: "Test Asset",
      type: "financial",
      value: 100000
    }).returning();

    // Delete asset
    await testDb.db.delete(schema.assets)
      .where(eq(schema.assets.id, asset.id));

    // Verify asset is deleted
    const deletedAsset = await testDb.db.select()
      .from(schema.assets)
      .where(eq(schema.assets.id, asset.id));
    
    expect(deletedAsset).toHaveLength(0);

    // Verify audit log is preserved (CRITICAL for compliance)
    const auditLogs = await testDb.db.select()
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.tableName, "assets"))
      .orderBy(schema.auditEvents.createdAt);

    expect(auditLogs).toHaveLength(2); // CREATE + DELETE
    expect(auditLogs[1].action).toBe("DELETE");
    expect(JSON.parse(auditLogs[1].oldData!)).toMatchObject({
      name: "Test Asset"
    });
  });

  it("enforces user data isolation", async () => {
    // Create second user
    const user2 = await createTestUser(testDb.db, {
      email: "user2@example.com", 
      firstName: "User2",
      lastName: "Test"
    });

    // Create assets for both users
    await testDb.db.insert(schema.assets).values([
      { userId: testUser.id, name: "User 1 Asset", type: "property", value: 300000 },
      { userId: user2.id, name: "User 2 Asset", type: "financial", value: 150000 }
    ]);

    // Verify user 1 only sees their assets
    const user1Assets = await testDb.db.select()
      .from(schema.assets)
      .where(eq(schema.assets.userId, testUser.id));

    expect(user1Assets).toHaveLength(1);
    expect(user1Assets[0].name).toBe("User 1 Asset");

    // Verify user 2 only sees their assets  
    const user2Assets = await testDb.db.select()
      .from(schema.assets)
      .where(eq(schema.assets.userId, user2.id));

    expect(user2Assets).toHaveLength(1);
    expect(user2Assets[0].name).toBe("User 2 Asset");
  });
});
```

### **🆕 API Integration Tests**

```typescript
// tests/integration/api/assets.api.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { TestDatabaseContainer } from "../../helpers/test-containers";
import { createTestApp, TestApp } from "../../helpers/test-app";
import { createTestUser, authenticateUser } from "../../helpers/auth-helpers";

describe("Assets API Integration", () => {
  let testDb: TestDatabaseContainer;
  let app: TestApp;
  let authToken: string;
  let testUser: { id: string; email: string };

  beforeAll(async () => {
    testDb = await new TestDatabaseContainer().start();
    app = await createTestApp(testDb.getConnectionString());
  });

  afterAll(async () => {
    await app.close();
    await testDb.stop();
  });

  beforeEach(async () => {
    testUser = await createTestUser(testDb.db, {
      email: "api-test@example.com",
      firstName: "API",
      lastName: "Test"
    });
    authToken = await authenticateUser(app, testUser.email, "TestPassword123!");
  });

  it("creates asset with real API endpoint", async () => {
    const assetData = {
      name: "Integration Test Property",
      type: "property",
      value: 750000,
      eircode: "D02 X285",
      location: "Dublin, Ireland"
    };

    const response = await request(app.server)
      .post("/api/assets")
      .set("Authorization", `Bearer ${authToken}`)
      .send(assetData)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: assetData.name,
      type: assetData.type,
      value: assetData.value,
      userId: testUser.id
    });

    // Verify in database
    const asset = await testDb.db.select()
      .from(schema.assets)
      .where(eq(schema.assets.id, response.body.id));

    expect(asset).toHaveLength(1);
    expect(asset[0].name).toBe(assetData.name);
  });

  it("validates Irish Eircode format", async () => {
    const invalidAssetData = {
      name: "Invalid Property",
      type: "property",
      value: 500000,
      eircode: "INVALID_CODE"
    };

    const response = await request(app.server)
      .post("/api/assets")
      .set("Authorization", `Bearer ${authToken}`)
      .send(invalidAssetData)
      .expect(400);

    expect(response.body.error).toContain("Invalid Eircode format");
    
    // Verify no asset was created
    const assets = await testDb.db.select()
      .from(schema.assets)
      .where(eq(schema.assets.userId, testUser.id));
      
    expect(assets).toHaveLength(0);
  });

  it("enforces authentication", async () => {
    const assetData = {
      name: "Unauthorized Asset",
      type: "financial",
      value: 100000
    };

    // Without auth token
    await request(app.server)
      .post("/api/assets")
      .send(assetData)
      .expect(401);

    // With invalid token
    await request(app.server)
      .post("/api/assets")
      .set("Authorization", "Bearer invalid_token")
      .send(assetData)
      .expect(401);
  });

  it("handles rate limiting", async () => {
    const requests = Array.from({ length: 6 }, () =>
      request(app.server)
        .post("/api/assets")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: `Asset ${Date.now()}`,
          type: "financial",
          value: 50000
        })
    );

    const responses = await Promise.all(requests.map(r => r.catch(err => err.response)));
    const rateLimited = responses.filter(r => r.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### **🆕 Security Testing**

```typescript
// tests/security/auth.security.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { TestDatabaseContainer } from "../helpers/test-containers";
import { createTestApp, TestApp } from "../helpers/test-app";
import { createTestUser } from "../helpers/auth-helpers";
import { generateJWT, verifyJWT } from "@/lib/auth";

describe("Authentication Security", () => {
  let testDb: TestDatabaseContainer;
  let app: TestApp;

  beforeAll(async () => {
    testDb = await new TestDatabaseContainer().start();
    app = await createTestApp(testDb.getConnectionString());
  });

  afterAll(async () => {
    await app.close();
    await testDb.stop();
  });

  beforeEach(async () => {
    await createTestUser(testDb.db, {
      email: "security@example.com",
      firstName: "Security", 
      lastName: "Test"
    });
  });

  it("prevents JWT token reuse after logout", async () => {
    // Login to get token
    const loginResponse = await request(app.server)
      .post("/api/auth/login")
      .send({
        email: "security@example.com",
        password: "TestPassword123!"
      })
      .expect(200);

    const { accessToken } = loginResponse.body;

    // Verify token works
    await request(app.server)
      .get("/api/auth/session")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    // Logout
    await request(app.server)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    // Token should now be invalid
    await request(app.server)
      .get("/api/auth/session")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(401);
  });

  it("enforces rate limiting on login attempts", async () => {
    const loginAttempts = Array.from({ length: 6 }, () =>
      request(app.server)
        .post("/api/auth/login")
        .send({
          email: "security@example.com",
          password: "wrong_password"
        })
    );

    const responses = await Promise.all(
      loginAttempts.map(attempt => attempt.catch(err => err.response))
    );

    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  it("validates JWT token expiration", async () => {
    // Create expired token
    const expiredToken = await generateJWT(
      { userId: "test", email: "security@example.com" },
      { expiresIn: "-1h" } // Expired 1 hour ago
    );

    await request(app.server)
      .get("/api/auth/session")
      .set("Authorization", `Bearer ${expiredToken}`)
      .expect(401);
  });

  it("prevents session fixation attacks", async () => {
    // Login with user 1
    const login1 = await request(app.server)
      .post("/api/auth/login") 
      .send({
        email: "security@example.com",
        password: "TestPassword123!"
      });

    const token1 = login1.body.accessToken;

    // Create second user
    await createTestUser(testDb.db, {
      email: "security2@example.com",
      firstName: "Security2",
      lastName: "Test"
    });

    // Login with user 2 - should get different token
    const login2 = await request(app.server)
      .post("/api/auth/login")
      .send({
        email: "security2@example.com", 
        password: "TestPassword123!"
      });

    const token2 = login2.body.accessToken;

    // Tokens should be different
    expect(token1).not.toBe(token2);

    // Each token should only work for its respective user
    const session1 = await request(app.server)
      .get("/api/auth/session")
      .set("Authorization", `Bearer ${token1}`)
      .expect(200);

    const session2 = await request(app.server)
      .get("/api/auth/session")
      .set("Authorization", `Bearer ${token2}`)
      .expect(200);

    expect(session1.body.user.email).toBe("security@example.com");
    expect(session2.body.user.email).toBe("security2@example.com");
  });

  it("validates password strength requirements", async () => {
    const weakPasswords = [
      "123456",
      "password",
      "abc123",
      "short",
      "NoNumbers",
      "nonumber"
    ];

    for (const weakPassword of weakPasswords) {
      const response = await request(app.server)
        .post("/api/auth/register")
        .send({
          email: `weak${Math.random()}@example.com`,
          password: weakPassword,
          firstName: "Test",
          lastName: "User"
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Password");
    }
  });
});
```

### **🆕 Estate Planning Domain Tests**

```typescript
// tests/domain/beneficiaries.domain.test.ts
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { TestDatabaseContainer } from "../helpers/test-containers";
import { createTestApp, TestApp } from "../helpers/test-app";
import { createTestUser, authenticateUser } from "../helpers/auth-helpers";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Beneficiaries Domain Logic", () => {
  let testDb: TestDatabaseContainer;
  let app: TestApp;
  let authToken: string;
  let testUser: { id: string; email: string };

  beforeAll(async () => {
    testDb = await new TestDatabaseContainer().start();
    app = await createTestApp(testDb.getConnectionString());
  });

  afterAll(async () => {
    await app.close();
    await testDb.stop();
  });

  beforeEach(async () => {
    testUser = await createTestUser(testDb.db);
    authToken = await authenticateUser(app, testUser.email, "TestPassword123!");
  });

  it("prevents over-allocation beyond 100%", async () => {
    // Create beneficiaries totaling 90%
    await request(app.server)
      .post("/api/beneficiaries")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "John Doe",
        relationship: "spouse",
        allocation: 60,
        email: "john@example.com"
      })
      .expect(201);

    await request(app.server)
      .post("/api/beneficiaries")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Jane Doe",
        relationship: "child", 
        allocation: 30,
        email: "jane@example.com"
      })
      .expect(201);

    // Attempt to add beneficiary that would exceed 100%
    const response = await request(app.server)
      .post("/api/beneficiaries")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Bob Smith",
        relationship: "friend",
        allocation: 20, // Would total 110%
        email: "bob@example.com"
      })
      .expect(400);

    expect(response.body.error).toContain("Total allocation exceeds 100%");
    
    // Verify beneficiary was not created
    const beneficiaries = await testDb.db.select()
      .from(schema.beneficiaries)
      .where(eq(schema.beneficiaries.userId, testUser.id));
      
    expect(beneficiaries).toHaveLength(2); // Only the first two
  });

  it("validates Irish phone number format", async () => {
    const invalidPhones = [
      "123456789",      // No country code
      "+44123456789",   // Wrong country code (UK)
      "+353123",        // Too short  
      "invalid",        // Non-numeric
    ];

    for (const phone of invalidPhones) {
      const response = await request(app.server)
        .post("/api/beneficiaries")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Beneficiary",
          relationship: "child",
          allocation: 50,
          phone: phone
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid phone number format");
    }
  });

  it("validates beneficiary relationship types", async () => {
    const validRelationships = ["spouse", "child", "parent", "sibling", "friend", "charity"];
    const invalidRelationship = "invalid_relationship";

    // Valid relationships should work
    for (let i = 0; i < validRelationships.length; i++) {
      await request(app.server)
        .post("/api/beneficiaries")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: `Beneficiary ${i}`,
          relationship: validRelationships[i],
          allocation: Math.floor(100 / validRelationships.length),
          email: `beneficiary${i}@example.com`
        })
        .expect(201);
    }

    // Invalid relationship should fail
    const response = await request(app.server)
      .post("/api/beneficiaries")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Invalid Beneficiary",
        relationship: invalidRelationship,
        allocation: 10,
        email: "invalid@example.com"
      })
      .expect(400);

    expect(response.body.error).toContain("Invalid relationship type");
  });

  it("calculates allocation totals correctly", async () => {
    const beneficiaryData = [
      { name: "Spouse", relationship: "spouse", allocation: 50 },
      { name: "Child 1", relationship: "child", allocation: 25 },
      { name: "Child 2", relationship: "child", allocation: 25 }
    ];

    // Create beneficiaries
    for (const data of beneficiaryData) {
      await request(app.server)
        .post("/api/beneficiaries")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...data,
          email: `${data.name.toLowerCase().replace(" ", "")}@example.com`
        })
        .expect(201);
    }

    // Get allocation summary
    const response = await request(app.server)
      .get("/api/beneficiaries/allocation-summary")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      totalAllocation: 100,
      remainingAllocation: 0,
      beneficiaryCount: 3,
      isComplete: true
    });
  });
});
```

### Unit Tests (Enhanced)

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

## 📅 Implementation Timeline (4-Week Plan)

### **Phase 1: Foundation (Weeks 1-2)**
**Priority: CRITICAL - Required for production readiness**

**Week 1:**
- ✅ Install new dependencies (`supertest`, `drizzle-seed`, `testcontainers`, `@faker-js/faker`)
- ✅ Create `TestDatabaseContainer` infrastructure 
- ✅ Setup `vitest.integration.config.ts`
- ✅ Create database helper utilities (`tests/helpers/database-helpers.ts`)
- ✅ Build first database integration test

**Week 2:**
- ✅ Complete API integration testing framework (`tests/integration/api/`)
- ✅ Create `createTestApp` helper for SuperTest integration
- ✅ Build authentication helpers (`tests/helpers/auth-helpers.ts`)
- ✅ Implement first 5 critical integration tests

**Deliverable:** Functional database and API integration testing suite

### **Phase 2: Security & Domain Testing (Weeks 3-4)**  
**Priority: HIGH - Security is non-negotiable for estate planning**

**Week 3:**
- ✅ Build comprehensive security test suite (`tests/security/`)
- ✅ Implement JWT lifecycle testing (login, refresh, logout, expiration)
- ✅ Create rate limiting validation tests
- ✅ Add password security and session management tests

**Week 4:**
- ✅ Create estate planning domain tests (`tests/domain/`)
- ✅ Implement beneficiary allocation logic tests (100% validation)
- ✅ Add Irish compliance validation tests (Eircode, IBAN, phone)
- ✅ Build asset management business rule tests
- ✅ Enhanced CLI tool with security reporting

**Deliverable:** Production-ready security and domain validation testing suite

## 🔧 Local Development Integration

### **Pre-commit Hook Enhancement**

```json
{
  "lint-staged": {
    "**/*.{ts,tsx}": [
      "pnpm lint --fix",
      "pnpm typecheck"
    ],
    "tests/**/*.test.ts": [
      "pnpm test:backend --related"
    ],
    "app/api/**/*.ts": [
      "pnpm test:integration --related",
      "pnpm test:security --related"
    ]
  }
}
```

## 📊 Success Metrics & KPIs

### **Testing Quality Metrics (Target 2025)**

| Metric | Current | Target | Critical |
|--------|---------|---------|----------|
| **Overall Test Coverage** | ~40% | 85%+ | ✅ |
| **Backend Test Coverage** | 0% | 90%+ | 🔥 |  
| **Security Test Coverage** | 0% | 95%+ | 🔥 |
| **Integration Test Count** | 0 | 50+ | 🔥 |
| **Domain Test Count** | 0 | 30+ | ⚠️ |
| **Test Execution Time** | ~5s | <90s | ✅ |
| **Security Issues Detected** | 0 | >10 | 🔥 |

### **Core Testing Readiness Checklist**

- [ ] **Database Integration**: All CRUD operations tested with real database
- [ ] **Security Validation**: JWT flows, rate limiting, auth tested comprehensively  
- [ ] **Irish Compliance**: Eircode, IBAN, phone validation working
- [ ] **Domain Logic**: Beneficiary allocation, asset rules validated
- [ ] **Test Automation**: All test suites running consistently
- [ ] **Security Monitoring**: Test history and security issue tracking
- [ ] **Documentation**: Developer onboarding guide complete

## 🎯 Final Recommendation

### **IMMEDIATE ACTION REQUIRED**

The current testing infrastructure represents a **critical risk** for a production estate planning platform. The 2025 analysis reveals that while the foundation is solid, the missing components are non-negotiable:

### **Must Implement (Weeks 1-4):**
1. **Database Integration Testing** - Prevents data corruption and ensures audit trails
2. **Security Testing Suite** - Protects sensitive financial and legal data  
3. **API Integration Testing** - Validates real-world API behavior
4. **Estate Planning Domain Tests** - Ensures Irish legal compliance

### **Investment Justification:**
- **Time Investment**: 4 weeks of focused development
- **Risk Mitigation**: Prevents potential legal liability and data breaches
- **Long-term Savings**: Every week invested saves months of production debugging
- **Compliance**: Required for Irish legal requirements and GDPR compliance

### **Success Indicators:**
- All test suites running and passing consistently
- Security issues caught before reaching production
- Irish compliance violations prevented through validation
- Database audit trails verified and tested
- Developer confidence in deployment process

**The testing master plan upgrade is not optional—it's essential for production readiness in the estate planning domain.**
