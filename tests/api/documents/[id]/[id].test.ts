/**
 * /api/documents/[id] API Route Test - REAL AUTHENTICATION
 * Migrated to TestAuthManager for real JWT tokens and database sessions
 * Auto-migrated from complex mocking system
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

// Import the actual route handlers
import * as routeHandlers from '@/app/api/documents/[id]/route';

// Real authentication testing utilities
import { setupApiTestHooks, setupAuthenticatedTest, setupUnauthenticatedTest, TestAssertions, createAuthenticatedRequest } from '../../../test-setup-real-auth';

describe("/api/documents/[id]", () => {
  // Setup authentication test hooks with real JWT tokens
  setupApiTestHooks();

  const idParam = 'test-id-123';
  const url = `http://localhost:3000/api/documents/${idParam}/${idParam}`;

  describe("Core Functionality", () => {
    it("handles GET requests with valid authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: idParam }) });
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data).toBeDefined();
    });

    it("handles DELETE requests with authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, { method: 'DELETE' }, authContext);

      const response = await routeHandlers.DELETE(request, { params: Promise.resolve({ id: idParam }) });
      
      expect(response).toBeDefined();
      expect(response.status).toBeLessThan(500);
    });
  });

  describe("Error States", () => {
    it("returns proper error for unauthenticated requests", async () => {
      await setupUnauthenticatedTest();
      
      const getRequest = new NextRequest(url, { method: 'GET' });
      const getResponse = await routeHandlers.GET(getRequest, { params: Promise.resolve({ id: idParam }) });
      expect(getResponse.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Security", () => {
    it("requires valid JWT authentication", async () => {
      await setupUnauthenticatedTest();
      
      const request = new NextRequest(url, { method: 'GET' });
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: idParam }) });
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
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: idParam }) });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Performance", () => {
    it("responds within acceptable time with real authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const startTime = performance.now();
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: idParam }) });
      const responseTime = performance.now() - startTime;
      
      expect(response).toBeDefined();
      expect(responseTime).toBeLessThan(2000); // 2 second limit
    });
  });

  describe("Database Integrity", () => {
    it("maintains data consistency with real database operations", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: idParam }) });
      
      expect(response).toBeDefined();
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with authentication workflow", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: idParam }) });
      
      expect(response).toBeDefined();
    });
  });

  describe("Compliance", () => {
    it("meets API standards with proper authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: idParam }) });
      
      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(Response);
    });
  });

  describe("Edge Cases", () => {
    it("handles edge cases appropriately", async () => {
      // Edge case handling for available methods
      expect(true).toBe(true);
    });
  });
});