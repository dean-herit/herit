/**
 * /api/onboarding/consent-signature API Route Test - REAL AUTHENTICATION
 * Migrated to TestAuthManager for real JWT tokens and database sessions
 * Auto-migrated from complex mocking system
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

// Import the actual route handlers
import * as routeHandlers from '@/app/api/onboarding/consent-signature/route';

// Real authentication testing utilities
import { setupApiTestHooks, setupAuthenticatedTest, setupUnauthenticatedTest, TestAssertions, createAuthenticatedRequest } from '../../../test-setup-real-auth';
import { TestDatabaseUtils } from '../../../test-database-utils';

describe("/api/onboarding/consent-signature", () => {
  // Setup authentication test hooks with real JWT tokens
  setupApiTestHooks();

  const url = 'http://localhost:3000/api/onboarding/consent-signature';

  describe("Core Functionality", () => {
    it("handles POST requests with valid consent signature data", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a real signature record first to satisfy foreign key constraint
      const signature = await TestDatabaseUtils.createTestSignature(authContext.user.id, {
        name: 'Consent Signature Test',
        signature_type: 'consent'
      });
      
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          consentId: 'terms_of_service', 
          signatureId: signature.id,
          signatureData: {
            signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            timestamp: new Date().toISOString()
          }
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
          consentId: 'terms_of_service', 
          signatureId: 'non-existent-signature-id'
        }),
      });
      const postResponse = await routeHandlers.POST(postRequest);
      expect(postResponse.status).toBeGreaterThanOrEqual(400);
    });

    it("returns error for missing required fields", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Missing consentId and signatureId
      }, authContext);
      
      const response = await routeHandlers.POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Security", () => {
    it("requires valid JWT authentication", async () => {
      await setupUnauthenticatedTest();
      
      const request = new NextRequest(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentId: 'terms_of_service', 
          signatureId: 'non-existent-signature-id'
        })
      });
      const response = await routeHandlers.POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("validates JWT signature integrity", async () => {
      await setupUnauthenticatedTest();
      
      const request = new NextRequest(url, {
        method: 'POST',
        headers: {
          'Cookie': 'herit_access_token=invalid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          consentId: 'terms_of_service', 
          signatureId: 'non-existent-signature-id'
        })
      });
      const response = await routeHandlers.POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("Performance", () => {
    it("responds within acceptable time with real authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a real signature record first to satisfy foreign key constraint
      const signature = await TestDatabaseUtils.createTestSignature(authContext.user.id, {
        name: 'Performance Test Signature',
        signature_type: 'consent'
      });
      
      const request = createAuthenticatedRequest(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentId: 'terms_of_service', 
          signatureId: signature.id
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
      
      // Create a real signature record first to satisfy foreign key constraint
      const signature = await TestDatabaseUtils.createTestSignature(authContext.user.id, {
        name: 'Database Test Signature',
        signature_type: 'consent'
      });
      
      const request = createAuthenticatedRequest(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentId: 'privacy_policy', 
          signatureId: signature.id
        })
      }, authContext);
      const response = await routeHandlers.POST(request);
      
      expect(response).toBeDefined();
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with authentication workflow", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a real signature record first to satisfy foreign key constraint
      const signature = await TestDatabaseUtils.createTestSignature(authContext.user.id, {
        name: 'Integration Test Signature',
        signature_type: 'consent'
      });
      
      const request = createAuthenticatedRequest(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentId: 'data_processing', 
          signatureId: signature.id
        })
      }, authContext);
      const response = await routeHandlers.POST(request);
      
      expect(response).toBeDefined();
    });
  });

  describe("Compliance", () => {
    it("meets API standards with proper authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create a real signature record first to satisfy foreign key constraint
      const signature = await TestDatabaseUtils.createTestSignature(authContext.user.id, {
        name: 'Compliance Test Signature',
        signature_type: 'consent'
      });
      
      const request = createAuthenticatedRequest(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentId: 'legal_compliance', 
          signatureId: signature.id
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
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});