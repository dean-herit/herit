/**
 * API Test Templates - Enhanced Test Generation Engine
 * Generates comprehensive 8-section test suites for API routes
 */

import { RouteAnalysis, HttpMethod } from './backend-analyzer';

export interface TestGenerationOptions {
  routeAnalysis: RouteAnalysis;
  includeAdvancedTests: boolean;
  useTestUtils: boolean;
  includeMocks: boolean;
  includePerformanceTests: boolean;
}

export class ApiTestTemplates {
  private static generateImports(analysis: RouteAnalysis): string {
    const imports: string[] = [
      `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';`,
      `import { BackendTestUtils } from '../backend-test-utils';`,
    ];

    // Add conditional imports based on analysis
    if (analysis.authentication !== 'none') {
      imports.push(`import { createMockSession } from '../mocks/auth.mock';`);
    }

    if (analysis.externalServices.includes('stripe')) {
      imports.push(`import { mockStripe } from '../mocks/stripe.mock';`);
    }

    if (analysis.externalServices.includes('vercel-blob')) {
      imports.push(`import { mockVercelBlob } from '../mocks/vercel-blob.mock';`);
    }

    if (analysis.databaseOperations.length > 0) {
      imports.push(`import { testDb } from '../test-database';`);
    }

    return imports.join('\n');
  }

  private static generateTestSetup(analysis: RouteAnalysis): string {
    const setupLines: string[] = [];

    setupLines.push(`  // Test data setup`);
    setupLines.push(`  const mockUser = BackendTestUtils.createMockUser();`);
    
    if (analysis.routePath.includes('asset')) {
      setupLines.push(`  const mockAsset = BackendTestUtils.createMockAsset('property');`);
    }
    
    if (analysis.routePath.includes('beneficiar')) {
      setupLines.push(`  const mockBeneficiary = BackendTestUtils.createMockBeneficiary();`);
    }

    setupLines.push(``);
    setupLines.push(`  beforeEach(async () => {`);
    setupLines.push(`    // Clean test environment`);
    setupLines.push(`    vi.clearAllMocks();`);
    
    if (analysis.databaseOperations.length > 0) {
      setupLines.push(`    await BackendTestUtils.cleanTestData();`);
      setupLines.push(`    await BackendTestUtils.seedTestData({ users: [mockUser] });`);
    }
    
    setupLines.push(`  });`);
    setupLines.push(``);
    setupLines.push(`  afterEach(async () => {`);
    
    if (analysis.databaseOperations.length > 0) {
      setupLines.push(`    await BackendTestUtils.cleanTestData();`);
    }
    
    setupLines.push(`  });`);

    return setupLines.join('\n');
  }

  private static generateCoreFunctionalityTests(analysis: RouteAnalysis): string {
    const tests: string[] = [];
    
    tests.push(`  describe("Core Functionality", () => {`);

    // Generate tests for each HTTP method
    analysis.httpMethods.forEach(method => {
      tests.push(this.generateMethodTest(method, analysis));
    });

    // Add business logic tests
    if (analysis.databaseOperations.length > 0) {
      tests.push(`
    it("processes database operations correctly", async () => {
      const request = BackendTestUtils.createMockRequest({
        method: "${analysis.httpMethods[0]}",
        json: async () => ({ /* test data */ }),
      });

      const response = await ${analysis.httpMethods[0]}(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeDefined();
      
      // Verify database state
      const dbResult = await testDb.query.users.findFirst();
      expect(dbResult).toBeDefined();
    });`);
    }

    tests.push(`  });`);
    return tests.join('\n');
  }

  private static generateMethodTest(method: HttpMethod, analysis: RouteAnalysis): string {
    const isAuthRequired = analysis.authentication === 'required';
    
    return `
    it("handles ${method} requests successfully", async () => {
      const request = BackendTestUtils.create${isAuthRequired ? 'Authenticated' : 'Mock'}Request({
        method: "${method}",
        ${method !== 'GET' ? `json: async () => (${this.generateMockPayload(analysis)}),` : ''}
        ${isAuthRequired ? `userId: mockUser.id,` : ''}
      });

      const response = await ${method}(request);
      
      BackendTestUtils.expectSuccessResponse(response);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });`;
  }

  private static generateMockPayload(analysis: RouteAnalysis): string {
    // Generate appropriate payload based on route
    if (analysis.routePath.includes('auth/login')) {
      return `{ email: 'test@example.com', password: 'Test123!' }`;
    }
    if (analysis.routePath.includes('asset')) {
      return `{ 
        name: 'Test Property',
        type: 'property',
        value: 500000,
        location: 'Dublin'
      }`;
    }
    if (analysis.routePath.includes('beneficiar')) {
      return `{
        name: 'John Doe',
        relationship: 'child',
        allocation: 50
      }`;
    }
    return `{ /* Add appropriate test data */ }`;
  }

  private static generateErrorHandlingTests(analysis: RouteAnalysis): string {
    const tests: string[] = [];
    
    tests.push(`  describe("Error States", () => {`);

    // Validation error test
    if (analysis.requestValidation.length > 0 || analysis.httpMethods.includes('POST')) {
      tests.push(`
    it("returns 400 for invalid input", async () => {
      const request = BackendTestUtils.createMockRequest({
        method: "${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}",
        json: async () => ({ /* invalid data */ }),
      });

      const response = await ${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}(request);
      
      BackendTestUtils.expectErrorResponse(response, 'VALIDATION_ERROR');
      expect(response.status).toBe(400);
    });`);
    }

    // Database error test
    if (analysis.databaseOperations.length > 0) {
      tests.push(`
    it("handles database failures gracefully", async () => {
      // Mock database error
      vi.spyOn(testDb, 'select').mockRejectedValueOnce(new Error('Database connection failed'));
      
      const request = BackendTestUtils.createMockRequest({
        method: "${analysis.httpMethods[0]}",
      });

      const response = await ${analysis.httpMethods[0]}(request);
      
      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });`);
    }

    // Network timeout test
    if (analysis.externalServices.length > 0) {
      tests.push(`
    it("handles external service timeouts", async () => {
      // Mock service timeout
      ${analysis.externalServices.includes('stripe') ? 'mockStripe.timeout();' : '// Mock timeout'}
      
      const request = BackendTestUtils.createMockRequest({
        method: "${analysis.httpMethods[0]}",
      });

      const response = await ${analysis.httpMethods[0]}(request);
      
      // Should handle gracefully
      expect([200, 503]).toContain(response.status);
    });`);
    }

    tests.push(`  });`);
    return tests.join('\n');
  }

  private static generateSecurityTests(analysis: RouteAnalysis): string {
    const tests: string[] = [];
    
    tests.push(`  describe("Security", () => {`);

    // Authentication test
    if (analysis.authentication === 'required') {
      tests.push(`
    it("requires authentication", async () => {
      const request = BackendTestUtils.createMockRequest({
        method: "${analysis.httpMethods[0]}",
      });

      const response = await ${analysis.httpMethods[0]}(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });`);
    }

    // SQL injection test
    if (analysis.databaseOperations.length > 0) {
      tests.push(`
    it("prevents SQL injection", async () => {
      const request = BackendTestUtils.createMockRequest({
        method: "${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}",
        json: async () => ({
          name: "'; DROP TABLE users; --",
          value: 1000
        }),
      });

      const response = await ${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}(request);
      
      // Should sanitize input
      expect(response.status).not.toBe(500);
      
      // Verify database integrity
      const users = await testDb.query.users.findMany();
      expect(users).toBeDefined();
    });`);
    }

    // XSS prevention test
    tests.push(`
    it("prevents XSS attacks", async () => {
      const request = BackendTestUtils.createMockRequest({
        method: "${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}",
        json: async () => ({
          name: "<script>alert('XSS')</script>",
          description: "javascript:alert('XSS')"
        }),
      });

      const response = await ${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}(request);
      const data = await response.json();
      
      // Should sanitize output
      if (data.name) {
        expect(data.name).not.toContain('<script>');
      }
    });`);

    // Rate limiting test
    if (analysis.hasRateLimiting) {
      tests.push(`
    it("enforces rate limiting", async () => {
      const requests = Array(10).fill(null).map(() => 
        BackendTestUtils.createMockRequest({
          method: "${analysis.httpMethods[0]}",
        })
      );

      const responses = await Promise.all(
        requests.map(req => ${analysis.httpMethods[0]}(req))
      );

      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });`);
    }

    tests.push(`  });`);
    return tests.join('\n');
  }

  private static generatePerformanceTests(analysis: RouteAnalysis): string {
    const tests: string[] = [];
    
    tests.push(`  describe("Performance", () => {`);

    tests.push(`
    it("responds within acceptable time", async () => {
      const request = BackendTestUtils.create${analysis.authentication === 'required' ? 'Authenticated' : 'Mock'}Request({
        method: "${analysis.httpMethods[0]}",
        ${analysis.authentication === 'required' ? 'userId: mockUser.id,' : ''}
      });

      const startTime = performance.now();
      const response = await ${analysis.httpMethods[0]}(request);
      const responseTime = performance.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(${analysis.complexity > 5 ? 500 : 200});
    });`);

    if (analysis.complexity > 3) {
      tests.push(`
    it("handles concurrent requests", async () => {
      const results = await BackendTestUtils.simulateConcurrentRequests(
        10,
        () => BackendTestUtils.create${analysis.authentication === 'required' ? 'Authenticated' : 'Mock'}Request({
          method: "${analysis.httpMethods[0]}",
          ${analysis.authentication === 'required' ? 'userId: mockUser.id,' : ''}
        }),
        ${analysis.httpMethods[0]}
      );
      
      expect(results.successRate).toBeGreaterThan(0.95);
      expect(results.averageResponseTime).toBeLessThan(500);
    });`);
    }

    tests.push(`  });`);
    return tests.join('\n');
  }

  private static generateDatabaseIntegrityTests(analysis: RouteAnalysis): string {
    if (analysis.databaseOperations.length === 0) {
      return '';
    }

    const tests: string[] = [];
    
    tests.push(`  describe("Database Integrity", () => {`);

    // Transaction consistency test
    if (analysis.databaseOperations.some(op => op.type === 'transaction')) {
      tests.push(`
    it("maintains transaction consistency", async () => {
      const request = BackendTestUtils.createMockRequest({
        method: "${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}",
        json: async () => ({ /* data that triggers transaction */ }),
      });

      // Simulate partial failure
      vi.spyOn(testDb, 'update').mockRejectedValueOnce(new Error('Update failed'));
      
      const response = await ${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}(request);
      
      // Verify rollback occurred
      const data = await testDb.query.users.findFirst();
      expect(data).toMatchSnapshot('original-state');
    });`);
    }

    // Audit logging test
    if (analysis.hasAuditLogging) {
      tests.push(`
    it("creates audit logs for data changes", async () => {
      const request = BackendTestUtils.create${analysis.authentication === 'required' ? 'Authenticated' : 'Mock'}Request({
        method: "${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}",
        json: async () => ({ name: 'Test Item' }),
        ${analysis.authentication === 'required' ? 'userId: mockUser.id,' : ''}
      });

      await ${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}(request);
      
      await BackendTestUtils.expectAuditLog({
        action: '${analysis.routePath.split('/').pop()}_${analysis.httpMethods.find(m => m !== 'GET')?.toLowerCase() || 'action'}',
        userId: ${analysis.authentication === 'required' ? 'mockUser.id' : 'null'},
      });
    });`);
    }

    tests.push(`  });`);
    return tests.join('\n');
  }

  private static generateIntegrationTests(analysis: RouteAnalysis): string {
    if (analysis.externalServices.length === 0) {
      return '';
    }

    const tests: string[] = [];
    
    tests.push(`  describe("Integration Scenarios", () => {`);

    // Stripe integration
    if (analysis.externalServices.includes('stripe')) {
      tests.push(`
    it("integrates with Stripe successfully", async () => {
      mockStripe.paymentIntent.create.mockResolvedValueOnce({
        id: 'pi_test123',
        status: 'succeeded',
      });

      const request = BackendTestUtils.createMockRequest({
        method: "POST",
        json: async () => ({ amount: 1000, currency: 'eur' }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.paymentIntentId).toBe('pi_test123');
    });`);
    }

    // Vercel Blob integration
    if (analysis.externalServices.includes('vercel-blob')) {
      tests.push(`
    it("handles file uploads via Vercel Blob", async () => {
      mockVercelBlob.put.mockResolvedValueOnce({
        url: 'https://blob.vercel.com/test-file.pdf',
        downloadUrl: 'https://blob.vercel.com/download/test-file.pdf',
      });

      const request = BackendTestUtils.createMockRequest({
        method: "POST",
        formData: async () => new FormData(),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toContain('blob.vercel.com');
    });`);
    }

    // External API fallback
    tests.push(`
    it("handles external service failures gracefully", async () => {
      // Mock service failure
      ${analysis.externalServices[0] === 'stripe' ? 'mockStripe.error();' : '// Mock failure'}
      
      const request = BackendTestUtils.createMockRequest({
        method: "${analysis.httpMethods[0]}",
      });

      const response = await ${analysis.httpMethods[0]}(request);
      
      // Should not crash
      expect([200, 503]).toContain(response.status);
    });`);

    tests.push(`  });`);
    return tests.join('\n');
  }

  private static generateComplianceTests(analysis: RouteAnalysis): string {
    const tests: string[] = [];
    
    tests.push(`  describe("Compliance", () => {`);

    // GDPR compliance
    if (analysis.routePath.includes('user') || analysis.routePath.includes('personal')) {
      tests.push(`
    it("enforces GDPR data protection", async () => {
      const request = BackendTestUtils.createAuthenticatedRequest({
        method: "GET",
        userId: mockUser.id,
      });

      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Should not expose sensitive data unnecessarily
      expect(data).not.toHaveProperty('password');
      expect(data).not.toHaveProperty('pps_number');
    });`);
    }

    // Irish regulatory compliance
    if (analysis.routePath.includes('asset') || analysis.routePath.includes('will')) {
      tests.push(`
    it("validates Irish regulatory requirements", async () => {
      const request = BackendTestUtils.createMockRequest({
        method: "POST",
        json: async () => ({
          eircode: 'D02 XY12',
          county: 'Dublin',
          iban: 'IE12BOFI90001710027952',
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Verify Irish-specific validations
      expect(data.eircode).toMatch(/^[A-Z]\d{2}\s?[A-Z0-9]{4}$/);
      expect(data.iban).toMatch(/^IE\d{2}[A-Z]{4}\d{14}$/);
    });`);
    }

    tests.push(`  });`);
    return tests.join('\n');
  }

  private static generateEdgeCaseTests(analysis: RouteAnalysis): string {
    const tests: string[] = [];
    
    tests.push(`  describe("Edge Cases", () => {`);

    // Empty payload test
    if (analysis.httpMethods.some(m => m !== 'GET')) {
      tests.push(`
    it("handles empty payloads", async () => {
      const request = BackendTestUtils.createMockRequest({
        method: "${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}",
        json: async () => ({}),
      });

      const response = await ${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });`);
    }

    // Large payload test
    tests.push(`
    it("handles large payloads", async () => {
      const largeData = Array(1000).fill({ 
        name: 'Test Item',
        value: Math.random() * 1000
      });

      const request = BackendTestUtils.createMockRequest({
        method: "${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}",
        json: async () => ({ items: largeData }),
      });

      const response = await ${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}(request);
      
      // Should handle or reject gracefully
      expect([200, 413]).toContain(response.status);
    });`);

    // Race condition test
    if (analysis.databaseOperations.some(op => op.type === 'update')) {
      tests.push(`
    it("prevents race conditions", async () => {
      const requests = Array(5).fill(null).map(() => 
        BackendTestUtils.createMockRequest({
          method: "${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}",
          json: async () => ({ id: 'same-id', value: Math.random() }),
        })
      );

      const responses = await Promise.all(
        requests.map(req => ${analysis.httpMethods.find(m => m !== 'GET') || 'POST'}(req))
      );

      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });`);
    }

    tests.push(`  });`);
    return tests.join('\n');
  }

  static generateEnhancedApiTest(options: TestGenerationOptions): string {
    const { routeAnalysis } = options;
    const fileName = routeAnalysis.routePath.replace(/^\/api\//, '').replace(/\//g, '-');

    const sections: string[] = [
      `/**`,
      ` * ${routeAnalysis.routePath} API Route Test`,
      ` * Enhanced 8-section test structure with comprehensive coverage`,
      ` * Auto-generated for: ${routeAnalysis.fileName}`,
      ` * Complexity: ${routeAnalysis.complexity}/10`,
      ` * Priority: ${routeAnalysis.testPriority}`,
      ` */`,
      ``,
      this.generateImports(routeAnalysis),
      ``,
      `// Import the route handler`,
      `import { ${routeAnalysis.httpMethods.join(', ')} } from '@/app${routeAnalysis.routePath}/route';`,
      ``,
      `describe("${routeAnalysis.routePath}", () => {`,
      this.generateTestSetup(routeAnalysis),
      ``,
      this.generateCoreFunctionalityTests(routeAnalysis),
      ``,
      this.generateErrorHandlingTests(routeAnalysis),
      ``,
      this.generateSecurityTests(routeAnalysis),
      ``,
      this.generatePerformanceTests(routeAnalysis),
      ``,
      this.generateDatabaseIntegrityTests(routeAnalysis),
      ``,
      this.generateIntegrationTests(routeAnalysis),
      ``,
      this.generateComplianceTests(routeAnalysis),
      ``,
      this.generateEdgeCaseTests(routeAnalysis),
      `});`,
    ];

    return sections.filter(s => s !== '').join('\n');
  }

  static generateMinimalTest(routeAnalysis: RouteAnalysis): string {
    // Simplified version for quick testing
    return `
import { describe, it, expect } from 'vitest';
import { ${routeAnalysis.httpMethods.join(', ')} } from '@/app${routeAnalysis.routePath}/route';

describe("${routeAnalysis.routePath}", () => {
  it("should handle ${routeAnalysis.httpMethods[0]} requests", async () => {
    // Minimal test to verify route exists
    expect(${routeAnalysis.httpMethods[0]}).toBeDefined();
  });
});`;
  }
}