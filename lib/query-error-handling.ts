import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";

// Custom error types for better error handling
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(message: string = "Network connection failed") {
    super(message);
    this.name = "NetworkError";
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

// Enhanced fetch wrapper with proper error handling
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new AuthenticationError(
          errorData.message || "Authentication required",
        );
      }

      throw new ApiError(
        response.status,
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        errorData.code,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError || error instanceof AuthenticationError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new NetworkError("Unable to connect to server");
    }

    throw error;
  }
}

// Query client with enhanced error handling
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        console.error(
          `Query failed for key: ${JSON.stringify(query.queryKey)}`,
          error,
        );

        // Handle authentication errors globally
        if (error instanceof AuthenticationError) {
          // Redirect to login or show auth modal
          window.location.href = "/login";
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, context, mutation) => {
        console.error("Mutation failed:", mutation.options.mutationKey, error);

        // Handle authentication errors globally
        if (error instanceof AuthenticationError) {
          window.location.href = "/login";
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Don't retry on authentication errors
          if (error instanceof AuthenticationError) {
            return false;
          }

          // Don't retry on client errors (4xx)
          if (
            error instanceof ApiError &&
            error.status >= 400 &&
            error.status < 500
          ) {
            return false;
          }

          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: (failureCount, error) => {
          // Don't retry mutations on authentication errors
          if (error instanceof AuthenticationError) {
            return false;
          }

          // Don't retry on client errors
          if (
            error instanceof ApiError &&
            error.status >= 400 &&
            error.status < 500
          ) {
            return false;
          }

          // Retry once for network errors
          return failureCount < 1;
        },
      },
    },
  });
}

// Error message helper
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof NetworkError) {
    return "Unable to connect to server. Please check your internet connection.";
  }

  if (error instanceof AuthenticationError) {
    return "Please log in to continue.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (error instanceof AuthenticationError) {
    return ErrorSeverity.HIGH;
  }

  if (error instanceof ApiError) {
    if (error.status >= 500) {
      return ErrorSeverity.HIGH;
    }
    if (error.status >= 400) {
      return ErrorSeverity.MEDIUM;
    }
  }

  if (error instanceof NetworkError) {
    return ErrorSeverity.MEDIUM;
  }

  return ErrorSeverity.LOW;
}

// Hook for handling query errors in components
export function useQueryErrorHandler() {
  return {
    getErrorMessage,
    getErrorSeverity,
    isRetriableError: (error: unknown) => {
      return (
        !(error instanceof AuthenticationError) &&
        !(
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        )
      );
    },
  };
}
