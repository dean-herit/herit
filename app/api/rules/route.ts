import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { Engine } from "json-rules-engine";
import { z } from "zod";

import { db } from "@/db/db";
import { inheritanceRules, ruleAllocations } from "@/db/schema";
import { requireAuth } from "@/app/lib/auth";
import { audit } from "@/app/lib/audit-middleware";

// Validation schema for rule creation
const createRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  rule_definition: z.object({
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
  }),
  priority: z.number().int().min(1).max(100).default(1),
  is_active: z.boolean().default(true),
  allocations: z.array(
    z.object({
      asset_id: z.string().uuid(),
      beneficiary_id: z.string().uuid(),
      allocation_percentage: z.number().min(0).max(100).optional(),
      allocation_amount: z.number().min(0).optional(),
    }),
  ),
});

type CreateRuleRequest = z.infer<typeof createRuleSchema>;

export async function GET() {
  try {
    const user = await requireAuth();

    // Get all rules for the user with their allocations
    const rules = await db
      .select({
        id: inheritanceRules.id,
        name: inheritanceRules.name,
        description: inheritanceRules.description,
        rule_definition: inheritanceRules.rule_definition,
        priority: inheritanceRules.priority,
        is_active: inheritanceRules.is_active,
        created_at: inheritanceRules.created_at,
        updated_at: inheritanceRules.updated_at,
      })
      .from(inheritanceRules)
      .where(eq(inheritanceRules.user_id, user.id))
      .orderBy(desc(inheritanceRules.created_at));

    // Get allocations for each rule
    const rulesWithAllocations = await Promise.all(
      rules.map(async (rule) => {
        const allocations = await db
          .select()
          .from(ruleAllocations)
          .where(eq(ruleAllocations.rule_id, rule.id));

        return {
          ...rule,
          allocations,
        };
      }),
    );

    await audit.logUserAction(
      user.id,
      "list_rules",
      "inheritance_rules",
      user.id,
      { rules_count: rulesWithAllocations.length },
    );

    return NextResponse.json({ rules: rulesWithAllocations });
  } catch (error) {
    console.error("Error fetching rules:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const validatedData = createRuleSchema.parse(body);

    // Validate rule definition using json-rules-engine
    try {
      const engine = new Engine();

      engine.addRule({
        conditions: {
          all: validatedData.rule_definition.conditions,
        },
        event: validatedData.rule_definition.event,
      });

      // Test rule with dummy facts to ensure it's valid
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

    // Validate allocation totals don't exceed 100% per asset
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

    // Create the rule
    const [newRule] = await db
      .insert(inheritanceRules)
      .values({
        user_id: user.id,
        name: validatedData.name,
        description: validatedData.description,
        rule_definition: validatedData.rule_definition,
        priority: validatedData.priority,
        is_active: validatedData.is_active,
      })
      .returning();

    // Create allocations
    if (validatedData.allocations.length > 0) {
      await db.insert(ruleAllocations).values(
        validatedData.allocations.map((alloc) => ({
          rule_id: newRule.id,
          asset_id: alloc.asset_id,
          beneficiary_id: alloc.beneficiary_id,
          allocation_percentage: alloc.allocation_percentage ?? null,
          allocation_amount: alloc.allocation_amount ?? null,
        })),
      );
    }

    // Get the complete rule with allocations
    const allocations = await db
      .select()
      .from(ruleAllocations)
      .where(eq(ruleAllocations.rule_id, newRule.id));

    const ruleWithAllocations = {
      ...newRule,
      allocations,
    };

    await audit.logUserAction(
      user.id,
      "create_rule",
      "inheritance_rules",
      newRule.id,
      {
        rule_name: newRule.name,
        allocations_count: allocations.length,
        rule_definition: validatedData.rule_definition,
      },
    );

    return NextResponse.json({ rule: ruleWithAllocations }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error creating rule:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
