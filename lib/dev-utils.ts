"use client";

import { useQueryClient } from "@tanstack/react-query";

// Development utilities for debugging queries and mutations
export function useQueryDebugger() {
  const queryClient = useQueryClient();

  return {
    // Log all queries and their states
    logAllQueries: () => {
      const queries = queryClient.getQueryCache().getAll();

      console.group("🔍 Active Queries");
      queries.forEach((query) => {
        console.log({
          key: query.queryKey,
          state: query.state.status,
          dataUpdatedAt: new Date(query.state.dataUpdatedAt),
          isFetching: query.state.fetchStatus === "fetching",
          isStale: query.isStale(),
          data: query.state.data,
        });
      });
      console.groupEnd();
    },

    // Log queries by key pattern
    logQueriesByKey: (keyPattern: string) => {
      const queries = queryClient.getQueryCache().getAll();
      const matchingQueries = queries.filter((query) =>
        JSON.stringify(query.queryKey).includes(keyPattern),
      );

      console.group(`🔍 Queries matching "${keyPattern}"`);
      matchingQueries.forEach((query) => {
        console.log({
          key: query.queryKey,
          state: query.state.status,
          data: query.state.data,
        });
      });
      console.groupEnd();
    },

    // Log mutations
    logAllMutations: () => {
      const mutations = queryClient.getMutationCache().getAll();

      console.group("🚀 Active Mutations");
      mutations.forEach((mutation) => {
        console.log({
          key: mutation.options.mutationKey,
          state: mutation.state.status,
          variables: mutation.state.variables,
          data: mutation.state.data,
          error: mutation.state.error,
        });
      });
      console.groupEnd();
    },

    // Clear specific query
    clearQuery: (queryKey: unknown[]) => {
      queryClient.removeQueries({ queryKey });
      console.log(`🗑️ Cleared query:`, queryKey);
    },

    // Invalidate specific query
    invalidateQuery: (queryKey: unknown[]) => {
      queryClient.invalidateQueries({ queryKey });
      console.log(`🔄 Invalidated query:`, queryKey);
    },

    // Force refresh specific query
    refetchQuery: (queryKey: unknown[]) => {
      queryClient.refetchQueries({ queryKey });
      console.log(`🔄 Refetching query:`, queryKey);
    },

    // Log query cache size and memory usage
    logCacheStats: () => {
      const queries = queryClient.getQueryCache().getAll();
      const mutations = queryClient.getMutationCache().getAll();

      console.group("📊 Cache Statistics");
      console.log(`Active queries: ${queries.length}`);
      console.log(`Active mutations: ${mutations.length}`);
      console.log(`Cache size estimation:`, {
        queries: queries.reduce(
          (acc, query) => acc + JSON.stringify(query.state.data || {}).length,
          0,
        ),
        mutations: mutations.reduce(
          (acc, mutation) =>
            acc + JSON.stringify(mutation.state.data || {}).length,
          0,
        ),
      });
      console.groupEnd();
    },
  };
}

// Performance monitoring utilities
export function usePerformanceMonitor() {
  return {
    // Time a query operation
    timeQuery: async <T>(queryKey: unknown[], queryFn: () => Promise<T>) => {
      const start = performance.now();

      try {
        const result = await queryFn();
        const duration = performance.now() - start;

        console.log(
          `⏱️ Query ${JSON.stringify(queryKey)} completed in ${duration.toFixed(2)}ms`,
        );

        return result;
      } catch (error) {
        const duration = performance.now() - start;

        console.error(
          `❌ Query ${JSON.stringify(queryKey)} failed after ${duration.toFixed(2)}ms:`,
          error,
        );
        throw error;
      }
    },

    // Monitor component render performance
    logRenderTime: (componentName: string) => {
      const start = performance.now();

      return () => {
        const duration = performance.now() - start;

        if (duration > 100) {
          // Only log slow renders
          console.warn(
            `🐌 Slow render: ${componentName} took ${duration.toFixed(2)}ms`,
          );
        }
      };
    },

    // Track query performance over time
    trackQueryPerformance: () => {
      const performanceData = new Map<string, number[]>();

      return {
        record: (queryKey: unknown[], duration: number) => {
          const key = JSON.stringify(queryKey);

          if (!performanceData.has(key)) {
            performanceData.set(key, []);
          }
          performanceData.get(key)!.push(duration);
        },

        getStats: (queryKey: unknown[]) => {
          const key = JSON.stringify(queryKey);
          const durations = performanceData.get(key) || [];

          if (durations.length === 0) return null;

          const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
          const min = Math.min(...durations);
          const max = Math.max(...durations);

          return { avg, min, max, count: durations.length };
        },

        logAllStats: () => {
          console.group("📈 Query Performance Stats");
          for (const [key, durations] of performanceData.entries()) {
            const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

            console.log(
              `${key}: avg ${avg.toFixed(2)}ms (${durations.length} calls)`,
            );
          }
          console.groupEnd();
        },
      };
    },
  };
}

// Development-only query devtools enhancement
export function enhanceQueryDevtools() {
  if (process.env.NODE_ENV !== "development") return;

  // Add global debugging functions
  (window as any).queryDebug = {
    client: null as any,
    init: (queryClient: any) => {
      (window as any).queryDebug.client = queryClient;
      console.log(
        "🔧 Query debugger initialized. Use queryDebug.* methods in console.",
      );
    },
    queries: () => (window as any).queryDebug.client?.getQueryCache().getAll(),
    mutations: () =>
      (window as any).queryDebug.client?.getMutationCache().getAll(),
    clear: (key: unknown[]) =>
      (window as any).queryDebug.client?.removeQueries({ queryKey: key }),
    invalidate: (key: unknown[]) =>
      (window as any).queryDebug.client?.invalidateQueries({ queryKey: key }),
    refetch: (key: unknown[]) =>
      (window as any).queryDebug.client?.refetchQueries({ queryKey: key }),
  };
}

// Error boundary debugging
export function logErrorBoundaryInfo(error: Error, errorInfo?: any) {
  if (process.env.NODE_ENV === "development") {
    console.group("🚨 Error Boundary Caught Error");
    console.error("Error:", error);
    console.error("Error Info:", errorInfo);
    console.error("Stack Trace:", error.stack);
    console.groupEnd();
  }
}

// Component prop validation (development only)
export function validateProps<T extends Record<string, any>>(
  componentName: string,
  props: T,
  schema: Record<keyof T, (value: any) => boolean>,
) {
  if (process.env.NODE_ENV !== "development") return;

  for (const [key, validator] of Object.entries(schema)) {
    const value = props[key];

    if (!validator(value)) {
      console.warn(`⚠️ ${componentName}: Invalid prop "${key}"`, value);
    }
  }
}
