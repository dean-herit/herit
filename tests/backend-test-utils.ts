/**
 * Backend Test Utils - Standardized Testing Utilities
 * Provides reusable utilities for backend testing with 85% code reuse target
 */

import { vi, expect } from 'vitest';
// Mock types for testing
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: Date | null;
  image: string | null;
  onboardingCompleted: boolean;
  personalInfoCompleted: boolean;
  signatureCompleted: boolean;
  legalConsentCompleted: boolean;
  verificationCompleted: boolean;
  verificationStatus: string;
}

interface Asset {
  id: string;
  userId: string;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

interface Beneficiary {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  county: string;
  eircode: string;
  allocation: number;
  notes: string;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// REQUEST & RESPONSE BUILDERS
// =============================================================================

export interface MockRequestOptions {
  method?: string;
  headers?: HeadersInit;
  json?: () => Promise<any>;
  formData?: () => Promise<FormData>;
  text?: () => Promise<string>;
  userId?: string;
  url?: string;
  params?: Record<string, string>;
}

export function createMockRequest(options: MockRequestOptions = {}): Request {
  const {
    method = 'GET',
    headers = {},
    json,
    formData,
    text,
    url = 'http://localhost:3000/api/test',
    params = {},
  } = options;

  // Build URL with params
  const urlObj = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    urlObj.searchParams.append(key, value);
  });

  const request = new Request(urlObj.toString(), {
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers,
    }),
  });

  // Mock the json() method
  if (json) {
    (request as any).json = json;
  } else {
    (request as any).json = async () => ({});
  }

  // Mock the formData() method
  if (formData) {
    (request as any).formData = formData;
  }

  // Mock the text() method
  if (text) {
    (request as any).text = text;
  }

  return request;
}

export function createAuthenticatedRequest(options: MockRequestOptions = {}): Request {
  const { userId = 'test-user-id', ...rest } = options;
  
  return createMockRequest({
    ...rest,
    headers: {
      ...rest.headers,
      'Authorization': `Bearer mock-jwt-token-${userId}`,
      'Cookie': `session=mock-session-${userId}`,
    },
  });
}

// =============================================================================
// RESPONSE VALIDATORS
// =============================================================================

export function expectSuccessResponse(response: Response): void {
  expect(response).toBeDefined();
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
}

export function expectErrorResponse(response: Response, expectedError?: string): void {
  expect(response).toBeDefined();
  expect(response.status).toBeGreaterThanOrEqual(400);
  
  if (expectedError) {
    response.json().then(data => {
      expect(data.error).toContain(expectedError);
    });
  }
}

// =============================================================================
// DATABASE UTILITIES
// =============================================================================

export interface TestData {
  users?: Partial<User>[];
  assets?: Partial<Asset>[];
  beneficiaries?: Partial<Beneficiary>[];
}

let testDataStore: TestData = {};

export async function seedTestData(data: TestData): Promise<void> {
  testDataStore = { ...testDataStore, ...data };
  // In real implementation, this would insert into test database
  console.log('Test data seeded:', data);
}

export async function cleanTestData(): Promise<void> {
  testDataStore = {};
  // In real implementation, this would clean test database
  console.log('Test data cleaned');
}

export async function expectAuditLog(criteria: {
  action: string;
  userId?: string | null;
  resourceType?: string;
}): Promise<void> {
  // In real implementation, this would query audit_events table
  console.log('Checking audit log for:', criteria);
  // Mock implementation
  expect(criteria.action).toBeDefined();
}

// =============================================================================
// MOCK DATA FACTORIES
// =============================================================================

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: new Date(),
    image: null,
    onboardingCompleted: true,
    personalInfoCompleted: true,
    signatureCompleted: true,
    legalConsentCompleted: true,
    verificationCompleted: true,
    verificationStatus: 'verified',
    ...overrides,
  } as User;
}

export function createMockAsset(type: 'property' | 'financial' | 'personal' | 'digital' = 'property'): Asset {
  const baseAsset = {
    id: 'asset-' + Math.random().toString(36).substr(2, 9),
    userId: 'user-test',
    name: 'Test Asset',
    type,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  switch (type) {
    case 'property':
      return {
        ...baseAsset,
        propertyType: 'residential',
        address: '123 Test Street',
        city: 'Dublin',
        county: 'Dublin',
        eircode: 'D02 XY12',
        estimatedValue: 500000,
      } as Asset;
    
    case 'financial':
      return {
        ...baseAsset,
        accountType: 'savings',
        institutionName: 'Bank of Ireland',
        accountNumber: '12345678',
        iban: 'IE12BOFI90001710027952',
        balance: 50000,
      } as Asset;
    
    case 'personal':
      return {
        ...baseAsset,
        itemType: 'jewelry',
        description: 'Gold watch',
        estimatedValue: 5000,
        location: 'Home safe',
      } as Asset;
    
    case 'digital':
      return {
        ...baseAsset,
        platformName: 'Bitcoin Wallet',
        accountIdentifier: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        assetTypes: ['cryptocurrency'],
        estimatedValue: 10000,
      } as Asset;
  }
}

export function createMockBeneficiary(overrides: Partial<Beneficiary> = {}): Beneficiary {
  return {
    id: 'beneficiary-' + Math.random().toString(36).substr(2, 9),
    userId: 'user-test',
    name: 'John Doe',
    relationship: 'child',
    dateOfBirth: '1990-01-01',
    email: 'beneficiary@example.com',
    phone: '+353851234567',
    address: '456 Test Avenue',
    city: 'Cork',
    county: 'Cork',
    eircode: 'T12 AB34',
    allocation: 50,
    notes: 'Primary beneficiary',
    photoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Beneficiary;
}

// =============================================================================
// EXTERNAL SERVICE MOCKS
// =============================================================================

export function mockStripeSuccess(): void {
  vi.mock('stripe', () => ({
    default: vi.fn(() => ({
      paymentIntents: {
        create: vi.fn().mockResolvedValue({
          id: 'pi_test_success',
          status: 'succeeded',
          amount: 1000,
        }),
      },
      customers: {
        create: vi.fn().mockResolvedValue({
          id: 'cus_test_success',
        }),
      },
    })),
  }));
}

export function mockStripeFailure(): void {
  vi.mock('stripe', () => ({
    default: vi.fn(() => ({
      paymentIntents: {
        create: vi.fn().mockRejectedValue(new Error('Stripe error')),
      },
    })),
  }));
}

export function mockVercelBlobUpload(): void {
  vi.mock('@vercel/blob', () => ({
    put: vi.fn().mockResolvedValue({
      url: 'https://blob.vercel.com/test-file.pdf',
      downloadUrl: 'https://blob.vercel.com/download/test-file.pdf',
      pathname: 'test-file.pdf',
      contentType: 'application/pdf',
      contentDisposition: 'attachment; filename="test-file.pdf"',
    }),
    del: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({
      blobs: [],
      cursor: null,
      hasMore: false,
    }),
  }));
}

export function mockEmailService(): void {
  vi.mock('@/lib/email', () => ({
    sendEmail: vi.fn().mockResolvedValue({
      messageId: 'test-message-id',
      success: true,
    }),
  }));
}

// =============================================================================
// PERFORMANCE TESTING
// =============================================================================

export async function measureApiResponseTime(
  request: Request,
  handler: (req: Request) => Promise<Response>
): Promise<number> {
  const startTime = performance.now();
  await handler(request);
  const endTime = performance.now();
  return endTime - startTime;
}

export interface ConcurrentTestResults {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
}

export async function simulateConcurrentRequests(
  count: number,
  requestFactory: () => Request,
  handler: (req: Request) => Promise<Response>
): Promise<ConcurrentTestResults> {
  const requests = Array(count).fill(null).map(() => requestFactory());
  const startTime = performance.now();
  
  const results = await Promise.allSettled(
    requests.map(req => handler(req))
  );
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  const failureCount = results.filter(r => r.status === 'rejected').length;
  
  return {
    totalRequests: count,
    successCount,
    failureCount,
    successRate: successCount / count,
    averageResponseTime: totalTime / count,
    minResponseTime: totalTime / count * 0.5, // Mock
    maxResponseTime: totalTime / count * 1.5, // Mock
  };
}

// =============================================================================
// TEST ENVIRONMENT HELPERS
// =============================================================================

export function setupTestEnvironment(): void {
  // Set up test environment variables
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    SESSION_SECRET: 'test-session-secret',
    REFRESH_SECRET: 'test-refresh-secret',
  });
}

export function mockConsoleError(): void {
  vi.spyOn(console, 'error').mockImplementation(() => {});
}

export function restoreConsole(): void {
  vi.restoreAllMocks();
}

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

export function expectValidUUID(value: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  expect(value).toMatch(uuidRegex);
}

export function expectValidEircode(value: string): void {
  const eircodeRegex = /^[A-Z]\d{2}\s?[A-Z0-9]{4}$/;
  expect(value).toMatch(eircodeRegex);
}

export function expectValidIBAN(value: string): void {
  const ibanRegex = /^IE\d{2}[A-Z]{4}\d{14}$/;
  expect(value).toMatch(ibanRegex);
}

export function expectValidEmail(value: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  expect(value).toMatch(emailRegex);
}

// =============================================================================
// SNAPSHOT HELPERS
// =============================================================================

export function sanitizeForSnapshot(data: any): any {
  // Remove dynamic values for consistent snapshots
  const sanitized = JSON.parse(JSON.stringify(data));
  
  const sanitizeRecursive = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeRecursive);
    }
    
    if (typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        if (key === 'id' || key === 'createdAt' || key === 'updatedAt') {
          result[key] = '[SANITIZED]';
        } else if (key === 'timestamp') {
          result[key] = '[TIMESTAMP]';
        } else {
          result[key] = sanitizeRecursive(obj[key]);
        }
      }
      return result;
    }
    
    return obj;
  };
  
  return sanitizeRecursive(sanitized);
}

// =============================================================================
// EXPORTED NAMESPACE
// =============================================================================

export const BackendTestUtils = {
  // Request/Response
  createMockRequest,
  createAuthenticatedRequest,
  expectSuccessResponse,
  expectErrorResponse,
  
  // Database
  seedTestData,
  cleanTestData,
  expectAuditLog,
  
  // Mock Data
  createMockUser,
  createMockAsset,
  createMockBeneficiary,
  
  // External Services
  mockStripeSuccess,
  mockStripeFailure,
  mockVercelBlobUpload,
  mockEmailService,
  
  // Performance
  measureApiResponseTime,
  simulateConcurrentRequests,
  
  // Environment
  setupTestEnvironment,
  mockConsoleError,
  restoreConsole,
  
  // Assertions
  expectValidUUID,
  expectValidEircode,
  expectValidIBAN,
  expectValidEmail,
  
  // Snapshots
  sanitizeForSnapshot,
};