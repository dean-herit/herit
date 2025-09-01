/**
 * Dependency Injection Example
 * Demonstrates how to make components more testable by injecting dependencies
 */

import React from "react";

// =============================================================================
// SERVICES (DEPENDENCIES TO INJECT)
// =============================================================================

export interface AuthService {
  getCurrentUser: () => Promise<{ id: string; name: string } | null>;
  logout: () => Promise<void>;
}

export interface ApiService {
  post: (url: string, data: any) => Promise<any>;
  get: (url: string) => Promise<any>;
}

export interface StorageService {
  setItem: (key: string, value: string) => void;
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
}

// Default implementations (production services)
const defaultAuthService: AuthService = {
  getCurrentUser: async () => {
    const response = await fetch("/api/auth/me");

    if (!response.ok) return null;

    return response.json();
  },
  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
  },
};

const defaultApiService: ApiService = {
  post: async (url, data) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return response.json();
  },
  get: async (url) => {
    const response = await fetch(url);

    return response.json();
  },
};

const defaultStorageService: StorageService = {
  setItem: (key, value) => localStorage.setItem(key, value),
  getItem: (key) => localStorage.getItem(key),
  removeItem: (key) => localStorage.removeItem(key),
};

// =============================================================================
// CONTEXT FOR DEPENDENCY INJECTION
// =============================================================================

interface ServiceContext {
  authService: AuthService;
  apiService: ApiService;
  storageService: StorageService;
}

const ServicesContext = React.createContext<ServiceContext>({
  authService: defaultAuthService,
  apiService: defaultApiService,
  storageService: defaultStorageService,
});

export const ServicesProvider: React.FC<{
  children: React.ReactNode;
  services?: Partial<ServiceContext>;
}> = ({ children, services = {} }) => {
  const contextValue: ServiceContext = {
    authService: services.authService || defaultAuthService,
    apiService: services.apiService || defaultApiService,
    storageService: services.storageService || defaultStorageService,
  };

  return (
    <ServicesContext.Provider value={contextValue}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => React.useContext(ServicesContext);

// =============================================================================
// EXAMPLE COMPONENT USING DEPENDENCY INJECTION
// =============================================================================

interface UserProfileProps {
  onLogout?: () => void;
  // No direct service dependencies in props!
}

export const UserProfile: React.FC<UserProfileProps> = ({ onLogout }) => {
  const { authService, apiService, storageService } = useServices();
  const [user, setUser] = React.useState<{ id: string; name: string } | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use injected auth service
      const currentUser = await authService.getCurrentUser();

      setUser(currentUser);

      // Store in local storage using injected storage service
      if (currentUser) {
        storageService.setItem("lastUser", currentUser.name);
      }
    } catch (err) {
      setError("Failed to load user profile");
      console.error("User load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);

      // Use injected auth service
      await authService.logout();

      // Clear storage using injected service
      storageService.removeItem("lastUser");

      setUser(null);
      onLogout?.();
    } catch (err) {
      setError("Logout failed");
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (newName: string) => {
    if (!user) return;

    try {
      setLoading(true);

      // Use injected API service
      const updatedUser = await apiService.post("/api/user/profile", {
        name: newName,
      });

      setUser(updatedUser);
      storageService.setItem("lastUser", updatedUser.name);
    } catch (err) {
      setError("Failed to update profile");
      console.error("Profile update error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4" data-testid="loading-state">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 bg-red-50 border border-red-200 rounded"
        data-testid="error-state"
      >
        <p className="text-red-700" data-testid="error-message">
          {error}
        </p>
        <button
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          data-testid="retry-button"
          onClick={loadUser}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4" data-testid="no-user-state">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div
      className="p-4 bg-white border rounded shadow"
      data-testid="user-profile"
    >
      <h2 className="text-xl font-semibold mb-4">User Profile</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name:
          </label>
          <div className="flex gap-2 mt-1">
            <input
              className="flex-1 border border-gray-300 rounded px-3 py-2"
              data-testid="name-input"
              defaultValue={user.name}
              type="text"
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              data-testid="update-name-button"
              disabled={loading}
              onClick={(e) => {
                const input = e.currentTarget
                  .previousElementSibling as HTMLInputElement;

                updateProfile(input.value);
              }}
            >
              Update
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600">
            User ID: <span data-testid="user-id">{user.id}</span>
          </p>
        </div>

        <div className="pt-4 border-t">
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            data-testid="logout-button"
            disabled={loading}
            onClick={handleLogout}
          >
            {loading ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// EXAMPLE HOOK USING DEPENDENCY INJECTION
// =============================================================================

export const useUserData = () => {
  const { authService, storageService } = useServices();
  const [user, setUser] = React.useState<{ id: string; name: string } | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);

  const loadUser = React.useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();

      setUser(currentUser);

      // Cache in storage
      if (currentUser) {
        storageService.setItem("user-cache", JSON.stringify(currentUser));
      }
    } catch (error) {
      // Try to load from cache
      const cached = storageService.getItem("user-cache");

      if (cached) {
        setUser(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  }, [authService, storageService]);

  React.useEffect(() => {
    loadUser();
  }, [loadUser]);

  return { user, loading, refetch: loadUser };
};
