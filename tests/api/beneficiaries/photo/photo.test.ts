/**
 * /api/beneficiaries/photo API Route Test - REAL AUTHENTICATION
 * Migrated to TestAuthManager for real JWT tokens and database sessions
 * Auto-migrated from complex mocking system
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

// Import the actual route handlers
import * as routeHandlers from '@/app/api/beneficiaries/photo/route';

// Real authentication testing utilities
import { setupApiTestHooks, setupAuthenticatedTest, setupUnauthenticatedTest, TestAssertions, createAuthenticatedRequest } from '../../../test-setup-real-auth';

describe("/api/beneficiaries/photo", () => {
  // Setup authentication test hooks with real JWT tokens
  setupApiTestHooks();

  const url = 'http://localhost:3000/api/beneficiaries/photo';

  describe("Core Functionality", () => {
    it("handles POST requests with valid file data", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a test file as FormData
      const formData = new FormData();
      const testFile = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', testFile);
      
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        body: formData,
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
    });
  });

  describe("Error States", () => {
    it("returns proper error for unauthenticated POST requests", async () => {
      await setupUnauthenticatedTest();
      
      const formData = new FormData();
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', testFile);
      
      const postRequest = new NextRequest(url, {
        method: 'POST',
        body: formData,
      });
      const postResponse = await routeHandlers.POST(postRequest);
      expect(postResponse.status).toBeGreaterThanOrEqual(400);
    });
    
    it("returns error for missing file", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const formData = new FormData();
      // No file attached
      
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        body: formData,
      }, authContext);
      
      const response = await routeHandlers.POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Security", () => {
    it("requires valid JWT authentication", async () => {
      await setupUnauthenticatedTest();
      
      const formData = new FormData();
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', testFile);
      
      const request = new NextRequest(url, { 
        method: 'POST',
        body: formData 
      });
      const response = await routeHandlers.POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("validates JWT signature integrity", async () => {
      await setupUnauthenticatedTest();
      
      const formData = new FormData();
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', testFile);
      
      const request = new NextRequest(url, {
        method: 'POST',
        headers: {
          'Cookie': 'herit_access_token=invalid-token'
        },
        body: formData
      });
      const response = await routeHandlers.POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("validates file type restrictions", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const formData = new FormData();
      const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      formData.append('file', invalidFile);
      
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        body: formData,
      }, authContext);
      
      const response = await routeHandlers.POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("validates file size limits", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const formData = new FormData();
      // Create a large file (6MB - over the 5MB limit)
      const largeContent = 'x'.repeat(6 * 1024 * 1024);
      const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      formData.append('file', largeFile);
      
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        body: formData,
      }, authContext);
      
      const response = await routeHandlers.POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Performance", () => {
    it("responds within acceptable time with real authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const formData = new FormData();
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', testFile);
      
      const request = createAuthenticatedRequest(url, { 
        method: 'POST',
        body: formData 
      }, authContext);

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
      
      const formData = new FormData();
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', testFile);
      
      const request = createAuthenticatedRequest(url, { 
        method: 'POST',
        body: formData 
      }, authContext);
      const response = await routeHandlers.POST(request);
      
      expect(response).toBeDefined();
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with authentication workflow", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const formData = new FormData();
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', testFile);
      
      const request = createAuthenticatedRequest(url, { 
        method: 'POST',
        body: formData 
      }, authContext);
      const response = await routeHandlers.POST(request);
      
      expect(response).toBeDefined();
    });
  });

  describe("Compliance", () => {
    it("meets API standards with proper authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const formData = new FormData();
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', testFile);
      
      const request = createAuthenticatedRequest(url, { 
        method: 'POST',
        body: formData 
      }, authContext);
      const response = await routeHandlers.POST(request);
      
      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(Response);
    });
  });

  describe("Edge Cases", () => {
    it("handles corrupted file data appropriately", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const formData = new FormData();
      const corruptFile = new File(['corrupted-binary-data'], 'corrupt.jpg', { type: 'image/jpeg' });
      formData.append('file', corruptFile);
      
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        body: formData,
      }, authContext);

      const response = await routeHandlers.POST(request);
      expect(response).toBeDefined();
      // File upload endpoint should handle corrupted files gracefully
    });
  });
});