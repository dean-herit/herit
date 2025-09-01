/**
 * Dependency Injection Testing Example
 * Demonstrates how to test components with injected dependencies
 */

import React from "react";

import { TestUtils } from "../../../cypress/support/test-utils";

import {
  UserProfile,
  ServicesProvider,
  AuthService,
  ApiService,
  StorageService,
  useUserData,
} from "./DependencyInjectionExample";

// =============================================================================
// MOCK SERVICES FOR TESTING
// =============================================================================

const createMockAuthService = (
  options: {
    user?: { id: string; name: string } | null;
    logoutSuccess?: boolean;
    shouldThrow?: boolean;
  } = {},
): AuthService => ({
  getCurrentUser: cy
    .stub()
    .as("getCurrentUser")
    .resolves(
      options.shouldThrow
        ? Promise.reject(new Error("Auth error"))
        : options.user || { id: "123", name: "Test User" },
    ),
  logout: cy
    .stub()
    .as("logout")
    .resolves(
      options.logoutSuccess !== false
        ? Promise.resolve()
        : Promise.reject(new Error("Logout failed")),
    ),
});

const createMockApiService = (
  options: {
    shouldThrow?: boolean;
    response?: any;
  } = {},
): ApiService => ({
  post: cy
    .stub()
    .as("apiPost")
    .resolves(
      options.shouldThrow
        ? Promise.reject(new Error("API error"))
        : options.response || { id: "123", name: "Updated User" },
    ),
  get: cy
    .stub()
    .as("apiGet")
    .resolves(options.response || { data: "test" }),
});

const createMockStorageService = (): StorageService => {
  const storage = new Map<string, string>();

  return {
    setItem: cy
      .stub()
      .as("storageSetItem")
      .callsFake((key: string, value: string) => {
        storage.set(key, value);
      }),
    getItem: cy
      .stub()
      .as("storageGetItem")
      .callsFake((key: string) => {
        return storage.get(key) || null;
      }),
    removeItem: cy
      .stub()
      .as("storageRemoveItem")
      .callsFake((key: string) => {
        storage.delete(key);
      }),
  };
};

// =============================================================================
// TEST WRAPPER COMPONENT
// =============================================================================

const TestWrapper: React.FC<{
  children: React.ReactNode;
  authService?: AuthService;
  apiService?: ApiService;
  storageService?: StorageService;
}> = ({ children, authService, apiService, storageService }) => (
  <ServicesProvider
    services={{
      authService,
      apiService,
      storageService,
    }}
  >
    {children}
  </ServicesProvider>
);

describe("UserProfile with Dependency Injection", () => {
  const callbacks = TestUtils.createMockCallbacks();

  beforeEach(() => {
    Object.values(callbacks).forEach((stub) => stub.reset?.());
  });

  describe("Successful User Loading", () => {
    it("should load and display user profile", async () => {
      const mockUser = { id: "123", name: "John Doe" };
      const authService = createMockAuthService({ user: mockUser });
      const storageService = createMockStorageService();

      cy.mount(
        <TestWrapper authService={authService} storageService={storageService}>
          <UserProfile onLogout={callbacks.onLogout} />
        </TestWrapper>,
      );

      // Should start in loading state
      cy.get('[data-testid="loading-state"]').should("be.visible");

      // Should load user and display profile
      cy.get('[data-testid="user-profile"]').should("be.visible");
      cy.get('[data-testid="name-input"]').should("have.value", mockUser.name);
      cy.get('[data-testid="user-id"]').should("contain", mockUser.id);

      // Should call auth service
      cy.get("@getCurrentUser").should("have.been.called");

      // Should store user in local storage
      cy.get("@storageSetItem").should(
        "have.been.calledWith",
        "lastUser",
        mockUser.name,
      );
    });
  });

  describe("Error States", () => {
    it("should handle auth service errors", () => {
      const authService = createMockAuthService({ shouldThrow: true });

      cy.mount(
        <TestWrapper authService={authService}>
          <UserProfile onLogout={callbacks.onLogout} />
        </TestWrapper>,
      );

      // Should show error state
      cy.get('[data-testid="error-state"]').should("be.visible");
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "Failed to load user profile",
      );
      cy.get('[data-testid="retry-button"]').should("be.visible");
    });

    it("should handle logout errors", async () => {
      const mockUser = { id: "123", name: "John Doe" };
      const authService = createMockAuthService({
        user: mockUser,
        logoutSuccess: false,
      });

      cy.mount(
        <TestWrapper authService={authService}>
          <UserProfile onLogout={callbacks.onLogout} />
        </TestWrapper>,
      );

      // Wait for user to load
      cy.get('[data-testid="user-profile"]').should("be.visible");

      // Attempt logout
      cy.get('[data-testid="logout-button"]').click();

      // Should show error
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "Logout failed",
      );

      // onLogout callback should not be called on error
      cy.get("@onLogout").should("not.have.been.called");
    });
  });

  describe("Profile Updates", () => {
    it("should update user profile via API", async () => {
      const mockUser = { id: "123", name: "John Doe" };
      const updatedUser = { id: "123", name: "Jane Doe" };

      const authService = createMockAuthService({ user: mockUser });
      const apiService = createMockApiService({ response: updatedUser });
      const storageService = createMockStorageService();

      cy.mount(
        <TestWrapper
          apiService={apiService}
          authService={authService}
          storageService={storageService}
        >
          <UserProfile onLogout={callbacks.onLogout} />
        </TestWrapper>,
      );

      // Wait for profile to load
      cy.get('[data-testid="user-profile"]').should("be.visible");

      // Update name
      cy.get('[data-testid="name-input"]').clear().type("Jane Doe");
      cy.get('[data-testid="update-name-button"]').click();

      // Should call API service
      cy.get("@apiPost").should("have.been.calledWith", "/api/user/profile", {
        name: "Jane Doe",
      });

      // Should update storage
      cy.get("@storageSetItem").should(
        "have.been.calledWith",
        "lastUser",
        "Jane Doe",
      );
    });

    it("should handle API update errors", async () => {
      const mockUser = { id: "123", name: "John Doe" };
      const authService = createMockAuthService({ user: mockUser });
      const apiService = createMockApiService({ shouldThrow: true });

      cy.mount(
        <TestWrapper apiService={apiService} authService={authService}>
          <UserProfile onLogout={callbacks.onLogout} />
        </TestWrapper>,
      );

      cy.get('[data-testid="user-profile"]').should("be.visible");

      // Try to update
      cy.get('[data-testid="name-input"]').clear().type("New Name");
      cy.get('[data-testid="update-name-button"]').click();

      // Should show error
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "Failed to update profile",
      );
    });
  });

  describe("Successful Logout Flow", () => {
    it("should logout user and call callback", async () => {
      const mockUser = { id: "123", name: "John Doe" };
      const authService = createMockAuthService({ user: mockUser });
      const storageService = createMockStorageService();

      cy.mount(
        <TestWrapper authService={authService} storageService={storageService}>
          <UserProfile onLogout={callbacks.onLogout} />
        </TestWrapper>,
      );

      cy.get('[data-testid="user-profile"]').should("be.visible");

      // Logout
      cy.get('[data-testid="logout-button"]').click();

      // Should call services
      cy.get("@logout").should("have.been.called");
      cy.get("@storageRemoveItem").should("have.been.calledWith", "lastUser");

      // Should call callback
      cy.get("@onLogout").should("have.been.called");

      // Should show no user state
      cy.get('[data-testid="no-user-state"]').should("be.visible");
    });
  });

  describe("No User State", () => {
    it("should handle no user scenario", () => {
      const authService = createMockAuthService({ user: null });

      cy.mount(
        <TestWrapper authService={authService}>
          <UserProfile onLogout={callbacks.onLogout} />
        </TestWrapper>,
      );

      cy.get('[data-testid="no-user-state"]').should("be.visible");
      cy.get('[data-testid="no-user-state"]').should(
        "contain",
        "Please log in",
      );
    });
  });

  describe("Loading States", () => {
    it("should show loading during operations", () => {
      const mockUser = { id: "123", name: "John Doe" };

      // Create auth service that doesn't resolve immediately
      const authService: AuthService = {
        getCurrentUser: cy
          .stub()
          .as("getCurrentUser")
          .returns(
            new Promise((resolve) => {
              // Don't resolve immediately
              setTimeout(() => resolve(mockUser), 1000);
            }),
          ),
        logout: cy.stub().as("logout").resolves(),
      };

      cy.mount(
        <TestWrapper authService={authService}>
          <UserProfile onLogout={callbacks.onLogout} />
        </TestWrapper>,
      );

      // Should show loading state initially
      cy.get('[data-testid="loading-state"]').should("be.visible");
      cy.get('[data-testid="user-profile"]').should("not.exist");
    });
  });

  describe("Retry Functionality", () => {
    it("should allow retry after error", () => {
      let shouldThrow = true;
      const mockUser = { id: "123", name: "John Doe" };

      const authService: AuthService = {
        getCurrentUser: cy
          .stub()
          .as("getCurrentUser")
          .callsFake(() => {
            if (shouldThrow) {
              shouldThrow = false; // Next call will succeed

              return Promise.reject(new Error("Network error"));
            }

            return Promise.resolve(mockUser);
          }),
        logout: cy.stub().as("logout").resolves(),
      };

      cy.mount(
        <TestWrapper authService={authService}>
          <UserProfile onLogout={callbacks.onLogout} />
        </TestWrapper>,
      );

      // Should show error initially
      cy.get('[data-testid="error-state"]').should("be.visible");

      // Retry should succeed
      cy.get('[data-testid="retry-button"]').click();

      // Should now show user profile
      cy.get('[data-testid="user-profile"]').should("be.visible");
      cy.get('[data-testid="name-input"]').should("have.value", mockUser.name);
    });
  });

  describe("Accessibility and Performance", () => {
    it("should be accessible", () => {
      const mockUser = { id: "123", name: "John Doe" };
      const authService = createMockAuthService({ user: mockUser });

      cy.mount(
        <TestWrapper authService={authService}>
          <UserProfile onLogout={callbacks.onLogout} />
        </TestWrapper>,
      );

      cy.get('[data-testid="user-profile"]').should("be.visible");
      TestUtils.testAccessibility('[data-testid="user-profile"]');
    });

    it("should render quickly", () => {
      const mockUser = { id: "123", name: "John Doe" };
      const authService = createMockAuthService({ user: mockUser });

      TestUtils.measureRenderTime('[data-testid="user-profile"]', 1000);

      cy.mount(
        <TestWrapper authService={authService}>
          <UserProfile onLogout={callbacks.onLogout} />
        </TestWrapper>,
      );
    });

    it("should be responsive", () => {
      const mockUser = { id: "123", name: "John Doe" };
      const authService = createMockAuthService({ user: mockUser });

      cy.mount(
        <TestWrapper authService={authService}>
          <UserProfile onLogout={callbacks.onLogout} />
        </TestWrapper>,
      );

      cy.get('[data-testid="user-profile"]').should("be.visible");

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="user-profile"]').should("be.visible");
        cy.get('[data-testid="name-input"]').should("be.visible");
        cy.get('[data-testid="logout-button"]').should("be.visible");
      });
    });
  });
});

// =============================================================================
// CUSTOM HOOK TESTING
// =============================================================================

function TestHookComponent() {
  const { user, loading, refetch } = useUserData();

  return (
    <div data-testid="hook-test-component">
      {loading && <div data-testid="hook-loading">Loading...</div>}
      {user && (
        <div data-testid="hook-user-data">
          <span data-testid="hook-user-name">{user.name}</span>
          <span data-testid="hook-user-id">{user.id}</span>
        </div>
      )}
      <button data-testid="hook-refetch" onClick={refetch}>
        Refetch
      </button>
    </div>
  );
}

describe("useUserData Hook", () => {
  it("should load user data", () => {
    const mockUser = { id: "456", name: "Hook User" };
    const authService = createMockAuthService({ user: mockUser });
    const storageService = createMockStorageService();

    cy.mount(
      <TestWrapper authService={authService} storageService={storageService}>
        <TestHookComponent />
      </TestWrapper>,
    );

    cy.get('[data-testid="hook-user-data"]').should("be.visible");
    cy.get('[data-testid="hook-user-name"]').should("contain", mockUser.name);
    cy.get('[data-testid="hook-user-id"]').should("contain", mockUser.id);

    // Should cache in storage
    cy.get("@storageSetItem").should(
      "have.been.calledWith",
      "user-cache",
      JSON.stringify(mockUser),
    );
  });

  it("should fall back to cached data on error", () => {
    const cachedUser = { id: "789", name: "Cached User" };

    const authService = createMockAuthService({ shouldThrow: true });
    const storageService: StorageService = {
      setItem: cy.stub().as("storageSetItem"),
      removeItem: cy.stub().as("storageRemoveItem"),
      getItem: cy
        .stub()
        .as("storageGetItem")
        .returns(JSON.stringify(cachedUser)),
    };

    cy.mount(
      <TestWrapper authService={authService} storageService={storageService}>
        <TestHookComponent />
      </TestWrapper>,
    );

    // Should show cached user data
    cy.get('[data-testid="hook-user-data"]').should("be.visible");
    cy.get('[data-testid="hook-user-name"]').should("contain", cachedUser.name);
    cy.get("@storageGetItem").should("have.been.calledWith", "user-cache");
  });

  it("should support refetch functionality", () => {
    const mockUser = { id: "456", name: "Hook User" };
    const authService = createMockAuthService({ user: mockUser });

    cy.mount(
      <TestWrapper authService={authService}>
        <TestHookComponent />
      </TestWrapper>,
    );

    // Initial load
    cy.get('[data-testid="hook-user-data"]').should("be.visible");
    cy.get("@getCurrentUser").should("have.been.calledOnce");

    // Refetch
    cy.get('[data-testid="hook-refetch"]').click();
    cy.get("@getCurrentUser").should("have.been.calledTwice");
  });
});
