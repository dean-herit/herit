import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { Engine } from "json-rules-engine";
import { z } from "zod";

import { db } from "@/db/db";
import { inheritanceRules, ruleAllocations } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { audit } from "@/lib/audit-middleware";

// Validation schema for rule updates
const updateRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  rule_definition: z
    .object({
      conditions: z.array(
        z.object({
          fact: z.string(),
          operator: z.string(),
          value: z.any(),
        }),
      ),
      event: z.object({
        type: z.string(),
        params: z.any().optional(),
      }),
    })
    .optional(),
  priority: z.number().int().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
  allocations: z
    .array(
      z.object({
        asset_id: z.string().uuid(),
        beneficiary_id: z.string().uuid(),
        allocation_percentage: z.number().min(0).max(100).optional(),
        allocation_amount: z.number().min(0).optional(),
      }),
    )
    .optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Get the rule
    const [rule] = await db
      .select()
      .from(inheritanceRules)
      .where(
        and(
          eq(inheritanceRules.id, id),
          eq(inheritanceRules.user_id, user.id),
        ),
      );

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    // Get allocations
    const allocations = await db
      .select()
      .from(ruleAllocations)
      .where(eq(ruleAllocations.rule_id, rule.id));

    const ruleWithAllocations = {
      ...rule,
      allocations,
    };

    await audit.logUserAction(
      user.id,
      "view_rule",
      "inheritance_rules",
      rule.id,
      { rule_name: rule.name },
    );

    return NextResponse.json({ rule: ruleWithAllocations });
  } catch (error) {
    console.error("Error fetching rule:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const validatedData = updateRuleSchema.parse(body);

    // Check if rule exists and belongs to user
    const [existingRule] = await db
      .select()
      .from(inheritanceRules)
      .where(
        and(
          eq(inheritanceRules.id, id),
          eq(inheritanceRules.user_id, user.id),
        ),
      );

    if (!existingRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    // Validate rule definition if provided
    if (validatedData.rule_definition) {
      try {
        const engine = new Engine();

        // Convert conditions array to TopLevelCondition format
        const ruleForEngine = {
          ...validatedData.rule_definition,
          conditions: {
            all: validatedData.rule_definition.conditions,
          },
        };

        engine.addRule(ruleForEngine);

        // Test rule with dummy facts
        await engine.run({
          "beneficiary-age": 25,
          "education-completed": true,
          "sobriety-period": 365,
        });
      } catch (engineError) {
        return NextResponse.json(
          { error: "Invalid rule definition", details: engineError },
          { status: 400 },
        );
      }
    }

    // Validate allocation totals if allocations provided
    if (validatedData.allocations) {
      const allocationsByAsset = validatedData.allocations.reduce(
        (acc, alloc) => {
          if (!acc[alloc.asset_id]) {
            acc[alloc.asset_id] = { percentage: 0, amount: 0 };
          }
          if (alloc.allocation_percentage) {
            acc[alloc.asset_id].percentage += alloc.allocation_percentage;
          }
          if (alloc.allocation_amount) {
            acc[alloc.asset_id].amount += alloc.allocation_amount;
          }

          return acc;
        },
        {} as Record<string, { percentage: number; amount: number }>,
      );

      const overAllocations = Object.entries(allocationsByAsset)
        .filter(([_, totals]) => totals.percentage > 100)
        .map(([assetId]) => assetId);

      if (overAllocations.length > 0) {
        return NextResponse.json(
          {
            error: "Asset allocation exceeds 100%",
            overAllocatedAssets: overAllocations,
          },
          { status: 400 },
        );
      }
    }

    // Build update object (only include non-undefined values)
    const updateData = Object.entries(validatedData).reduce(
      (acc, [key, value]) => {
        if (key !== "allocations" && value !== undefined) {
          acc[key] = value;
        }

        return acc;
      },
      {} as any,
    );

    // Update the rule
    const [updatedRule] = await db
      .update(inheritanceRules)
      .set({
        ...updateData,
        updated_at: new Date(),
      })
      .where(eq(inheritanceRules.id, id))
      .returning();

    // Update allocations if provided
    if (validatedData.allocations) {
      // Delete existing allocations
      await db
        .delete(ruleAllocations)
        .where(eq(ruleAllocations.rule_id, id));

      // Insert new allocations
      if (validatedData.allocations.length > 0) {
        await db.insert(ruleAllocations).values(
          validatedData.allocations.map((alloc) => ({
            rule_id: id,
            asset_id: alloc.asset_id,
            beneficiary_id: alloc.beneficiary_id,
            allocation_percentage: alloc.allocation_percentage ?? null,
            allocation_amount: alloc.allocation_amount ?? null,
          })),
        );
      }
    }

    // Get updated allocations
    const allocations = await db
      .select()
      .from(ruleAllocations)
      .where(eq(ruleAllocations.rule_id, id));

    const ruleWithAllocations = {
      ...updatedRule,
      allocations,
    };

    await audit.logDataChange(
      user.id,
      "update",
      "inheritance_rules",
      id,
      existingRule,
      updatedRule,
    );

    return NextResponse.json({ rule: ruleWithAllocations });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error updating rule:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Check if rule exists and belongs to user
    const [existingRule] = await db
      .select()
      .from(inheritanceRules)
      .where(
        and(
          eq(inheritanceRules.id, id),
          eq(inheritanceRules.user_id, user.id),
        ),
      );

    if (!existingRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    // Delete the rule (allocations will be deleted via CASCADE)
    await db.delete(inheritanceRules).where(eq(inheritanceRules.id, id));

    await audit.logUserAction(
      user.id,
      "delete_rule",
      "inheritance_rules",
      id,
      {
        rule_name: existingRule.name,
        deleted_at: new Date().toISOString(),
      },
    );

    return NextResponse.json({ message: "Rule deleted successfully" });
  } catch (error) {
    console.error("Error deleting rule:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
