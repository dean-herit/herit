"use client";

import { queryOptions, infiniteQueryOptions } from "@tanstack/react-query";

import { Session } from "@/types/auth";
import {
  Asset,
  AssetDocument,
  InheritanceRule,
  RuleAllocation,
} from "@/db/schema";

// Auth Query Options
export const authQueryOptions = {
  session: () =>
    queryOptions({
      queryKey: ["auth", "session"] as const,
      queryFn: async (): Promise<Session> => {
        const response = await fetch("/api/auth/session");

        if (!response.ok) {
          throw new Error("Failed to fetch session");
        }

        const data = await response.json();

        return { user: data.user };
      },
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (previously cacheTime)
    }),

  onboardingStatus: (userId: string) =>
    queryOptions({
      queryKey: ["auth", "onboarding", userId] as const,
      queryFn: async () => {
        const response = await fetch("/api/onboarding/status");

        if (!response.ok) {
          throw new Error("Failed to fetch onboarding status");
        }

        return response.json();
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
      enabled: !!userId,
    }),
};

// Assets Query Options
export const assetsQueryOptions = {
  all: () =>
    queryOptions({
      queryKey: ["assets"] as const,
      queryFn: async (): Promise<Asset[]> => {
        const response = await fetch("/api/assets");

        if (!response.ok) {
          throw new Error("Failed to fetch assets");
        }

        return response.json();
      },
      staleTime: 1000 * 60 * 3, // 3 minutes
    }),

  byId: (assetId: string) =>
    queryOptions({
      queryKey: ["assets", assetId] as const,
      queryFn: async (): Promise<Asset> => {
        const response = await fetch(`/api/assets/${assetId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch asset");
        }

        return response.json();
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      enabled: !!assetId,
    }),

  byType: (assetType: string) =>
    queryOptions({
      queryKey: ["assets", "type", assetType] as const,
      queryFn: async (): Promise<Asset[]> => {
        const response = await fetch(`/api/assets?type=${assetType}`);

        if (!response.ok) {
          throw new Error("Failed to fetch assets by type");
        }

        return response.json();
      },
      staleTime: 1000 * 60 * 3, // 3 minutes
      enabled: !!assetType,
    }),

  infinite: (pageSize: number = 10) =>
    infiniteQueryOptions({
      queryKey: ["assets", "infinite"] as const,
      queryFn: async ({ pageParam = 0 }) => {
        const response = await fetch(
          `/api/assets?page=${pageParam}&limit=${pageSize}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch assets");
        }

        return response.json();
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.hasMore) {
          return allPages.length;
        }

        return undefined;
      },
      staleTime: 1000 * 60 * 3, // 3 minutes
    }),

  categories: () =>
    queryOptions({
      queryKey: ["assets", "categories"] as const,
      queryFn: async () => {
        const response = await fetch("/api/assets/categories");

        if (!response.ok) {
          throw new Error("Failed to fetch asset categories");
        }

        return response.json();
      },
      staleTime: 1000 * 60 * 30, // 30 minutes (categories don't change often)
    }),
};

// Documents Query Options
export const documentsQueryOptions = {
  byAssetId: (assetId: string) =>
    queryOptions({
      queryKey: ["documents", "asset", assetId] as const,
      queryFn: async (): Promise<AssetDocument[]> => {
        const response = await fetch(`/api/assets/${assetId}/documents`);

        if (!response.ok) {
          throw new Error("Failed to fetch asset documents");
        }

        return response.json();
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      enabled: !!assetId,
    }),

  requirements: (assetType: string) =>
    queryOptions({
      queryKey: ["documents", "requirements", assetType] as const,
      queryFn: async () => {
        const response = await fetch(
          `/api/documents/requirements/${assetType}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch document requirements");
        }

        return response.json();
      },
      staleTime: 1000 * 60 * 15, // 15 minutes (requirements don't change often)
      enabled: !!assetType,
    }),

  all: () =>
    queryOptions({
      queryKey: ["documents"] as const,
      queryFn: async (): Promise<AssetDocument[]> => {
        const response = await fetch("/api/documents");

        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }

        return response.json();
      },
      staleTime: 1000 * 60 * 3, // 3 minutes
    }),
};

// Dashboard Query Options
export const dashboardQueryOptions = {
  stats: () =>
    queryOptions({
      queryKey: ["dashboard", "stats"] as const,
      queryFn: async () => {
        const response = await fetch("/api/dashboard/stats");

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }

        return response.json();
      },
      staleTime: 1000 * 60 * 2, // 2 minutes
    }),

  recentActivity: () =>
    queryOptions({
      queryKey: ["dashboard", "recent-activity"] as const,
      queryFn: async () => {
        const response = await fetch("/api/dashboard/recent-activity");

        if (!response.ok) {
          throw new Error("Failed to fetch recent activity");
        }

        return response.json();
      },
      staleTime: 1000 * 60 * 1, // 1 minute
    }),
};

// Will Query Options
export const willQueryOptions = {
  current: () =>
    queryOptions({
      queryKey: ["will", "current"] as const,
      queryFn: async () => {
        const response = await fetch("/api/will");

        if (!response.ok) {
          throw new Error("Failed to fetch will");
        }

        return response.json();
      },
      staleTime: 1000 * 60 * 10, // 10 minutes
    }),

  beneficiaries: () =>
    queryOptions({
      queryKey: ["will", "beneficiaries"] as const,
      queryFn: async () => {
        const response = await fetch("/api/beneficiaries");

        if (!response.ok) {
          throw new Error("Failed to fetch beneficiaries");
        }

        return response.json();
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};

// Rules Query Options
export const rulesQueryOptions = {
  all: () =>
    queryOptions({
      queryKey: ["rules"] as const,
      queryFn: async (): Promise<{
        rules: (InheritanceRule & { allocations: RuleAllocation[] })[];
      }> => {
        const response = await fetch("/api/rules");

        if (!response.ok) {
          throw new Error("Failed to fetch rules");
        }

        return response.json();
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),

  byId: (ruleId: string) =>
    queryOptions({
      queryKey: ["rules", ruleId] as const,
      queryFn: async (): Promise<{
        rule: InheritanceRule & { allocations: RuleAllocation[] };
      }> => {
        const response = await fetch(`/api/rules/${ruleId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch rule");
        }

        return response.json();
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
};
