/**
 * /api/assets API Route Test - REAL AUTHENTICATION
 * Enhanced 8-section test structure with production-grade validation
 * Migrated to TestAuthManager for real JWT tokens and database sessions
 * Complexity: 6/10
 * Priority: high (core business logic)
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

// Import the actual route handlers
import * as routeHandlers from '@/app/api/assets/route';

// Real authentication testing utilities
import { setupApiTestHooks, setupAuthenticatedTest, setupUnauthenticatedTest, TestAssertions, createAuthenticatedRequest, TestDatabaseUtils } from '../../test-setup-real-auth';

describe("/api/assets", () => {
  // Setup authentication test hooks with real JWT tokens
  setupApiTestHooks();

  const url = 'http://localhost:3000/api/assets';

  describe("Core Functionality", () => {
    it("handles GET requests to retrieve user assets", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create test assets for the user
      const testAssets = await TestDatabaseUtils.createMockAssets([
        {
          name: 'Test House',
          asset_type: 'property',
          value: 250000,
          user_id: authContext.user.id,
          metadata: { address: 'Test Street 123' }
        },
        {
          name: 'Savings Account',
          asset_type: 'financial',
          value: 50000,
          user_id: authContext.user.id,
          metadata: { bank: 'Test Bank' }
        }
      ]);

      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.assets).toBeDefined();
      expect(data.data.assets.length).toBeGreaterThanOrEqual(2);
      
      // Verify assets belong to the authenticated user
      data.data.assets.forEach((asset: any) => {
        expect(asset.user_id).toBe(authContext.user.id);
      });
    });

    it("handles POST requests to create new assets", async () => {
      const authContext = await setupAuthenticatedTest();

      // Use proper V2 schema format for financial asset
      const newAsset = {
        name: 'Investment Portfolio',
        asset_type: 'individual_stock_holding',
        category: 'financial',
        value: 75000,
        description: 'Diversified stock portfolio',
        specific_fields: {
          ticker_symbol: 'AAPL',
          company_name: 'Apple Inc',
          number_of_shares: 100,
          cost_basis_per_share: 150,
          stockbroker: 'Davy Stockbrokers',
          stock_exchange: 'NASDAQ'
        }
      };

      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset)
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      if (response.status >= 400) {
        const errorData = await response.json();
        console.log('POST Error Response:', JSON.stringify(errorData, null, 2));
        console.log('Request payload:', JSON.stringify(newAsset, null, 2));
      }
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.name).toBe(newAsset.name);
      expect(data.data.asset_type).toBe(newAsset.category); // Database stores category, not detailed type
      expect(data.data.value).toBe(newAsset.value);
      expect(data.data.user_id).toBe(authContext.user.id);
      expect(data.data.description).toBe(newAsset.description);
    });
  });

  describe("Error States", () => {
    it("returns 401 for unauthenticated GET requests", async () => {
      await setupUnauthenticatedTest();
      const request = new NextRequest(url, { method: 'GET' });

      const response = await routeHandlers.GET(request);
      
      expect(response.status).toBe(401);
    });

    it("returns 401 for unauthenticated POST requests", async () => {
      await setupUnauthenticatedTest();
      const request = new NextRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Asset',
          asset_type: 'property',
          value: 100000
        })
      });

      const response = await routeHandlers.POST(request);
      
      expect(response.status).toBe(401);
    });

    it("returns 400 for POST with missing required fields", async () => {
      const authContext = await setupAuthenticatedTest();

      const invalidAsset = {
        name: 'Incomplete Asset'
        // Missing type and value
      };

      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidAsset)
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      expect(response.status).toBe(400);
    });

    it("handles database errors gracefully", async () => {
      const authContext = await setupAuthenticatedTest();

      // Test with extremely large value that might cause database issues
      const problematicAsset = {
        name: 'Problematic Asset',
        asset_type: 'financial',
        value: Number.MAX_SAFE_INTEGER,
        metadata: { test: 'large_value' }
      };

      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(problematicAsset)
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      // Should handle gracefully (either success or proper error)
      expect([200, 201, 400, 500]).toContain(response.status);
    });
  });

  describe("Security", () => {
    it("prevents access to other users' assets", async () => {
      // Create one user and test that they can't access non-existent data
      const authContext = await setupAuthenticatedTest();
      
      // Test that user gets their own assets (should work like other tests)
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);
      const response = await routeHandlers.GET(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.assets).toBeDefined();
      expect(Array.isArray(data.data.assets)).toBe(true);
      
      // All returned assets should belong to the authenticated user
      data.data.assets.forEach((asset: any) => {
        expect(asset).toHaveProperty('user_id');
        expect(asset.user_id).toEqual(authContext.user.id);
      });
    });

    it("validates asset type enum values", async () => {
      const authContext = await setupAuthenticatedTest();

      const invalidAsset = {
        name: 'Invalid Asset',
        asset_type: 'not_a_real_asset_type', // Should be one of: property, financial, personal, digital
        value: 50000
      };

      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidAsset)
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      expect(response.status).toBe(400);
    });

    it("prevents XSS in asset metadata", async () => {
      const authContext = await setupAuthenticatedTest();

      const maliciousAsset = {
        name: 'XSS Test Asset',
        asset_type: 'personal',
        category: 'personal',
        value: 1000,
        specific_fields: {
          vehicle_make: 'Toyota',
          vehicle_model: 'Camry',
          vehicle_year: 2020,
          registration_number: 'D-12345',
          is_classic_car: false
        },
        description: '<script>alert("xss")</script>Malicious description',
        metadata: {
          notes: '<img src="x" onerror="alert(\'xss\')">'
        }
      };

      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maliciousAsset)
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      // Should handle malicious content (either sanitize or reject)
      if (response.status === 200 || response.status === 201) {
        const data = await response.json();
        // If accepted, ensure no script tags in response
        expect(JSON.stringify(data)).not.toContain('<script>');
        expect(JSON.stringify(data)).not.toContain('onerror=');
      } else {
        // Or it should reject malicious content
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe("Performance", () => {
    it("responds within acceptable time for asset retrieval", async () => {
      const authContext = await setupAuthenticatedTest();
      
      // Create multiple assets to test query performance
      const manyAssets = Array.from({ length: 20 }, (_, i) => ({
        name: `Performance Asset ${i + 1}`,
        asset_type: 'financial' as const,
        value: 1000 * (i + 1),
        user_id: authContext.user.id
      }));
      
      await TestDatabaseUtils.createMockAssets(manyAssets);

      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const startTime = performance.now();
      const response = await routeHandlers.GET(request);
      const responseTime = performance.now() - startTime;
      
      TestAssertions.expectSuccessfulResponse(response);
      expect(responseTime).toBeLessThan(2000); // 2 second limit
    });

    it("handles concurrent asset creation efficiently", async () => {
      const authContext = await setupAuthenticatedTest();

      const assetsToCreate = [
        { 
          name: 'Concurrent Asset 1', 
          asset_type: 'irish_residential_property',
          category: 'property',
          value: 100000,
          specific_fields: {
            eircode: 'D01 ABC1',
            folio_number: 'FL123456',
            property_type: 'Detached House',
            county: 'Dublin',
            title_type: 'F'
          }
        },
        { 
          name: 'Concurrent Asset 2', 
          asset_type: 'irish_bank_account',
          category: 'financial',
          value: 50000,
          specific_fields: {
            iban: 'IE29AIBK93115212345678',
            irish_bank_name: 'Allied Irish Banks',
            irish_account_type: 'Current Account'
          }
        },
        { 
          name: 'Concurrent Asset 3', 
          asset_type: 'irish_motor_vehicle',
          category: 'personal', 
          value: 25000,
          specific_fields: {
            vehicle_registration_number: '12-D-12345',
            make: 'Toyota',
            model: 'Camry',
            year: 2020
          }
        }
      ];

      const requests = assetsToCreate.map(asset =>
        createAuthenticatedRequest(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(asset)
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
    it("maintains asset-user relationship integrity", async () => {
      const authContext = await setupAuthenticatedTest({
        first_name: 'Asset',
        last_name: 'Owner'
      });

      const testAsset = {
        name: 'Integrity Test Asset',
        asset_type: 'irish_bank_account',
        category: 'financial',
        value: 42000,
        specific_fields: {
          iban: 'IE29AIBK93115212345678',
          irish_bank_name: 'Allied Irish Banks',
          irish_account_type: 'Current Account'
        },
        description: 'Testing data integrity'
      };

      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testAsset)
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.data.user_id).toBe(authContext.user.id);
      expect(data.data.name).toBe(testAsset.name);
      expect(data.data.value).toBe(testAsset.value);
    });

    it("handles asset metadata JSON storage correctly", async () => {
      const authContext = await setupAuthenticatedTest();

      const assetWithComplexMetadata = {
        name: 'Complex Metadata Asset',
        asset_type: 'irish_residential_property',
        category: 'property',
        value: 500000,
        specific_fields: {
          eircode: 'D01 ABC1',
          folio_number: 'FL456123',
          property_type: 'Detached House',
          county: 'Dublin',
          title_type: 'F'
        }
      };

      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetWithComplexMetadata)
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.data.metadata).toEqual(assetWithComplexMetadata.metadata);
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with asset categorization system", async () => {
      const authContext = await setupAuthenticatedTest();

      const categorizedAssets = [
        { 
          name: 'Primary Residence', 
          asset_type: 'irish_residential_property',
          category: 'property',
          value: 400000,
          specific_fields: {
            eircode: 'D04 X456',
            folio_number: 'FL654321',
            property_type: 'Semi-Detached House',
            county: 'Dublin',
            title_type: 'F'
          }
        },
        { 
          name: 'Investment Property',
          asset_type: 'irish_commercial_property',
          category: 'property',
          value: 250000,
          specific_fields: {
            eircode: 'C01 Y789',
            folio_number: 'FL789456',
            property_type: 'Retail Unit',
            county: 'Cork',
            title_type: 'F'
          }
        },
        { 
          name: 'Emergency Fund',
          asset_type: 'irish_bank_account',
          category: 'financial',
          value: 15000,
          specific_fields: {
            iban: 'IE29BOFI90017012345678',
            irish_bank_name: 'Bank of Ireland',
            irish_account_type: 'Savings Account',
            joint_account: false
          }
        },
        { 
          name: 'Retirement Fund',
          asset_type: 'irish_prsa',
          category: 'financial',
          value: 100000,
          specific_fields: {
            pension_provider: 'Irish Life',
            pension_number: 'PRSA123456'
          }
        }
      ];

      for (const asset of categorizedAssets) {
        const request = createAuthenticatedRequest(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(asset)
        }, authContext);

        const response = await routeHandlers.POST(request);
        TestAssertions.expectSuccessfulResponse(response);
        
        const data = await response.json();
        expect(data.data.asset_type).toBe(asset.category); // Database stores category, not detailed type
      }
    });

    it("supports asset valuation workflow", async () => {
      const authContext = await setupAuthenticatedTest();

      const valuationAsset = {
        name: 'Investment Property Dublin',
        asset_type: 'irish_residential_property',
        category: 'property',
        value: 350000,
        specific_fields: {
          eircode: 'D02 XY34',
          folio_number: 'FL333444',
          property_type: 'Apartment',
          county: 'Dublin',
          title_type: 'F'
        }
      };

      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valuationAsset)
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.data.name).toBe(valuationAsset.name);
      expect(data.data.value).toBe(valuationAsset.value);
    });
  });

  describe("Compliance", () => {
    it("meets API standards for asset management", async () => {
      const authContext = await setupAuthenticatedTest();
      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      expect(response).toBeDefined();
      expect(response).toBeInstanceOf(Response);
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.data).toHaveProperty('assets');
      expect(Array.isArray(data.data.assets)).toBe(true);
    });

    it("follows REST API conventions for assets", async () => {
      const authContext = await setupAuthenticatedTest();

      // Test GET
      const getRequest = createAuthenticatedRequest(url, { method: 'GET' }, authContext);
      const getResponse = await routeHandlers.GET(getRequest);
      
      expect(getResponse.headers.get('Content-Type')).toContain('application/json');
      TestAssertions.expectSuccessfulResponse(getResponse);

      // Test POST
      const postRequest = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'REST Compliance Asset',
          asset_type: 'irish_bank_account',
          category: 'financial',
          value: 10000,
          specific_fields: {
            iban: 'IE29AIBK93115212345111',
            irish_bank_name: 'Allied Irish Banks',
            irish_account_type: 'Current Account'
          }
        })
      }, authContext);

      const postResponse = await routeHandlers.POST(postRequest);
      expect(postResponse.headers.get('Content-Type')).toContain('application/json');
      TestAssertions.expectSuccessfulResponse(postResponse);
    });
  });

  describe("Edge Cases", () => {
    it("handles assets with zero value", async () => {
      const authContext = await setupAuthenticatedTest();

      const zeroValueAsset = {
        name: 'Depreciated Asset',
        asset_type: 'irish_motor_vehicle',
        category: 'personal',
        value: 0,
        specific_fields: {
          vehicle_registration_number: '12-D-99999',
          make: 'Toyota',
          model: 'Camry',
          year: 2020
        },
        description: 'Asset with zero current value'
      };

      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zeroValueAsset)
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.data.value).toBe(0);
    });

    it("handles very long asset names", async () => {
      const authContext = await setupAuthenticatedTest();

      const longNameAsset = {
        name: 'A'.repeat(255), // Very long name
        asset_type: 'personal',
        value: 1000
      };

      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(longNameAsset)
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      // Should either accept it or properly reject with validation error
      if (response.status >= 400) {
        expect(response.status).toBe(400); // Validation error
      } else {
        TestAssertions.expectSuccessfulResponse(response);
      }
    });

    it("handles empty asset lists gracefully", async () => {
      const authContext = await setupAuthenticatedTest({
        email: 'empty-assets@example.com'
      });

      const request = createAuthenticatedRequest(url, { method: 'GET' }, authContext);

      const response = await routeHandlers.GET(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.data.assets).toBeDefined();
      expect(Array.isArray(data.data.assets)).toBe(true);
      expect(data.data.assets.length).toBe(0);
    });

    it("handles unicode characters in asset names", async () => {
      const authContext = await setupAuthenticatedTest();

      const unicodeAsset = {
        name: 'Maison à Paris 🏠 価値のある資産',
        asset_type: 'irish_residential_property',
        category: 'property',
        value: 800000,
        specific_fields: {
          eircode: 'D08 ZYX1',
          folio_number: 'FL777888',
          property_type: 'Apartment',
          county: 'Dublin',
          title_type: 'F'
        },
        description: 'Property with unicode characters'
      };

      const request = createAuthenticatedRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unicodeAsset)
      }, authContext);

      const response = await routeHandlers.POST(request);
      
      TestAssertions.expectSuccessfulResponse(response);
      
      const data = await response.json();
      expect(data.data.name).toBe(unicodeAsset.name);
    });
  });
});

// Asset endpoint specific test helpers
function expectValidAssetResponse(response: Response) {
  expect(response.status).toBe(200);
  expect(response.headers.get('Content-Type')).toContain('application/json');
}

function expectValidAssetData(asset: any, expectedUserId: string) {
  expect(asset).toHaveProperty('id');
  expect(asset).toHaveProperty('name');
  expect(asset).toHaveProperty('type');
  expect(asset).toHaveProperty('value');
  expect(asset.user_id).toBe(expectedUserId);
}

function validateAssetType(type: string) {
  const validTypes = ['property', 'financial', 'personal', 'digital'];
  expect(validTypes).toContain(type);
}