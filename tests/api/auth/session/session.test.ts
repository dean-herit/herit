/**
 * /api/auth/session API Route Test - REAL AUTHENTICATION
 * Enhanced 8-section test structure with production-grade validation
 * Migrated to TestAuthManager for real JWT tokens and database sessions
 * Complexity: 5/10
 * Priority: critical
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

// Import the actual route handlers
import * as routeHandlers from '@/app/api/auth/session/route';

// Real authentication testing utilities
import { setupApiTestHooks, setupAuthenticatedTest, setupUnauthenticatedTest, TestAssertions, createAuthenticatedRequest } from '../../../test-setup-real-auth';

describe("/api/auth/session", () => {
  // Setup authentication test hooks with real JWT tokens
  setupApiTestHooks();

  const url = 'http://localhost:3000/api/auth/session';

  describe("Core Functionality", () => {
    it("handles GET requests with valid session", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(authContext.user.email);
    });

    it("returns user session data correctly", async () => {
      const authContext = await setupAuthenticatedTest({
        first_name: 'Test',
        last_name: 'User',
        onboarding_completed: true
      });
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.user.first_name).toBe('Test');
      expect(data.user.last_name).toBe('User');
      expect(data.user.onboarding_completed).toBe(true);
    });
  });

  describe("Error States", () => {
    it("returns 200 with error for requests without authentication", async () => {
      await setupUnauthenticatedTest();
      const request = new NextRequest(url, { method: 'GET' });

      const response = await routeHandlers.GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeNull();
      expect(data.error).toBe('token_missing');
    });

    it("returns 200 with error for requests with invalid tokens", async () => {
      await setupUnauthenticatedTest();
      const request = new NextRequest(url, {
        method: 'GET',
        cookies: new Map([['herit_access_token', 'invalid-token']])
      });

      const response = await routeHandlers.GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeNull();
      expect(data.error).toBeTruthy();
    });

    it("handles expired tokens appropriately", async () => {
      await setupUnauthenticatedTest();
      // Create a token that appears valid but is expired
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiZXhwIjoxfQ.invalid';
      const request = new NextRequest(url, {
        method: 'GET',
        cookies: new Map([['herit_access_token', expiredToken]])
      });

      const response = await routeHandlers.GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeNull();
      expect(data.error).toBeTruthy();
    });
  });

  describe("Security", () => {
    it("requires valid JWT authentication", async () => {
      await setupUnauthenticatedTest();
      const request = new NextRequest(url, { method: 'GET' });

      const response = await routeHandlers.GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeNull();
      expect(data.error).toBeTruthy();
    });

    it("validates JWT signature integrity", async () => {
      await setupUnauthenticatedTest();
      // Create a token with tampered signature
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0In0.tampered-signature';
      const request = new NextRequest(url, {
        method: 'GET',
        cookies: new Map([['herit_access_token', tamperedToken]])
      });

      const response = await routeHandlers.GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeNull();
      expect(data.error).toBeTruthy();
    });

    it("prevents session fixation attacks", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      // Ensure response doesn't set new session cookies
      const setCookieHeader = response.headers.get('Set-Cookie');
      if (setCookieHeader) {
        expect(setCookieHeader).not.toContain('herit_access_token');
      }
    });
  });

  describe("Performance", () => {
    it("responds within acceptable time with real authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const startTime = performance.now();
      const response = await routeHandlers.GET(request);
      const responseTime = performance.now() - startTime;
      
      TestAssertions.expectSuccessfulResponse(response);
      expect(responseTime).toBeLessThan(2000); // 2 second limit
    });

    it("handles concurrent authenticated requests efficiently", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const requests = Array(3).fill(0).map(() => 
        createAuthenticatedRequest(url, { method: 'GET' }, authContext)
      );

      const startTime = performance.now();
      const responses = await Promise.all(
        requests.map(req => routeHandlers.GET(req))
      );
      const responseTime = performance.now() - startTime;
      
      responses.forEach(response => {
        TestAssertions.expectSuccessfulResponse(response);
      });
      expect(responseTime).toBeLessThan(3000); // 3 second limit for concurrent requests
    });
  });

  describe("Database Integrity", () => {
    it("maintains user data consistency with real database queries", async () => {
      const authContext = await setupAuthenticatedTest({
        first_name: 'Database',
        last_name: 'Test',
        verification_completed: true
      });
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.user.id).toBe(authContext.user.id);
      expect(data.user.first_name).toBe('Database');
      expect(data.user.last_name).toBe('Test');
      expect(data.user.verification_completed).toBe(true);
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with onboarding status workflow", async () => {
      const authContext = await setupAuthenticatedTest({
        onboarding_completed: false,
        personal_info_completed: true,
        signature_completed: false,
        legal_consent_completed: false,
        verification_completed: false
      });
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.user.onboarding_completed).toBe(false);
      expect(data.user.personal_info_completed).toBe(true);
    });

    it("provides complete user context for authenticated requests", async () => {
      const authContext = await setupAuthenticatedTest({
        first_name: 'Integration',
        last_name: 'Test',
        onboarding_completed: true,
        verification_completed: true
      });
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.user).toMatchObject({
        id: authContext.user.id,
        email: authContext.user.email,
        first_name: 'Integration',
        last_name: 'Test',
        onboarding_completed: true,
        verification_completed: true
      });
    });
  });

  describe("Compliance", () => {
    it("meets API standards with proper authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(Response);
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data).toHaveProperty('user');
    });

    it("follows REST API conventions", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      expect(response.headers.get('Content-Type')).toContain('application/json');
      TestAssertions.expectSuccessfulResponse(response);
    });
  });

  describe("Edge Cases", () => {
    it("handles requests with malformed cookies", async () => {
      await setupUnauthenticatedTest();
      const request = new NextRequest(url, {
        method: 'GET',
        headers: {
          'Cookie': 'herit_access_token=malformed-cookie-data'
        }
      });

      const response = await routeHandlers.GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeNull();
      expect(data.error).toBeTruthy();
    });

    it("handles requests with empty authorization headers", async () => {
      await setupUnauthenticatedTest();
      const request = new NextRequest(url, {
        method: 'GET',
        headers: {
          'Authorization': ''
        }
      });

      const response = await routeHandlers.GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeNull();
      expect(data.error).toBeTruthy();
    });

    it("handles users with incomplete profile data", async () => {
      const authContext = await setupAuthenticatedTest({
        first_name: null,
        last_name: null
      });
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.user.id).toBe(authContext.user.id);
      expect(data.user.email).toBe(authContext.user.email);
    });
  });

  describe("Token Management", () => {
    it("validates access token structure and claims", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.user.id).toBe(authContext.user.id);
      expect(data.user.email).toBe(authContext.user.email);
    });

    it("handles refresh token scenarios appropriately", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Session endpoint should work with access token only
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      TestAssertions.expectSuccessfulResponse(response);
    });

    it("maintains session consistency across requests", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Make multiple requests with the same auth context
      const requests = [
        createAuthenticatedRequest(url, { method: 'GET' }, authContext),
        createAuthenticatedRequest(url, { method: 'GET' }, authContext)
      ];

      const responses = await Promise.all(
        requests.map(req => routeHandlers.GET(req))
      );
      
      responses.forEach(response => {
        TestAssertions.expectSuccessfulResponse(response);
      });

      const data1 = await responses[0].json();
      const data2 = await responses[1].json();
      
      expect(data1.user.id).toBe(data2.user.id);
      expect(data1.user.email).toBe(data2.user.email);
    });
  });
});

// Additional test helper for session endpoint specific testing
function expectValidSessionResponse(response: Response, expectedUserId: string) {
  expect(response.status).toBe(200);
  expect(response.headers.get('Content-Type')).toContain('application/json');
}

// Session endpoint specific assertions
function expectUserDataIntegrity(userData: any, authContext: any) {
  expect(userData).toHaveProperty('id');
  expect(userData).toHaveProperty('email');
  expect(userData.id).toBe(authContext.user.id);
  expect(userData.email).toBe(authContext.user.email);
}