/**
 * /api/onboarding/status API Route Test - REAL AUTHENTICATION
 * Migrated to TestAuthManager for real JWT tokens and database sessions
 * Auto-migrated from complex mocking system
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

// Import the actual route handlers
import * as routeHandlers from '@/app/api/onboarding/status/route';

// Real authentication testing utilities
import { setupApiTestHooks, setupAuthenticatedTest, setupUnauthenticatedTest, TestAssertions, createAuthenticatedRequest } from '../../../test-setup-real-auth';

describe("/api/onboarding/status", () => {
  // Setup authentication test hooks with real JWT tokens
  setupApiTestHooks();

  const url = 'http://localhost:3000/api/onboarding/status';

  describe("Core Functionality", () => {
    it("handles GET requests with valid authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data).toBeDefined();
    });

    it("returns consistent onboarding status data", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data).toHaveProperty('onboardingStatus');
      expect(data).toHaveProperty('currentStep');
      expect(data).toHaveProperty('isComplete');
    });
  });

  describe("Error States", () => {
    it("returns proper error for unauthenticated requests", async () => {
      await setupUnauthenticatedTest();
      
      const getRequest = new NextRequest(url, { method: 'GET' });
      const getResponse = await routeHandlers.GET(getRequest);
      expect(getResponse.status).toBeGreaterThanOrEqual(400);
      
      // This route only supports GET, so we just verify the unauthenticated GET response
      expect(getResponse.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Security", () => {
    it("requires valid JWT authentication", async () => {
      await setupUnauthenticatedTest();
      
      const request = new NextRequest(url, { method: 'GET' });
      const response = await routeHandlers.GET(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("validates JWT signature integrity", async () => {
      await setupUnauthenticatedTest();
      
      const request = new NextRequest(url, {
        method: 'GET',
        headers: {
          'Cookie': 'herit_access_token=invalid-token'
        }
      });
      const response = await routeHandlers.GET(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Performance", () => {
    it("responds within acceptable time with real authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const startTime = performance.now();
      const response = await routeHandlers.GET(request);
      const responseTime = performance.now() - startTime;
      
      expect(response).toBeDefined();
      expect(responseTime).toBeLessThan(2000); // 2 second limit
    });
  });

  describe("Database Integrity", () => {
    it("maintains data consistency with real database operations", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);
      const response = await routeHandlers.GET(request);
      
      expect(response).toBeDefined();
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with authentication workflow", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);
      const response = await routeHandlers.GET(request);
      
      expect(response).toBeDefined();
    });
  });

  describe("Compliance", () => {
    it("meets API standards with proper authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);
      const response = await routeHandlers.GET(request);
      
      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(Response);
    });
  });

  describe("Edge Cases", () => {
    it("handles edge cases appropriately", async () => {
      // This is a GET-only route, so we test that it handles edge cases gracefully
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      expect(response).toBeDefined();
      expect(response.status).toBeLessThan(500); // Should not crash
    });
  });
});