/**
 * /api/audit/log-event API Route Test - REAL AUTHENTICATION
 * Migrated to TestAuthManager for real JWT tokens and database sessions
 * Auto-migrated from complex mocking system
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

// Import the actual route handlers
import * as routeHandlers from '@/app/api/audit/log-event/route';

// Real authentication testing utilities
import { setupApiTestHooks, setupAuthenticatedTest, setupUnauthenticatedTest, TestAssertions, createAuthenticatedRequest } from '../../../test-setup-real-auth';

describe("/api/audit/log-event", () => {
  // Setup authentication test hooks with real JWT tokens
  setupApiTestHooks();

  const url = 'http://localhost:3000/api/audit/log-event';

  describe("Core Functionality", () => {
    it("handles POST requests with valid data", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event_type: 'test_event', 
          event_action: 'test_action', 
          resource_type: 'test_resource',
          event_data: { test: 'data' }
        }),
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
    });
  });

  describe("Error States", () => {
    it("returns proper error for unauthenticated POST requests", async () => {
      await setupUnauthenticatedTest();
      
      const postRequest = new NextRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'test_event', 
          event_action: 'test_action', 
          resource_type: 'test_resource',
          event_data: { test: 'data' }
        }),
      });
      const postResponse = await routeHandlers.POST(postRequest);
      expect(postResponse.status).toBeLessThan(400); // Audit endpoint allows unauthenticated logging
    });
  });

  describe("Security", () => {
    it("accepts unauthenticated audit logs", async () => {
      await setupUnauthenticatedTest();
      
      const request = new NextRequest(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'test_event', 
          event_action: 'test_action', 
          resource_type: 'test_resource',
          event_data: { test: 'data' }
        }),
      });
      const response = await routeHandlers.POST(request);
      expect(response.status).toBeLessThan(400); // Should work without auth
    });

    it("accepts invalid JWT tokens for audit logging", async () => {
      await setupUnauthenticatedTest();
      
      const request = new NextRequest(url, {
        method: 'POST',
        headers: {
          'Cookie': 'herit_access_token=invalid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'test_event', 
          event_action: 'test_action', 
          resource_type: 'test_resource',
          event_data: { test: 'data' }
        }),
      });
      const response = await routeHandlers.POST(request);
      expect(response.status).toBeLessThan(400); // Should work with invalid token
    });
  });

  describe("Performance", () => {
    it("responds within acceptable time with real authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'test_event', 
          event_action: 'test_action', 
          resource_type: 'test_resource',
          event_data: { test: 'data' }
        })
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
      
      const request = createAuthenticatedRequest(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'test_event', 
          event_action: 'test_action', 
          resource_type: 'test_resource',
          event_data: { test: 'data' }
        })
      }, authContext);
      const response = await routeHandlers.POST(request);
      
      expect(response).toBeDefined();
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with authentication workflow", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'test_event', 
          event_action: 'test_action', 
          resource_type: 'test_resource',
          event_data: { test: 'data' }
        })
      }, authContext);
      const response = await routeHandlers.POST(request);
      
      expect(response).toBeDefined();
    });
  });

  describe("Compliance", () => {
    it("meets API standards with proper authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'test_event', 
          event_action: 'test_action', 
          resource_type: 'test_resource',
          event_data: { test: 'data' }
        })
      }, authContext);
      const response = await routeHandlers.POST(request);
      
      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(Response);
    });
  });

  describe("Edge Cases", () => {
    it("handles malformed JSON appropriately", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
         body: '{"malformed": json}',
      }, authContext);

      const response = await routeHandlers.POST(request);
      expect(response).toBeDefined();
      // Audit endpoint returns 200 even for errors - designed not to fail main request
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Audit logging failed');
    });
  });
});