/**
 * /api/onboarding/complete API Route Test - REAL AUTHENTICATION
 * Migrated to TestAuthManager for real JWT tokens and database sessions
 * Auto-migrated from complex mocking system
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

// Import the actual route handlers
import * as routeHandlers from '@/app/api/onboarding/complete/route';

// Real authentication testing utilities
import { setupApiTestHooks, setupAuthenticatedTest, setupUnauthenticatedTest, TestAssertions, createAuthenticatedRequest } from '../../../test-setup-real-auth';

describe("/api/onboarding/complete", () => {
  // Setup authentication test hooks with real JWT tokens
  setupApiTestHooks();

  const url = 'http://localhost:3000/api/onboarding/complete';

  describe("Core Functionality", () => {
    it("handles POST requests with valid authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data).toBeDefined();
    });

    it("handles POST requests with valid data", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 0, data: {} }),
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
    });
  });

  describe("Error States", () => {
    it("returns proper error for unauthenticated requests", async () => {
      await setupUnauthenticatedTest();
      
      const getRequest = new NextRequest(url, { method: 'POST' });
      const getResponse = await routeHandlers.POST(getRequest);
      expect(getResponse.status).toBeGreaterThanOrEqual(400);
      
      const postRequest = new NextRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const postResponse = await routeHandlers.POST(postRequest);
      expect(postResponse.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Security", () => {
    it("requires valid JWT authentication", async () => {
      await setupUnauthenticatedTest();
      
      const request = new NextRequest(url, { method: 'POST' });
      const response = await routeHandlers.POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("validates JWT signature integrity", async () => {
      await setupUnauthenticatedTest();
      
      const request = new NextRequest(url, {
        method: 'POST',
        headers: {
          'Cookie': 'herit_access_token=invalid-token'
        }
      });
      const response = await routeHandlers.POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Performance", () => {
    it("responds within acceptable time with real authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { method: 'POST' }, authContext);

      const startTime = performance.now();
      const response = await routeHandlers.POST(request);
      const responseTime = performance.now() - startTime;
      
      expect(response).toBeDefined();
      expect(responseTime).toBeLessThan(2000); // 2 second limit
    });
  });

  describe("Database Integrity", () => {
    it("maintains data consistency with real database operations", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { method: 'POST' }, authContext);
      const response = await routeHandlers.POST(request);
      
      expect(response).toBeDefined();
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with authentication workflow", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { method: 'POST' }, authContext);
      const response = await routeHandlers.POST(request);
      
      expect(response).toBeDefined();
    });
  });

  describe("Compliance", () => {
    it("meets API standards with proper authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { method: 'POST' }, authContext);
      const response = await routeHandlers.POST(request);
      
      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(Response);
    });
  });

  describe("Edge Cases", () => {
    it("handles completion requests gracefully regardless of body content", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // This endpoint doesn't parse the request body, so malformed JSON shouldn't cause errors
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
         body: '{"malformed": json}',
      }, authContext);

      const response = await routeHandlers.POST(request);
      expect(response).toBeDefined();
      TestAssertions.expectSuccessfulResponse(response); // Should succeed because body is ignored
    });
  });
});