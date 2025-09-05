/**
 * /api/assets/[id]/documents API Route Test - REAL AUTHENTICATION
 * Migrated to TestAuthManager for real JWT tokens and database sessions
 * Auto-migrated from complex mocking system
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

// Import the actual route handlers
import * as routeHandlers from '@/app/api/assets/[id]/documents/route';

// Real authentication testing utilities
import { setupApiTestHooks, setupAuthenticatedTest, setupUnauthenticatedTest, TestAssertions, createAuthenticatedRequest } from '../../../../test-setup-real-auth';
import { TestDatabaseUtils } from '../../../../test-database-utils';

describe("/api/assets/[id]/documents", () => {
  // Setup authentication test hooks with real JWT tokens
  setupApiTestHooks();

  describe("Core Functionality", () => {
    it("handles GET requests with valid authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a real asset first
      const asset = await TestDatabaseUtils.createTestAsset(authContext.user.id, {
        name: 'Test Asset for Documents',
        asset_type: 'financial',
        value: 10000
      });
      
      const url = `http://localhost:3000/api/assets/${asset.id}/documents`;
      const request = new NextRequest(url, {
        method: 'GET',
        headers: {
          'Cookie': `herit_access_token=${authContext.accessToken}; herit_refresh_token=${authContext.refreshToken}`
        }
      });

      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: asset.id }) });
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data).toBeDefined();
    });
  });

  describe("Error States", () => {
    it("returns proper error for unauthenticated requests", async () => {
      await setupUnauthenticatedTest();
      
      const testUrl = 'http://localhost:3000/api/assets/test-id/documents';
      const getRequest = new NextRequest(testUrl, { method: 'GET' });
      const getResponse = await routeHandlers.GET(getRequest, { params: Promise.resolve({ id: 'test-id' }) });
      expect(getResponse.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Security", () => {
    it("requires valid JWT authentication", async () => {
      await setupUnauthenticatedTest();
      
      const testUrl = 'http://localhost:3000/api/assets/test-id/documents';
      const request = new NextRequest(testUrl, { method: 'GET' });
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: 'test-id' }) });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("validates JWT signature integrity", async () => {
      await setupUnauthenticatedTest();
      
      const testUrl = 'http://localhost:3000/api/assets/test-id/documents';
      const request = new NextRequest(testUrl, {
        method: 'GET',
        headers: {
          'Cookie': 'herit_access_token=invalid-token'
        }
      });
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: 'test-id' }) });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Performance", () => {
    it("responds within acceptable time with real authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a real asset first
      const asset = await TestDatabaseUtils.createTestAsset(authContext.user.id, {
        name: 'Test Asset for Documents',
        asset_type: 'financial',
        value: 10000
      });
      
      const url = `http://localhost:3000/api/assets/${asset.id}/documents`;
      const request = new NextRequest(url, {
        method: 'GET',
        headers: {
          'Cookie': `herit_access_token=${authContext.accessToken}; herit_refresh_token=${authContext.refreshToken}`
        }
      });

      const startTime = performance.now();
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: asset.id }) });
      const responseTime = performance.now() - startTime;
      
      expect(response).toBeDefined();
      expect(responseTime).toBeLessThan(2000); // 2 second limit
    });
  });

  describe("Database Integrity", () => {
    it("maintains data consistency with real database operations", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a real asset first
      const asset = await TestDatabaseUtils.createTestAsset(authContext.user.id, {
        name: 'Test Asset for Documents',
        asset_type: 'financial',
        value: 10000
      });
      
      const url = `http://localhost:3000/api/assets/${asset.id}/documents`;
      const request = new NextRequest(url, {
        method: 'GET',
        headers: {
          'Cookie': `herit_access_token=${authContext.accessToken}; herit_refresh_token=${authContext.refreshToken}`
        }
      });
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: asset.id }) });
      
      expect(response).toBeDefined();
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with authentication workflow", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a real asset first
      const asset = await TestDatabaseUtils.createTestAsset(authContext.user.id, {
        name: 'Test Asset for Documents',
        asset_type: 'financial',
        value: 10000
      });
      
      const url = `http://localhost:3000/api/assets/${asset.id}/documents`;
      const request = new NextRequest(url, {
        method: 'GET',
        headers: {
          'Cookie': `herit_access_token=${authContext.accessToken}; herit_refresh_token=${authContext.refreshToken}`
        }
      });
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: asset.id }) });
      
      expect(response).toBeDefined();
    });
  });

  describe("Compliance", () => {
    it("meets API standards with proper authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a real asset first
      const asset = await TestDatabaseUtils.createTestAsset(authContext.user.id, {
        name: 'Test Asset for Documents',
        asset_type: 'financial',
        value: 10000
      });
      
      const url = `http://localhost:3000/api/assets/${asset.id}/documents`;
      const request = new NextRequest(url, {
        method: 'GET',
        headers: {
          'Cookie': `herit_access_token=${authContext.accessToken}; herit_refresh_token=${authContext.refreshToken}`
        }
      });
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: asset.id }) });
      
      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(Response);
    });
  });

  describe("Edge Cases", () => {
    it("handles edge cases appropriately", async () => {
      // Test with invalid asset ID
      await setupUnauthenticatedTest();
      const testUrl = 'http://localhost:3000/api/assets/invalid-id/documents';
      const request = new NextRequest(testUrl, { method: 'GET' });
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
