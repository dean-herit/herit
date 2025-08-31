"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";

import { Asset } from "@/types/assets";
import { assetsQueryOptions } from "@/lib/query-options";
import { apiRequest } from "@/lib/query-error-handling";

interface AssetsSummary {
  totalValue: number;
  assetCount: number;
  categoryBreakdown: Record<string, number>;
}

interface AssetsResponse {
  data: {
    assets: Asset[];
    summary: AssetsSummary;
  };
}

interface AssetsQueryParams {
  search?: string;
  category?: string;
  sort_by?: string;
  sort_order?: string;
  limit?: string;
}

interface CreateAssetData {
  name: string;
  assetType: string;
  estimatedValue: number;
  description?: string;
  // Additional fields based on asset type
  [key: string]: any;
}

export function useAssets(params: AssetsQueryParams = {}) {
  const hasParams = Object.keys(params).length > 0;

  // Always call both hooks but conditionally enable them
  const allAssetsQuery = useQuery({
    ...assetsQueryOptions.all(),
    enabled: !hasParams,
    select: (data) => ({ data: { assets: data, summary: null } }),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

  const filteredAssetsQuery = useQuery<AssetsResponse>({
    queryKey: ["assets", "filtered", params],
    enabled: hasParams,
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        search: params.search || "",
        category: params.category || "",
        sort_by: params.sort_by || "created_at",
        sort_order: params.sort_order || "desc",
        limit: params.limit || "50",
      });

      return apiRequest<AssetsResponse>(`/api/assets?${searchParams}`);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

  // Return the appropriate query based on whether params are provided
  return hasParams ? filteredAssetsQuery : allAssetsQuery;
}

// Infinite query for paginated assets
export function useInfiniteAssets(pageSize: number = 10) {
  return useInfiniteQuery(assetsQueryOptions.infinite(pageSize));
}

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetData: CreateAssetData): Promise<Asset> => {
      return apiRequest<Asset>("/api/assets", {
        method: "POST",
        body: JSON.stringify(assetData),
      });
    },
    onMutate: async (newAsset) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["assets"] });

      // Snapshot previous value
      const previousAssets = queryClient.getQueryData<Asset[]>(["assets"]);

      // Optimistically update to show the new asset immediately
      if (previousAssets) {
        const optimisticAsset = {
          id: `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: newAsset.name,
          asset_type: newAsset.asset_type || "personal",
          value: newAsset.estimatedValue || 0,
          description: newAsset.description || null,
          user_email: "", // Will be populated by server
          account_number: null,
          bank_name: null,
          property_address: null,
          status: "pending", // Mark as pending to distinguish from real assets
          created_at: new Date(),
          updated_at: new Date(),
        } as Asset;

        queryClient.setQueryData<Asset[]>(
          ["assets"],
          [optimisticAsset, ...previousAssets],
        );
      }

      // Return context with previous data for rollback
      return { previousAssets };
    },
    onError: (err, newAsset, context) => {
      // Rollback to previous data on error
      if (context?.previousAssets) {
        queryClient.setQueryData(["assets"], context.previousAssets);
      }
    },
    onSettled: () => {
      // Always refetch after mutation (success or error)
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      return apiRequest(`/api/assets/${assetId}`, {
        method: "DELETE",
      });
    },
    onMutate: async (assetId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["assets"] });

      // Snapshot previous value
      const previousAssets = queryClient.getQueryData<Asset[]>(["assets"]);

      // Optimistically remove asset from list
      if (previousAssets) {
        const updatedAssets = previousAssets.filter(
          (asset) => asset.id !== assetId,
        );

        queryClient.setQueryData<Asset[]>(["assets"], updatedAssets);
      }

      return { previousAssets };
    },
    onError: (err, assetId, context) => {
      // Rollback on error
      if (context?.previousAssets) {
        queryClient.setQueryData(["assets"], context.previousAssets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assetId,
      updateData,
    }: {
      assetId: string;
      updateData: Partial<CreateAssetData>;
    }): Promise<Asset> => {
      return apiRequest<Asset>(`/api/assets/${assetId}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });
    },
    onMutate: async ({ assetId, updateData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["assets"] });

      // Snapshot previous value
      const previousAssets = queryClient.getQueryData<Asset[]>(["assets"]);

      // Optimistically update the asset
      if (previousAssets) {
        const updatedAssets = previousAssets.map((asset) =>
          asset.id === assetId
            ? {
                ...asset,
                name: updateData.name ?? asset.name,
                value: updateData.estimatedValue ?? asset.value,
                description: updateData.description ?? asset.description,
                updated_at: new Date(),
              }
            : asset,
        );

        queryClient.setQueryData<Asset[]>(["assets"], updatedAssets);
      }

      return { previousAssets };
    },
    onError: (err, { assetId }, context) => {
      // Rollback on error
      if (context?.previousAssets) {
        queryClient.setQueryData(["assets"], context.previousAssets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
