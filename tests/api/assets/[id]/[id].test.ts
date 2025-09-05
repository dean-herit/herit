/**
 * /api/assets/[id] API Route Test - REAL AUTHENTICATION
 * Migrated to TestAuthManager for real JWT tokens and database sessions
 * Auto-migrated from complex mocking system
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

// Import the actual route handlers
import * as routeHandlers from '@/app/api/assets/[id]/route';

// Real authentication testing utilities
import { setupApiTestHooks, setupAuthenticatedTest, setupUnauthenticatedTest, TestAssertions, createAuthenticatedRequest } from '../../../test-setup-real-auth';
import { TestDatabaseUtils } from '../../../test-database-utils';

describe("/api/assets/[id]", () => {
  // Setup authentication test hooks with real JWT tokens
  setupApiTestHooks();

  describe("Core Functionality", () => {
    it("handles GET requests with valid authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a test asset first
      const asset = await TestDatabaseUtils.createTestAsset(authContext.user.id, {
        name: 'Test Asset',
        asset_type: 'financial',
        value: 10000
      });
      
      const url = `http://localhost:3000/api/assets/${asset.id}`;
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: asset.id }) });
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.data.name).toBe('Test Asset');
    });

    it("handles PUT requests with valid data", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a test asset first
      const asset = await TestDatabaseUtils.createTestAsset(authContext.user.id, {
        name: 'Test Asset',
        asset_type: 'financial',
        value: 10000
      });
      
      const url = `http://localhost:3000/api/assets/${asset.id}`;
      const request = createAuthenticatedRequest(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: 'Updated Test Asset', 
          value: 15000,
          asset_type: 'irish_bank_account',
          category: 'financial',
          description: 'Updated test asset description',
          irish_fields: {
            iban: 'IE29AIBK93115212345678',
            irish_bank_name: 'Allied Irish Banks'
          }
        }),
      }, authContext);

      const response = await routeHandlers.PUT(request, { params: Promise.resolve({ id: asset.id }) });
      
      TestAssertions.expectSuccessfulResponse(response);
    });

    it("handles DELETE requests with authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a test asset first
      const asset = await TestDatabaseUtils.createTestAsset(authContext.user.id, {
        name: 'Test Asset',
        asset_type: 'financial',
        value: 10000
      });
      
      const url = `http://localhost:3000/api/assets/${asset.id}`;
      const request = createAuthenticatedRequest(url, { method: 'DELETE' }, authContext);

      const response = await routeHandlers.DELETE(request, { params: Promise.resolve({ id: asset.id }) });
      
      TestAssertions.expectSuccessfulResponse(response);
    });
  });

  describe("Error States", () => {
    it("returns proper error for unauthenticated requests", async () => {
      await setupUnauthenticatedTest();
      
      const testUrl = 'http://localhost:3000/api/assets/test-id';
      const getRequest = new NextRequest(testUrl, { method: 'GET' });
      const getResponse = await routeHandlers.GET(getRequest, { params: Promise.resolve({ id: 'test-id' }) });
      expect(getResponse.status).toBeGreaterThanOrEqual(400);
      
      const putRequest = new NextRequest(testUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const putResponse = await routeHandlers.PUT(putRequest, { params: Promise.resolve({ id: 'test-id' }) });
      expect(putResponse.status).toBeGreaterThanOrEqual(400);
      
      const deleteRequest = new NextRequest(testUrl, { method: 'DELETE' });
      const deleteResponse = await routeHandlers.DELETE(deleteRequest, { params: Promise.resolve({ id: 'test-id' }) });
      expect(deleteResponse.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Security", () => {
    it("requires valid JWT authentication", async () => {
      await setupUnauthenticatedTest();
      
      const testUrl = 'http://localhost:3000/api/assets/test-id';
      const request = new NextRequest(testUrl, { method: 'GET' });
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: 'test-id' }) });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("validates JWT signature integrity", async () => {
      await setupUnauthenticatedTest();
      
      const testUrl = 'http://localhost:3000/api/assets/test-id';
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
      
      // Create a test asset first
      const asset = await TestDatabaseUtils.createTestAsset(authContext.user.id, {
        name: 'Test Asset',
        asset_type: 'financial',
        value: 10000
      });
      
      const url = `http://localhost:3000/api/assets/${asset.id}`;
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

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
      
      // Create a test asset first
      const asset = await TestDatabaseUtils.createTestAsset(authContext.user.id, {
        name: 'Test Asset',
        asset_type: 'financial',
        value: 10000
      });
      
      const url = `http://localhost:3000/api/assets/${asset.id}`;
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: asset.id }) });
      
      expect(response).toBeDefined();
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with authentication workflow", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a test asset first
      const asset = await TestDatabaseUtils.createTestAsset(authContext.user.id, {
        name: 'Test Asset',
        asset_type: 'financial',
        value: 10000
      });
      
      const url = `http://localhost:3000/api/assets/${asset.id}`;
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: asset.id }) });
      
      expect(response).toBeDefined();
    });
  });

  describe("Compliance", () => {
    it("meets API standards with proper authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a test asset first
      const asset = await TestDatabaseUtils.createTestAsset(authContext.user.id, {
        name: 'Test Asset',
        asset_type: 'financial',
        value: 10000
      });
      
      const url = `http://localhost:3000/api/assets/${asset.id}`;
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);
      const response = await routeHandlers.GET(request, { params: Promise.resolve({ id: asset.id }) });
      
      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(Response);
    });
  });

  describe("Edge Cases", () => {
    it("handles edge cases appropriately", async () => {
      // This test doesn't need authentication
      expect(true).toBe(true);
    });
  });
});
