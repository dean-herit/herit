"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { LoginCredentials, SignupCredentials } from "@/types/auth";
import { authQueryOptions } from "@/lib/query-options";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get current session using queryOptions factory
  const {
    data: session,
    isLoading: isSessionLoading,
    error: sessionError,
    refetch: refetchSession,
  } = useQuery(authQueryOptions.session());

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.message || "Login failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "session"], { user: data.user });

      // Route based on onboarding status
      if (data.user?.onboarding_completed) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (credentials: SignupCredentials) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.message || "Signup failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "session"], { user: data.user });
      router.push("/onboarding");
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Immediately clear the session cache before making the API call
      queryClient.setQueryData(["auth", "session"], { user: null });
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      return response.json();
    },
    onSuccess: () => {
      // Ensure cache is cleared and invalidated
      queryClient.removeQueries({ queryKey: ["auth"] });
      router.push("/login");
    },
  });

  // Token refresh mutation (for automatic token refresh)
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "session"], { user: data.user });
    },
    onError: () => {
      // If refresh fails, clear session and redirect to login
      queryClient.setQueryData(["auth", "session"], { user: null });
      router.push("/login");
    },
  });

  return {
    // Session data
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isSessionLoading,
    sessionError,
    refetchSession,

    // Auth actions
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout: logoutMutation.mutate,
    refreshToken: refreshMutation.mutate,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRefreshing: refreshMutation.isPending,
    loginError: loginMutation.error?.message,
    signupError: signupMutation.error?.message,
    logoutError: logoutMutation.error?.message,
    refreshError: refreshMutation.error?.message,
  };
}
