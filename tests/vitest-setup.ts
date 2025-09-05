/**
 * Vitest Global Setup for API Route Testing
 * Provides standardized mocking environment for all backend tests
 */

import { vi, beforeEach, afterEach } from 'vitest';
import { BackendTestUtils } from './backend-test-utils';

// =============================================================================
// GLOBAL MOCK SETUP
// =============================================================================

// Mock Next.js modules that don't work in test environment
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockReturnValue({ value: 'mock-token' }),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// PROPER AUTH MOCK - Matches real auth.ts structure exactly
vi.mock('@/app/lib/auth', async () => {
  const actual = await vi.importActual('@/app/lib/auth');
  
  // Create mock user that matches the real User type from schema
  const createRealMockUser = (overrides: any = {}) => ({
    id: overrides.id || 'user-123',
    email: overrides.email || 'test@example.com',
    first_name: overrides.first_name || 'Test',
    last_name: overrides.last_name || 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: overrides.emailVerified || new Date(),
    image: overrides.image || null,
    onboarding_completed: overrides.onboarding_completed ?? true,
    personal_info_completed: overrides.personal_info_completed ?? true,
    signature_completed: overrides.signature_completed ?? true,
    legal_consent_completed: overrides.legal_consent_completed ?? true,
    verification_completed: overrides.verification_completed ?? true,
    verification_status: overrides.verification_status || 'verified',
  });

  // Create session that matches exact SessionResult type from auth.ts
  const createRealSession = (overrides: any = {}): any => {
    if (overrides.isAuthenticated === false) {
      // NoSession type - exactly matches auth.ts
      return {
        user: null,
        isAuthenticated: false,
        error: overrides.error || 'token_missing'
      };
    }
    
    // Session type - exactly matches auth.ts  
    return {
      user: createRealMockUser(overrides.user),
      isAuthenticated: true
    };
  };

  // Different session contexts for different test scenarios
  const sessionContexts = {
    authenticated: createRealSession({ isAuthenticated: true }),
    unauthenticated: createRealSession({ 
      isAuthenticated: false, 
      error: 'token_missing' 
    }),
    expired: createRealSession({ 
      isAuthenticated: false, 
      error: 'token_expired' 
    }),
    invalid: createRealSession({ 
      isAuthenticated: false, 
      error: 'token_invalid' 
    }),
  };

  // Smart session mock that returns proper structure
  const getSession = vi.fn().mockResolvedValue(sessionContexts.authenticated);
  const requireAuth = vi.fn().mockResolvedValue(sessionContexts.authenticated);

  // Context switcher for tests
  (globalThis as any).setAuthContext = (contextName: keyof typeof sessionContexts) => {
    const context = sessionContexts[contextName];
    getSession.mockResolvedValue(context);
    requireAuth.mockResolvedValue(context);
    return context;
  };

  // Smart session mock that returns proper structure
  const smartGetSession = vi.fn().mockResolvedValue({
    user: createRealMockUser(),
    isAuthenticated: true
  });
  
  const smartRequireAuth = vi.fn().mockResolvedValue({
    user: createRealMockUser(),
    isAuthenticated: true
  });

  // Context switcher for tests
  (globalThis as any).setAuthContext = (contextName: keyof typeof sessionContexts) => {
    const context = sessionContexts[contextName];
    smartGetSession.mockResolvedValue(context);
    smartRequireAuth.mockResolvedValue(context);
    return context;
  };

  return {
    ...actual,
    getSession: getSession,  // Use controllable getSession instead of smartGetSession
    requireAuth: requireAuth,  // Use controllable requireAuth instead of smartRequireAuth
    hashPassword: vi.fn().mockResolvedValue('hashed-password'),
    setAuthCookies: vi.fn().mockResolvedValue(undefined),
    clearAuthCookies: vi.fn().mockResolvedValue(undefined),
    verifyPassword: vi.fn().mockResolvedValue(true),
  };
});

// Mock the environment module
vi.mock('@/app/lib/env', () => ({
  env: {
    NODE_ENV: 'test',
    SESSION_SECRET: 'test-session-secret-32-chars-long',
    REFRESH_SECRET: 'test-refresh-secret-32-chars-long',
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    GITHUB_CLIENT_ID: 'test-github-client-id',
    GITHUB_CLIENT_SECRET: 'test-github-client-secret',
    POSTGRES_URL: process.env.POSTGRES_URL!, // Use real database URL from environment
    BLOB_READ_WRITE_TOKEN: 'test-blob-token',
    STRIPE_SECRET_KEY: 'sk_test_mock',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_mock',
  },
}));

// Mock the logger
vi.mock('@/app/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Database now uses real connection - no mocking needed

// Mock external services
vi.mock('stripe', () => ({
  default: class MockStripe {
    constructor() {}
    paymentIntents = {
      create: vi.fn().mockResolvedValue({ id: 'pi_test123', status: 'succeeded' }),
      retrieve: vi.fn().mockResolvedValue({ id: 'pi_test123', status: 'succeeded' }),
    };
    identity = {
      verificationSessions: {
        create: vi.fn().mockResolvedValue({ 
          id: 'vs_test123', 
          status: 'requires_input',
          url: 'https://verify.stripe.com/start/test123'
        }),
        retrieve: vi.fn().mockResolvedValue({ 
          id: 'vs_test123', 
          status: 'verified' 
        }),
      },
    };
  },
}));

// Mock Vercel Blob
vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({
    url: 'https://blob.vercel-storage.com/test-file.pdf',
    pathname: 'test-file.pdf',
    contentType: 'application/pdf',
    contentDisposition: 'inline; filename="test-file.pdf"',
  }),
  del: vi.fn().mockResolvedValue(undefined),
  list: vi.fn().mockResolvedValue({
    blobs: [],
    hasMore: false,
  }),
}));

// Mock Nodemailer
vi.mock('nodemailer', () => ({
  createTransporter: vi.fn().mockReturnValue({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// =============================================================================
// GLOBAL TEST HOOKS
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  BackendTestUtils.setupTestEnvironment();
});

afterEach(() => {
  vi.resetAllMocks();
  BackendTestUtils.restoreConsole();
});

// =============================================================================
// TEST ENVIRONMENT VALIDATION
// =============================================================================

// Ensure test environment is properly configured
if (process.env.NODE_ENV !== 'test') {
  console.warn('Warning: NODE_ENV is not set to "test". This may affect test behavior.');
}