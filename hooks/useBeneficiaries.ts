import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  BeneficiaryFormData,
  BeneficiaryListResponse,
  BeneficiarySearchParams,
  BeneficiaryWithPhoto,
} from "@/types/beneficiaries";

const BENEFICIARIES_QUERY_KEY = ["beneficiaries"];

export function useBeneficiaries(params: BeneficiarySearchParams = {}) {
  const queryKey = [...BENEFICIARIES_QUERY_KEY, "list", params];

  return useQuery<BeneficiaryListResponse>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.search) searchParams.set("search", params.search);
      if (params.relationship_type)
        searchParams.set("relationship_type", params.relationship_type);
      if (params.page) searchParams.set("page", params.page.toString());
      if (params.pageSize)
        searchParams.set("pageSize", params.pageSize.toString());
      if (params.sortBy) searchParams.set("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

      const response = await fetch(`/api/beneficiaries?${searchParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch beneficiaries");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBeneficiary(id: string) {
  return useQuery<BeneficiaryWithPhoto>({
    queryKey: [...BENEFICIARIES_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/beneficiaries/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch beneficiary");
      }

      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBeneficiary() {
  const queryClient = useQueryClient();

  return useMutation<BeneficiaryWithPhoto, Error, BeneficiaryFormData>({
    mutationFn: async (data) => {
      const response = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Failed to create beneficiary");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BENEFICIARIES_QUERY_KEY });
    },
  });
}

export function useUpdateBeneficiary(id: string) {
  const queryClient = useQueryClient();

  return useMutation<BeneficiaryWithPhoto, Error, BeneficiaryFormData>({
    mutationFn: async (data) => {
      const response = await fetch(`/api/beneficiaries/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Failed to update beneficiary");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: BENEFICIARIES_QUERY_KEY });
      queryClient.setQueryData([...BENEFICIARIES_QUERY_KEY, id], data);
    },
  });
}

export function useDeleteBeneficiary() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/beneficiaries/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Failed to delete beneficiary");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BENEFICIARIES_QUERY_KEY });
    },
  });
}

export function useBeneficiariesCount() {
  return useQuery<number>({
    queryKey: [...BENEFICIARIES_QUERY_KEY, "count"],
    queryFn: async () => {
      const response = await fetch("/api/beneficiaries/count");

      if (!response.ok) {
        throw new Error("Failed to fetch beneficiaries count");
      }

      const data = await response.json();

      return data.count;
    },
    staleTime: 5 * 60 * 1000,
  });
}
