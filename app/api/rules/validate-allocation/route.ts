import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/db";
import { assets, inheritanceRules, ruleAllocations } from "@/db/schema";
import { requireAuth } from "@/app/lib/auth";

// Validation schema for allocation validation
const validateAllocationSchema = z.object({
  allocations: z.array(
    z.object({
      asset_id: z.string().uuid(),
      beneficiary_id: z.string().uuid(),
      allocation_percentage: z.number().min(0).max(100).optional(),
      allocation_amount: z.number().min(0).optional(),
    }),
  ),
  exclude_rule_id: z.string().uuid().optional(), // Exclude current rule when editing
});

type ValidateAllocationRequest = z.infer<typeof validateAllocationSchema>;

interface AssetAllocationInfo {
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
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = validateAllocationSchema.parse(body);

    // Get asset information for validation
    const assetIds = [
      ...new Set(validatedData.allocations.map((a) => a.asset_id)),
    ];

    const userAssets = await db
      .select({
        id: assets.id,
        name: assets.name,
        value: assets.value,
      })
      .from(assets)
      .where(
        and(sql`${assets.id} = ANY(${assetIds})`, eq(assets.user_id, user.id)),
      );

    if (userAssets.length !== assetIds.length) {
      return NextResponse.json(
        { error: "Some assets not found or don't belong to user" },
        { status: 404 },
      );
    }

    // Get existing allocations for these assets (excluding current rule if editing)
    const whereConditions = [
      sql`${ruleAllocations.asset_id} = ANY(${assetIds})`,
      eq(inheritanceRules.user_id, user.id),
      eq(inheritanceRules.is_active, true),
    ];

    // Exclude current rule if editing
    if (validatedData.exclude_rule_id) {
      whereConditions.push(
        sql`${ruleAllocations.rule_id} != ${validatedData.exclude_rule_id}`,
      );
    }

    const existingAllocations = await db
      .select({
        asset_id: ruleAllocations.asset_id,
        rule_id: ruleAllocations.rule_id,
        rule_name: inheritanceRules.name,
        allocation_percentage: ruleAllocations.allocation_percentage,
        allocation_amount: ruleAllocations.allocation_amount,
      })
      .from(ruleAllocations)
      .innerJoin(
        inheritanceRules,
        eq(ruleAllocations.rule_id, inheritanceRules.id),
      )
      .where(and(...whereConditions));

    // Calculate validation results for each asset
    const validationResults: AssetAllocationInfo[] = userAssets.map((asset) => {
      // Get existing allocations for this asset
      const assetExistingAllocations = existingAllocations.filter(
        (alloc) => alloc.asset_id === asset.id,
      );

      // Get new allocations for this asset
      const assetNewAllocations = validatedData.allocations.filter(
        (alloc) => alloc.asset_id === asset.id,
      );

      // Calculate existing totals
      const existingPercentageTotal = assetExistingAllocations.reduce(
        (sum, alloc) => sum + (alloc.allocation_percentage ?? 0),
        0,
      );
      const existingAmountTotal = assetExistingAllocations.reduce(
        (sum, alloc) => sum + (alloc.allocation_amount ?? 0),
        0,
      );

      // Calculate new allocation totals
      const newPercentageTotal = assetNewAllocations.reduce(
        (sum, alloc) => sum + (alloc.allocation_percentage ?? 0),
        0,
      );
      const newAmountTotal = assetNewAllocations.reduce(
        (sum, alloc) => sum + (alloc.allocation_amount ?? 0),
        0,
      );

      // Calculate combined totals
      const totalPercentageAllocated =
        existingPercentageTotal + newPercentageTotal;
      const totalAmountAllocated = existingAmountTotal + newAmountTotal;

      // Check for over-allocation
      const isOverAllocatedByPercentage = totalPercentageAllocated > 100;
      const isOverAllocatedByAmount = totalAmountAllocated > asset.value;
      const isOverAllocated =
        isOverAllocatedByPercentage || isOverAllocatedByAmount;

      // Calculate remaining allocation capacity
      const remainingPercentage = Math.max(0, 100 - totalPercentageAllocated);
      const remainingValue = Math.max(0, asset.value - totalAmountAllocated);

      // Get conflicting rules (rules that contribute to over-allocation)
      const conflictingRules = assetExistingAllocations.map((alloc) => ({
        rule_id: alloc.rule_id,
        rule_name: alloc.rule_name,
        allocation_percentage: alloc.allocation_percentage,
        allocation_amount: alloc.allocation_amount,
      }));

      return {
        asset_id: asset.id,
        asset_name: asset.name,
        asset_value: asset.value,
        total_percentage_allocated: totalPercentageAllocated,
        total_amount_allocated: totalAmountAllocated,
        remaining_percentage: remainingPercentage,
        remaining_value: remainingValue,
        is_over_allocated: isOverAllocated,
        conflicting_rules: conflictingRules,
      };
    });

    // Determine overall validation status
    const hasOverAllocations = validationResults.some(
      (result) => result.is_over_allocated,
    );
    const overAllocatedAssets = validationResults
      .filter((result) => result.is_over_allocated)
      .map((result) => result.asset_id);

    return NextResponse.json({
      is_valid: !hasOverAllocations,
      over_allocated_assets: overAllocatedAssets,
      asset_allocation_details: validationResults,
      summary: {
        total_assets_checked: validationResults.length,
        over_allocated_count: overAllocatedAssets.length,
        valid_allocations_count:
          validationResults.length - overAllocatedAssets.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error validating allocation:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
