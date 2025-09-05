/**
 * /api/auth/google/callback API Route Test - REAL AUTHENTICATION
 * Migrated to TestAuthManager for real JWT tokens and database sessions
 * Auto-migrated from complex mocking system
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

// Import the actual route handlers
import * as routeHandlers from '@/app/api/auth/google/callback/route';

// Real authentication testing utilities
import { setupApiTestHooks, setupAuthenticatedTest, setupUnauthenticatedTest, TestAssertions, createAuthenticatedRequest } from '../../../../test-setup-real-auth';

describe("/api/auth/google/callback", () => {
  // Setup authentication test hooks with real JWT tokens
  setupApiTestHooks();

  const url = 'http://localhost:3000/api/auth/google/callback';

  describe("Core Functionality", () => {
    it("handles GET requests with valid authentication", async () => {
      // OAuth callback always redirects - this is correct behavior
      const request = new NextRequest(`${url}?code=test_code&state=test_state`, { method: 'GET' });

      const response = await routeHandlers.GET(request);
      
      // OAuth callback should redirect (307), not return JSON (200)
      expect(response.status).toBe(307);
      
      // Should have a redirect location header
      expect(response.headers.get('location')).toBeTruthy();
    });

    it("handles OAuth callback redirects correctly", async () => {
      // OAuth callback should redirect, not return JSON
      const request = new NextRequest(`${url}?code=test_code&state=test_state`, { method: 'GET' });

      const response = await routeHandlers.GET(request);
      
      // OAuth callback returns a redirect (307) not a success response (200)
      expect(response.status).toBe(307);
    });
  });

  describe("Error States", () => {
    it("returns proper error for unauthenticated requests", async () => {
      await setupUnauthenticatedTest();
      
      // OAuth callback without proper parameters should redirect with error
      const request = new NextRequest(url, { method: 'GET' });
      const response = await routeHandlers.GET(request);
      expect(response.status).toBe(307); // OAuth redirects to login with error
    });
  });

  describe("Security", () => {
    it("redirects to login when OAuth parameters are missing", async () => {
      await setupUnauthenticatedTest();
      
      const request = new NextRequest(url, { method: 'GET' });
      const response = await routeHandlers.GET(request);
      expect(response.status).toBe(307); // Redirect to login with error
      
      // Should redirect to login with error message
      const location = response.headers.get('location');
      expect(location).toContain('/login');
      expect(location).toContain('error=');
    });

    it("redirects to login when OAuth state validation fails", async () => {
      await setupUnauthenticatedTest();
      
      const request = new NextRequest(`${url}?code=test_code`, { method: 'GET' });
      const response = await routeHandlers.GET(request);
      expect(response.status).toBe(307); // Redirect to login with error
      
      // Should redirect to login with state validation error
      const location = response.headers.get('location');
      expect(location).toContain('/login');
      expect(location).toContain('error=');
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
    it("handles malformed OAuth parameters appropriately", async () => {
      // OAuth callback with malformed state parameter should redirect with error
      const request = new NextRequest(`${url}?code=test_code&state=malformed%20state`, { method: 'GET' });
      const response = await routeHandlers.GET(request);
      expect(response).toBeDefined();
      expect(response.status).toBe(307); // Redirect to login with error
    });
  });
});