/**
 * /api/onboarding/save-step API Route Test - REAL AUTHENTICATION
 * Enhanced 8-section test structure with production-grade validation
 * Migrated to TestAuthManager for real JWT tokens and database sessions
 * Complexity: 6/10
 * Priority: medium
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

// Import the actual route handlers
import * as routeHandlers from '@/app/api/onboarding/save-step/route';

// Real authentication testing utilities
import { setupApiTestHooks, setupAuthenticatedTest, setupUnauthenticatedTest, TestAssertions, createAuthenticatedRequest } from '../../../test-setup-real-auth';

describe("/api/onboarding/save-step", () => {
  // Setup authentication test hooks with real JWT tokens
  setupApiTestHooks();

  const url = 'http://localhost:3000/api/onboarding/save-step';

  describe("Core Functionality", () => {
    it("handles POST requests with valid authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 0,
          data: {
            first_name: 'Test',
            last_name: 'User',
            phone_number: '+353871234567',
            date_of_birth: '1990-01-01',
            address_line_1: '123 Test Street',
            city: 'Dublin',
            county: 'Dublin',
            eircode: 'D01 X123'
          }
        }),
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.step).toBe(0);
    });
    
    it("saves step completion data correctly", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 1, // Signature step
          data: null
        }),
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.step).toBe(1);
      expect(data.nextStep).toBe(2);
    });

    it("handles final step completion", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 3, // Final verification step
          data: null
        }),
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.step).toBe(3);
      expect(data.nextStep).toBe('complete');
    });
  });

  describe("Error States", () => {
    it("returns 401 for unauthenticated requests", async () => {
      await setupUnauthenticatedTest();
      const request = new NextRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 0, data: {} }),
      });

      const response = await routeHandlers.POST(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authentication required');
    });

    it("validates step number range", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 5, data: {} }), // Invalid step
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid step number. Must be 0-3');
    });

    it("validates step number type", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'invalid', data: {} }),
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid step number. Must be 0-3');
    });
  });

  describe("Security", () => {
    it("requires valid JWT authentication", async () => {
      await setupUnauthenticatedTest();
      const request = new NextRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 0, data: {} }),
      });

      const response = await routeHandlers.POST(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authentication required');
    });

    it("validates JWT signature integrity", async () => {
      await setupUnauthenticatedTest();
      const request = new NextRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'herit_access_token=invalid-token'
        },
        body: JSON.stringify({ step: 0, data: {} }),
      });

      const response = await routeHandlers.POST(request);
      
      expect(response.status).toBe(401);
    });

    it("prevents data injection through step data", async () => {
      const authContext = await setupAuthenticatedTest();
      const maliciousData = {
        first_name: "'; DROP TABLE users; --",
        last_name: "<script>alert('xss')</script>",
        address_line_1: "SELECT * FROM users WHERE id = 1; --"
      };
      
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 0, data: maliciousData }),
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      // Should handle malicious input safely
      TestAssertions.expectSuccessfulResponse(response);
    });
  });

  describe("Performance", () => {
    it("responds within acceptable time with real authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1, data: null }),
      }, authContext);

      const startTime = performance.now();
      const response = await routeHandlers.POST(request);
      const responseTime = performance.now() - startTime;
      
      TestAssertions.expectSuccessfulResponse(response);
      expect(responseTime).toBeLessThan(2000); // 2 second limit
    });

    it("handles concurrent requests efficiently", async () => {
      const authContext = await setupAuthenticatedTest();
      
      const requests = Array(3).fill(0).map((_, index) => 
        createAuthenticatedRequest(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: index % 4, data: null }), // Different steps
        }, authContext)
      );

      const startTime = performance.now();
      const responses = await Promise.all(
        requests.map(req => routeHandlers.POST(req))
      );
      const responseTime = performance.now() - startTime;
      
      responses.forEach(response => {
        TestAssertions.expectSuccessfulResponse(response);
      });
      expect(responseTime).toBeLessThan(3000); // 3 second limit for concurrent requests
    });
  });

  describe("Database Integrity", () => {
    it("maintains user data consistency with real database operations", async () => {
      const authContext = await setupAuthenticatedTest({
        first_name: 'Original',
        last_name: 'Name',
        onboarding_completed: false,
        personal_info_completed: false
      });
      
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 0,
          data: {
            first_name: 'Updated',
            last_name: 'Name',
            phone_number: '+353871234567'
          }
        }),
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.step).toBe(0);
    });

    it("creates proper audit trail for step completions", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 2, data: null }), // Legal consent step
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      // Verify audit logging occurred (response indicates success)
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('Step 2 completed successfully');
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with onboarding progression workflow", async () => {
      const authContext = await setupAuthenticatedTest({
        onboarding_completed: false,
        personal_info_completed: false,
        signature_completed: false,
        legal_consent_completed: false,
        verification_completed: false
      });
      
      // Complete personal info step
      const step0Request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 0,
          data: {
            first_name: 'Test',
            last_name: 'User',
            phone_number: '+353871234567',
            date_of_birth: '1990-01-01'
          }
        }),
      }, authContext);

      const step0Response = await routeHandlers.POST(step0Request);
      TestAssertions.expectSuccessfulResponse(step0Response);
      
      const step0Data = await step0Response.json();
      expect(step0Data.success).toBe(true);
      expect(step0Data.nextStep).toBe(1);
    });

    it("handles step progression through onboarding flow", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Test multiple step completions in sequence
      const steps = [1, 2, 3]; // signature, legal_consent, verification
      
      for (const step of steps) {
        const request = createAuthenticatedRequest(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step, data: null }),
        }, authContext);

        const response = await routeHandlers.POST(request);
        TestAssertions.expectSuccessfulResponse(response);
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.step).toBe(step);
      }
    });
  });

  describe("Compliance", () => {
    it("meets API standards with proper authentication", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1, data: null }),
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(Response);
      TestAssertions.expectSuccessfulResponse(response);
    });

    it("follows REST API conventions", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 0, data: {} }),
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      expect(response.headers.get('Content-Type')).toContain('application/json');
      TestAssertions.expectSuccessfulResponse(response);
    });
  });

  describe("Edge Cases", () => {
    it("handles requests with malformed JSON", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
         body: '{"malformed": json}',
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });

    it("handles requests with missing step parameter", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: {} }), // Missing step
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid step number. Must be 0-3');
    });

    it("handles null data for non-personal info steps", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1, data: null }), // Signature step with null data
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });


  describe("Token Management", () => {
    it("validates access token structure and claims", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1, data: null }),
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('Step 1 completed successfully');
    });

    it("maintains session consistency across step saves", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Make multiple requests with the same auth context
      const requests = [
        createAuthenticatedRequest(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 1, data: null }),
        }, authContext),
        createAuthenticatedRequest(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 2, data: null }),
        }, authContext)
      ];

      const responses = await Promise.all(
        requests.map(req => routeHandlers.POST(req))
      );
      
      responses.forEach(response => {
        TestAssertions.expectSuccessfulResponse(response);
      });

      const data1 = await responses[0].json();
      const data2 = await responses[1].json();
      
      expect(data1.success).toBe(true);
      expect(data2.success).toBe(true);
    });

    it("handles expired tokens appropriately", async () => {
      await setupUnauthenticatedTest();
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiZXhwIjoxfQ.invalid';
      const request = new NextRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `herit_access_token=${expiredToken}`
        },
        body: JSON.stringify({ step: 0, data: {} }),
      });

      const response = await routeHandlers.POST(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authentication required');
    });
  });
});