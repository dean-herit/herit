/**
 * Universal Test Setup - Real Authentication & Database
 * Provides consistent setup for all backend API tests
 * No more complex mocking - uses real auth and database
 */

import { vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { TestAuthManager, type TestAuthContext } from './test-auth-utils';
import { TestDatabaseUtils } from './test-database-utils';

// Re-export for convenience
export { TestAuthManager, TestDatabaseUtils };

// Global test context
export interface TestContext {
  authenticatedUser?: TestAuthContext;
  unauthenticatedMode?: boolean;
  cleanup: (() => Promise<void>)[];
}

// Shared test context across all test files
let globalTestContext: TestContext = { cleanup: [] };

/**
 * Setup authenticated test environment
 */
export async function setupAuthenticatedTest(userOverrides?: any): Promise<TestAuthContext> {
  // Create authenticated test user
  const authContext = await TestAuthManager.createAuthenticatedTestUser(userOverrides);
  
  // Mock the getSession function to return this user
  const getSessionMock = TestAuthManager.mockGetSession(authContext);
  
  // Import and mock the auth module dynamically
  const authModule = await import('@/app/lib/auth');
  vi.mocked(authModule.getSession).mockImplementation(getSessionMock);
  
  // Also mock requireAuth to return the user directly
  vi.mocked(authModule.requireAuth).mockResolvedValue(authContext.user);
  
  // Store context for cleanup
  globalTestContext.authenticatedUser = authContext;
  globalTestContext.cleanup.push(async () => {
    await TestAuthManager.cleanupTestUser(authContext.user.id);
  });
  
  return authContext;
}

/**
 * Setup unauthenticated test environment
 */
export async function setupUnauthenticatedTest() {
  const getSessionMock = TestAuthManager.mockUnauthenticatedSession();
  
  // Import and mock the auth module dynamically
  const authModule = await import('@/app/lib/auth');
  vi.mocked(authModule.getSession).mockImplementation(getSessionMock);
  
  globalTestContext.unauthenticatedMode = true;
}

/**
 * Setup test environment with real database, no auth mocking
 */
export function setupRealDatabaseTest() {
  TestDatabaseUtils.validateTestEnvironment();
  
  // No auth mocking - tests will use whatever auth state is set up
  // Useful for testing auth routes themselves
}

/**
 * Universal beforeEach hook for all API tests
 */
export function setupApiTestHooks() {
  beforeEach(async () => {
    // Clear any previous mocks
    vi.clearAllMocks();
    
    // Reset test context
    globalTestContext = { cleanup: [] };
    
    // Validate test environment
    TestDatabaseUtils.validateTestEnvironment();
  });
  
  afterEach(async () => {
    // Run all cleanup functions
    for (const cleanup of globalTestContext.cleanup) {
      await cleanup();
    }
    
    // Clear mocks
    vi.resetAllMocks();
    
    // Reset modules to ensure clean state for next test
    vi.resetModules();
  });
}

/**
 * Get current test context
 */
export function getTestContext(): TestContext {
  return globalTestContext;
}

/**
 * Create test request with proper authentication headers
 */
export function createAuthenticatedRequest(
  url: string,
  options: RequestInit = {},
  authContext?: TestAuthContext
): NextRequest {
  const auth = authContext || globalTestContext.authenticatedUser;
  if (!auth) {
    throw new Error('No authenticated user in test context. Call setupAuthenticatedTest() first.');
  }
  
  const headers = new Headers(options.headers);
  headers.set('Cookie', `herit_access_token=${auth.accessToken}; herit_refresh_token=${auth.refreshToken}`);
  
  return new NextRequest(url, {
    ...options,
    headers,
  });
}

/**
 * Create unauthenticated test request
 */
export function createUnauthenticatedRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(url, options);
}

/**
 * Quick test user factories
 */
export const TestUserFactory = {
  async createStandardUser(): Promise<TestAuthContext> {
    return await TestAuthManager.getStandardTestUser();
  },
  
  async createAdminUser(): Promise<TestAuthContext> {
    return await TestAuthManager.createAdminTestUser();
  },
  
  async createOnboardingUser(step: 'personal_info' | 'signature' | 'legal_consent' | 'verification'): Promise<TestAuthContext> {
    return await TestAuthManager.createOnboardingTestUser(step);
  },
  
  async createUserWithAssets(): Promise<{ auth: TestAuthContext; assetIds: string[] }> {
    const auth = await TestAuthManager.createAuthenticatedTestUser();
    
    // Create test assets
    const asset1 = await TestDatabaseUtils.createTestAsset(auth.user.id, {
      name: 'Test Property',
      asset_type: 'property',
      value: 500000,
    });
    
    const asset2 = await TestDatabaseUtils.createTestAsset(auth.user.id, {
      name: 'Test Investment',
      asset_type: 'financial',
      value: 100000,
    });
    
    return {
      auth,
      assetIds: [asset1.id, asset2.id],
    };
  },
  
  async createUserWithBeneficiaries(): Promise<{ auth: TestAuthContext; beneficiaryIds: string[] }> {
    const auth = await TestAuthManager.createAuthenticatedTestUser();
    
    // Create test beneficiaries
    const beneficiary1 = await TestDatabaseUtils.createTestBeneficiary(auth.user.id, {
      name: 'Test Child',
      relationship_type: 'Child',
    });
    
    const beneficiary2 = await TestDatabaseUtils.createTestBeneficiary(auth.user.id, {
      name: 'Test Spouse',
      relationship_type: 'Spouse',
    });
    
    return {
      auth,
      beneficiaryIds: [beneficiary1.id, beneficiary2.id],
    };
  },
  
  async createUserWithWill(): Promise<{ auth: TestAuthContext; willId: string }> {
    const { vi } = await import('vitest');
    const auth = await TestAuthManager.createAuthenticatedTestUser();
    
    // Set up session mock for this user
    const getSessionMock = TestAuthManager.mockGetSession(auth);
    const authModule = await import('@/app/lib/auth');
    vi.mocked(authModule.getSession).mockImplementation(getSessionMock);
    
    // Store context for cleanup
    globalTestContext.authenticatedUser = auth;
    globalTestContext.cleanup.push(async () => {
      await TestAuthManager.cleanupTestUser(auth.user.id);
    });
    
    // Create test will
    const will = await TestDatabaseUtils.createTestWill(auth.user.id, {
      title: 'Test Last Will and Testament',
      status: 'draft',
      will_type: 'simple',
    });
    
    return {
      auth,
      willId: will.id,
    };
  },
};

/**
 * Test assertions helpers
 */
export const TestAssertions = {
  expectAuthenticatedResponse(response: Response) {
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  },
  
  expectUnauthenticatedResponse(response: Response) {
    expect(response.status).toBe(401);
  },
  
  expectSuccessfulResponse(response: Response) {
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
  },
  
  expectValidationError(response: Response) {
    expect(response.status).toBe(400);
  },
  
  expectNotFound(response: Response) {
    expect(response.status).toBe(404);
  },
  
  expectServerError(response: Response) {
    expect(response.status).toBeGreaterThanOrEqual(500);
  },
};