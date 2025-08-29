"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { rulesQueryOptions } from "@/lib/query-options";
import { InheritanceRule, RuleAllocation } from "@/db/schema";
// audit is handled server-side in API routes

// Types for API requests and responses
export interface CreateRuleData {
  name: string;
  description?: string;
  rule_definition: {
    conditions: Array<{
      fact: string;
      operator: string;
      value: any;
    }>;
    event: {
      type: string;
      params?: any;
    };
  };
  priority?: number;
  is_active?: boolean;
  allocations: Array<{
    asset_id: string;
    beneficiary_id: string;
    allocation_percentage?: number;
    allocation_amount?: number;
  }>;
}

export interface UpdateRuleData extends Partial<CreateRuleData> {
  id: string;
}

export interface ValidationResult {
  is_valid: boolean;
  over_allocated_assets: string[];
  asset_allocation_details: Array<{
    asset_id: string;
    asset_name: string;
    asset_value: number;
    total_percentage_allocated: number;
    total_amount_allocated: number;
    remaining_percentage: number;
    remaining_value: number;
    is_over_allocated: boolean;
    conflicting_rules: Array<{
      rule_id: string;
      rule_name: string;
      allocation_percentage: number | null;
      allocation_amount: number | null;
    }>;
  }>;
  summary: {
    total_assets_checked: number;
    over_allocated_count: number;
    valid_allocations_count: number;
  };
}

// Custom hooks
export function useRules() {
  return useQuery(rulesQueryOptions.all());
}

export function useRule(ruleId: string) {
  return useQuery(rulesQueryOptions.byId(ruleId));
}

export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      ruleData: CreateRuleData,
    ): Promise<{
      rule: InheritanceRule & { allocations: RuleAllocation[] };
    }> => {
      const response = await fetch("/api/rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ruleData),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Failed to create rule");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch rules
      queryClient.invalidateQueries({ queryKey: ["rules"] });

      // Update dashboard stats if they exist
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });

      // Optionally update the cache directly for immediate feedback
      queryClient.setQueryData(["rules", data.rule.id], { rule: data.rule });
    },
    onError: (error) => {
      console.error("Failed to create rule:", error);
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      ruleData: UpdateRuleData,
    ): Promise<{
      rule: InheritanceRule & { allocations: RuleAllocation[] };
    }> => {
      const { id, ...updateData } = ruleData;

      const response = await fetch(`/api/rules/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Failed to update rule");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch rules list
      queryClient.invalidateQueries({ queryKey: ["rules"] });

      // Update individual rule cache
      queryClient.setQueryData(["rules", variables.id], { rule: data.rule });

      // Update dashboard stats
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
    onError: (error) => {
      console.error("Failed to update rule:", error);
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string): Promise<{ message: string }> => {
      const response = await fetch(`/api/rules/${ruleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Failed to delete rule");
      }

      return response.json();
    },
    onSuccess: (_, ruleId) => {
      // Remove rule from cache
      queryClient.removeQueries({ queryKey: ["rules", ruleId] });

      // Invalidate rules list
      queryClient.invalidateQueries({ queryKey: ["rules"] });

      // Update dashboard stats
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
    onError: (error) => {
      console.error("Failed to delete rule:", error);
    },
  });
}

export function useValidateAllocation() {
  return useMutation({
    mutationFn: async (data: {
      allocations: Array<{
        asset_id: string;
        beneficiary_id: string;
        allocation_percentage?: number;
        allocation_amount?: number;
      }>;
      exclude_rule_id?: string;
    }): Promise<ValidationResult> => {
      const response = await fetch("/api/rules/validate-allocation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Failed to validate allocation");
      }

      return response.json();
    },
    onError: (error) => {
      console.error("Failed to validate allocation:", error);
    },
  });
}

// Utility hooks for common operations
export function useRulesCount() {
  const { data: rulesData } = useRules();

  return rulesData?.rules?.length ?? 0;
}

export function useActiveRulesCount() {
  const { data: rulesData } = useRules();

  return rulesData?.rules?.filter((rule) => rule.is_active)?.length ?? 0;
}

export function useRulesByPriority() {
  const { data: rulesData } = useRules();

  return (
    rulesData?.rules?.sort((a, b) => (b.priority ?? 1) - (a.priority ?? 1)) ??
    []
  );
}

// Hook for getting rules that affect a specific asset
export function useRulesByAsset(assetId: string) {
  const { data: rulesData } = useRules();

  return (
    rulesData?.rules?.filter((rule) =>
      rule.allocations.some((allocation) => allocation.asset_id === assetId),
    ) ?? []
  );
}

// Hook for getting rules that affect a specific beneficiary
export function useRulesByBeneficiary(beneficiaryId: string) {
  const { data: rulesData } = useRules();

  return (
    rulesData?.rules?.filter((rule) =>
      rule.allocations.some(
        (allocation) => allocation.beneficiary_id === beneficiaryId,
      ),
    ) ?? []
  );
}
