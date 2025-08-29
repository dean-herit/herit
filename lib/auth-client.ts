"use client";

/**
 * Client-side authentication utilities
 */

import type { User } from "@/db/schema";

// Use database schema as single source of truth for AuthUser
export type AuthUser = User;

export interface SessionResponse {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshToken(): Promise<SessionResponse | null> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
    });

    if (!response.ok) {
      console.warn("Token refresh failed:", response.status);

      return null;
    }

    const data = await response.json();

    return {
      user: data.user,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error("Token refresh error:", error);

    return null;
  }
}

/**
 * Get current session, with automatic refresh if needed
 */
export async function getSessionWithRefresh(): Promise<SessionResponse> {
  try {
    // First, try to get the current session
    const sessionResponse = await fetch("/api/auth/session", {
      credentials: "same-origin",
    });

    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();

      if (sessionData.isAuthenticated) {
        return sessionData;
      }
    }

    // If session is not valid, try to refresh
    const refreshResult = await refreshToken();

    if (refreshResult) {
      return refreshResult;
    }

    // If refresh also fails, user is not authenticated
    return { user: null, isAuthenticated: false };
  } catch (error) {
    console.error("Session check error:", error);

    return { user: null, isAuthenticated: false };
  }
}

/**
 * Logout the user
 */
export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });

    // Redirect to login page
    window.location.href = "/login";
  } catch (error) {
    console.error("Logout error:", error);
    // Still redirect even if the server call fails
    window.location.href = "/login";
  }
}

/**
 * Enhanced fetch that automatically handles token refresh
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  // First attempt
  let response = await fetch(url, {
    ...options,
    credentials: "same-origin",
  });

  // If we get a 401, try to refresh and retry once
  if (response.status === 401) {
    const refreshResult = await refreshToken();

    if (refreshResult) {
      // Retry the original request
      response = await fetch(url, {
        ...options,
        credentials: "same-origin",
      });
    }
  }

  return response;
}
