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

// Mock the auth module with comprehensive authentication context
vi.mock('@/app/lib/auth', async () => {
  const actual = await vi.importActual('@/app/lib/auth');
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: new Date(),
    image: null,
    onboarding_completed: true,
    personal_info_completed: true,
    signature_completed: true,
    legal_consent_completed: true,
    verification_completed: true,
    verification_status: 'verified',
  };
  
  return {
    ...actual,
    getSession: vi.fn().mockResolvedValue({
      user: mockUser,
      isAuthenticated: true,
    }),
    requireAuth: vi.fn().mockResolvedValue({
      user: mockUser,
      isAuthenticated: true,
    }),
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
    POSTGRES_URL: 'postgresql://test:test@localhost:5432/test',
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

// Mock database with comprehensive query interface
vi.mock('@/db/db', () => ({
  db: {
    execute: vi.fn().mockResolvedValue([{ success: true }]),
    query: {
      users: { 
        findFirst: vi.fn().mockResolvedValue(BackendTestUtils.createMockUser()), 
        findMany: vi.fn().mockResolvedValue([BackendTestUtils.createMockUser()]) 
      },
      assets: { 
        findFirst: vi.fn().mockResolvedValue(BackendTestUtils.createMockAsset()), 
        findMany: vi.fn().mockResolvedValue([BackendTestUtils.createMockAsset()]) 
      },
      beneficiaries: { 
        findFirst: vi.fn().mockResolvedValue(BackendTestUtils.createMockBeneficiary()), 
        findMany: vi.fn().mockResolvedValue([BackendTestUtils.createMockBeneficiary()]) 
      },
      documents: { 
        findFirst: vi.fn().mockResolvedValue({ 
          id: 'doc-1', 
          userId: 'user-1', 
          name: 'test-doc.pdf' 
        }), 
        findMany: vi.fn().mockResolvedValue([{ 
          id: 'doc-1', 
          userId: 'user-1', 
          name: 'test-doc.pdf' 
        }]) 
      },
      refreshTokens: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([])
      },
    },
    insert: vi.fn().mockReturnValue({ 
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-id' }])
      })
    }),
    update: vi.fn().mockReturnValue({ 
      where: vi.fn().mockReturnValue({ 
        returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }]) 
      }) 
    }),
    delete: vi.fn().mockReturnValue({ 
      where: vi.fn().mockResolvedValue([{ id: 'deleted-id' }])
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([BackendTestUtils.createMockUser()])
        })
      })
    }),
  },
}));

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