"use client";

import { useQuery } from "@tanstack/react-query";

import { Asset } from "@/types/assets";

interface DashboardStats {
  totalAssets: number;
  totalValue: number;
  categoryBreakdown: Record<string, number>;
  recentAssets: Asset[];
}

interface DashboardResponse {
  data: {
    summary: {
      assetCount: number;
      totalValue: number;
      categoryBreakdown: Record<string, number>;
    };
    assets: Asset[];
  };
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const response = await fetch(
        "/api/assets?limit=5&sort_by=created_at&sort_order=desc",
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const data: DashboardResponse = await response.json();

      return {
        totalAssets: data.data.summary.assetCount,
        totalValue: data.data.summary.totalValue,
        categoryBreakdown: data.data.summary.categoryBreakdown,
        recentAssets: data.data.assets.slice(0, 3), // Show only 3 most recent
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes for more real-time feel
    refetchOnWindowFocus: false,
  });
}

export function useBeneficiaryCount() {
  return useQuery<number>({
    queryKey: ["beneficiaries", "count"],
    queryFn: async () => {
      const response = await fetch("/api/beneficiaries/count");

      if (!response.ok) {
        throw new Error("Failed to fetch beneficiary count");
      }

      const data = await response.json();

      return data.count || 0;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useWillStatus() {
  return useQuery<{ hasWill: boolean; status?: string }>({
    queryKey: ["will", "status"],
    queryFn: async () => {
      const response = await fetch("/api/will/status");

      if (!response.ok) {
        if (response.status === 404) {
          return { hasWill: false };
        }
        throw new Error("Failed to fetch will status");
      }

      const data = await response.json();

      return {
        hasWill: data.hasWill,
        status: data.status,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
