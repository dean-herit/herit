/**
 * Comprehensive API Testing Suite for HeroUI Heritage
 * Tests all API endpoints with proper authentication, validation, and error handling
 */

describe("Comprehensive API Testing", () => {
  let authToken: string;
  let testUserId: string;

  before(() => {
    // Setup test user and get auth token
    cy.task("db:clean");
    cy.setupTestUser({
      email: "api-test@example.com",
      onboarding_completed: true,
    });
  });

  beforeEach(() => {
    // Get fresh auth token
    cy.request("POST", "/api/auth/signin", {
      email: "api-test@example.com",
      password: "password123",
    }).then((response) => {
      authToken = response.body.token;
      testUserId = response.body.user.id;
    });
  });

  after(() => {
    cy.task("db:clean");
  });

  describe("Authentication API", () => {
    it("POST /api/auth/signin - successful login", () => {
      cy.request({
        method: "POST",
        url: "/api/auth/signin",
        body: {
          email: "api-test@example.com",
          password: "password123",
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("token");
        expect(response.body).to.have.property("user");
        expect(response.body.user).to.have.property(
          "email",
          "api-test@example.com",
        );
      });
    });

    it("POST /api/auth/signin - invalid credentials", () => {
      cy.request({
        method: "POST",
        url: "/api/auth/signin",
        body: {
          email: "api-test@example.com",
          password: "wrongpassword",
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property("error");
      });
    });

    it("POST /api/auth/signup - creates new user", () => {
      const newUserEmail = `new-${Date.now()}@example.com`;

      cy.request({
        method: "POST",
        url: "/api/auth/signup",
        body: {
          email: newUserEmail,
          password: "SecurePassword123!",
          firstName: "New",
          lastName: "User",
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property("user");
        expect(response.body.user.email).to.eq(newUserEmail);
      });
    });

    it("POST /api/auth/signout - signs out user", () => {
      cy.request({
        method: "POST",
        url: "/api/auth/signout",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });
  });

  describe("User Management API", () => {
    it("GET /api/user/profile - gets user profile", () => {
      cy.request({
        method: "GET",
        url: "/api/user/profile",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("id");
        expect(response.body).to.have.property("email");
        expect(response.body).to.have.property("onboarding_completed");
      });
    });

    it("PUT /api/user/profile - updates user profile", () => {
      cy.request({
        method: "PUT",
        url: "/api/user/profile",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          firstName: "Updated",
          lastName: "Name",
          phone: "+353 85 999 8888",
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.firstName).to.eq("Updated");
        expect(response.body.lastName).to.eq("Name");
      });
    });

    it("GET /api/user/profile - requires authentication", () => {
      cy.request({
        method: "GET",
        url: "/api/user/profile",
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });
  });

  describe("Assets API", () => {
    let assetId: string;

    it("POST /api/assets - creates new asset", () => {
      cy.request({
        method: "POST",
        url: "/api/assets",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          name: "Test Property",
          type: "property",
          value: 250000,
          description: "Test property asset",
          metadata: {
            address: "123 Test Street",
            propertyType: "residential",
          },
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property("id");
        expect(response.body.name).to.eq("Test Property");
        expect(response.body.type).to.eq("property");
        expect(response.body.value).to.eq(250000);
        assetId = response.body.id;
      });
    });

    it("GET /api/assets - lists user assets", () => {
      cy.request({
        method: "GET",
        url: "/api/assets",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an("array");
        expect(response.body.length).to.be.greaterThan(0);
        expect(response.body[0]).to.have.property("name");
        expect(response.body[0]).to.have.property("type");
        expect(response.body[0]).to.have.property("value");
      });
    });

    it("GET /api/assets/:id - gets specific asset", () => {
      cy.request({
        method: "GET",
        url: `/api/assets/${assetId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.id).to.eq(assetId);
        expect(response.body.name).to.eq("Test Property");
      });
    });

    it("PUT /api/assets/:id - updates asset", () => {
      cy.request({
        method: "PUT",
        url: `/api/assets/${assetId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          name: "Updated Property",
          value: 300000,
          description: "Updated description",
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.name).to.eq("Updated Property");
        expect(response.body.value).to.eq(300000);
      });
    });

    it("POST /api/assets - validates required fields", () => {
      cy.request({
        method: "POST",
        url: "/api/assets",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          // Missing required fields
          description: "Invalid asset",
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 422]);
        expect(response.body).to.have.property("errors");
      });
    });

    it("DELETE /api/assets/:id - deletes asset", () => {
      cy.request({
        method: "DELETE",
        url: `/api/assets/${assetId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(204);
      });

      // Verify asset is deleted
      cy.request({
        method: "GET",
        url: `/api/assets/${assetId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });
  });

  describe("Beneficiaries API", () => {
    let beneficiaryId: string;

    it("POST /api/beneficiaries - creates beneficiary", () => {
      cy.request({
        method: "POST",
        url: "/api/beneficiaries",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          firstName: "John",
          lastName: "Beneficiary",
          relationship: "spouse",
          percentage: 50,
          email: "john.beneficiary@example.com",
          phone: "+353 85 123 4567",
          address: {
            line1: "456 Beneficiary Street",
            city: "Dublin",
            county: "Dublin",
            eircode: "D02 X123",
            country: "Ireland",
          },
          dateOfBirth: "1985-05-15",
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property("id");
        expect(response.body.firstName).to.eq("John");
        expect(response.body.lastName).to.eq("Beneficiary");
        expect(response.body.percentage).to.eq(50);
        beneficiaryId = response.body.id;
      });
    });

    it("GET /api/beneficiaries - lists beneficiaries", () => {
      cy.request({
        method: "GET",
        url: "/api/beneficiaries",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an("array");
        expect(response.body.length).to.be.greaterThan(0);
      });
    });

    it("PUT /api/beneficiaries/:id - updates beneficiary", () => {
      cy.request({
        method: "PUT",
        url: `/api/beneficiaries/${beneficiaryId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          percentage: 75,
          email: "updated.email@example.com",
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.percentage).to.eq(75);
        expect(response.body.email).to.eq("updated.email@example.com");
      });
    });

    it("POST /api/beneficiaries - validates percentage total", () => {
      // Create second beneficiary that would exceed 100%
      cy.request({
        method: "POST",
        url: "/api/beneficiaries",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          firstName: "Jane",
          lastName: "Beneficiary",
          relationship: "child",
          percentage: 50, // This would make total > 100%
          email: "jane.beneficiary@example.com",
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 422]);
        expect(response.body).to.have.property("error");
        expect(response.body.error).to.include("percentage");
      });
    });

    it("DELETE /api/beneficiaries/:id - deletes beneficiary", () => {
      cy.request({
        method: "DELETE",
        url: `/api/beneficiaries/${beneficiaryId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(204);
      });
    });
  });

  describe("Documents API", () => {
    let documentId: string;

    it("POST /api/documents - uploads document", () => {
      const fileName = "test-document.pdf";
      const fileContent = "Mock PDF content for testing";

      cy.request({
        method: "POST",
        url: "/api/documents/upload",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          fileName,
          fileType: "application/pdf",
          category: "will",
          description: "Test will document",
          fileContent: Buffer.from(fileContent).toString("base64"),
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property("id");
        expect(response.body).to.have.property("fileName", fileName);
        expect(response.body).to.have.property("category", "will");
        documentId = response.body.id;
      });
    });

    it("GET /api/documents - lists user documents", () => {
      cy.request({
        method: "GET",
        url: "/api/documents",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an("array");
        expect(response.body.length).to.be.greaterThan(0);
      });
    });

    it("GET /api/documents/:id/download - downloads document", () => {
      cy.request({
        method: "GET",
        url: `/api/documents/${documentId}/download`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.headers).to.have.property("content-disposition");
      });
    });

    it("DELETE /api/documents/:id - deletes document", () => {
      cy.request({
        method: "DELETE",
        url: `/api/documents/${documentId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(204);
      });
    });
  });

  describe("Will Generation API", () => {
    beforeEach(() => {
      // Setup required data for will generation
      cy.request({
        method: "POST",
        url: "/api/assets",
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          name: "Family Home",
          type: "property",
          value: 400000,
          description: "Primary residence",
        },
      });

      cy.request({
        method: "POST",
        url: "/api/beneficiaries",
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          firstName: "Primary",
          lastName: "Beneficiary",
          relationship: "spouse",
          percentage: 100,
          email: "primary@example.com",
        },
      });
    });

    it("POST /api/will/generate - generates will document", () => {
      cy.request({
        method: "POST",
        url: "/api/will/generate",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: {
          testatorInfo: {
            fullName: "Test Testator",
            address: "123 Test Street, Dublin",
            dateOfBirth: "1980-01-01",
          },
          executors: [
            {
              name: "Executor One",
              address: "456 Executor Street, Dublin",
              relationship: "friend",
            },
          ],
          specialInstructions: "To be buried in family plot",
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("willId");
        expect(response.body).to.have.property("documentUrl");
      });
    });

    it("GET /api/will/preview - previews will content", () => {
      cy.request({
        method: "GET",
        url: "/api/will/preview",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("content");
        expect(response.body.content).to.include("Last Will and Testament");
      });
    });
  });

  describe("Audit and Analytics API", () => {
    it("GET /api/audit - gets audit logs", () => {
      cy.request({
        method: "GET",
        url: "/api/audit",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an("array");

        if (response.body.length > 0) {
          expect(response.body[0]).to.have.property("action");
          expect(response.body[0]).to.have.property("timestamp");
          expect(response.body[0]).to.have.property("userId");
        }
      });
    });

    it("GET /api/analytics/dashboard - gets dashboard analytics", () => {
      cy.request({
        method: "GET",
        url: "/api/analytics/dashboard",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("totalAssets");
        expect(response.body).to.have.property("totalValue");
        expect(response.body).to.have.property("beneficiariesCount");
        expect(response.body).to.have.property("documentsCount");
      });
    });
  });

  describe("Rate Limiting and Security", () => {
    it("handles rate limiting gracefully", () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array.from({ length: 10 }, () =>
        cy.request({
          method: "GET",
          url: "/api/user/profile",
          headers: { Authorization: `Bearer ${authToken}` },
          failOnStatusCode: false,
        }),
      );

      Promise.all(requests).then((responses) => {
        // At least some requests should succeed
        const successfulRequests = responses.filter((r) => r.status === 200);
        expect(successfulRequests.length).to.be.greaterThan(0);

        // Some might be rate limited
        const rateLimitedRequests = responses.filter((r) => r.status === 429);
        if (rateLimitedRequests.length > 0) {
          expect(rateLimitedRequests[0].body).to.have.property("error");
        }
      });
    });

    it("validates request headers", () => {
      cy.request({
        method: "GET",
        url: "/api/user/profile",
        headers: {
          Authorization: "Bearer invalid-token",
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it("prevents SQL injection attempts", () => {
      cy.request({
        method: "GET",
        url: "/api/assets?id=' OR '1'='1",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        // Should handle safely, not return unauthorized data
        expect(response.status).to.be.oneOf([400, 404, 200]);

        if (response.status === 200) {
          // Should return empty array or user's own data only
          expect(response.body).to.be.an("array");
        }
      });
    });
  });

  describe("Error Handling", () => {
    it("returns proper error format", () => {
      cy.request({
        method: "GET",
        url: "/api/nonexistent-endpoint",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body).to.have.property("error");
        expect(response.body).to.have.property("message");
      });
    });

    it("handles malformed JSON gracefully", () => {
      cy.request({
        method: "POST",
        url: "/api/assets",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: "{ invalid json }",
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 422]);
        expect(response.body).to.have.property("error");
      });
    });
  });
});
