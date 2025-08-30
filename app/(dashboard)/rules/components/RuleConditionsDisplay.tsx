"use client";

import React from "react";
import { Chip } from "@heroui/react";

// Define the structure of a rule condition
interface RuleCondition {
  fact: string;
  operator: string;
  value: string | number | boolean | null;
}

// Define the expected structure of rule definition
interface RuleDefinitionSchema {
  conditions?: {
    all?: RuleCondition[];
  };
}

interface RuleConditionsDisplayProps {
  ruleDefinition: unknown;
  "data-component-category"?: string;
  "data-testid"?: string;
}

const FACT_LABELS: Record<string, string> = {
  "beneficiary-age": "Beneficiary Age",
  "beneficiary-relationship": "Relationship to Deceased",
  "education-completed": "Education Completed",
  "employment-status": "Employment Status",
  "sobriety-period": "Sobriety Period (Days)",
  "marriage-status": "Marriage Status",
  "children-count": "Number of Children",
  "asset-type": "Asset Type",
  "asset-value": "Asset Value",
};

const OPERATOR_LABELS: Record<string, string> = {
  equal: "Equals",
  notEqual: "Not Equal",
  greaterThan: "Greater Than",
  greaterThanInclusive: "Greater Than or Equal",
  lessThan: "Less Than",
  lessThanInclusive: "Less Than or Equal",
  in: "Is One Of",
  notIn: "Is Not One Of",
  contains: "Contains",
};

// Type guard function to safely parse rule definition
function parseRuleDefinition(definition: unknown): RuleCondition[] {
  try {
    const parsed = definition as RuleDefinitionSchema;

    if (parsed?.conditions?.all && Array.isArray(parsed.conditions.all)) {
      return parsed.conditions.all;
    }

    return [];
  } catch {
    return [];
  }
}

export const RuleConditionsDisplay: React.FC<RuleConditionsDisplayProps> = ({
  ruleDefinition,
}) => {
  const conditions = parseRuleDefinition(ruleDefinition);

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Conditions</h3>
        <p className="text-sm text-gray-600">
          All conditions must be true for this rule to trigger
        </p>
      </div>
      <div>
        {conditions.length === 0 ? (
          <p className="text-gray-500 italic">No conditions defined</p>
        ) : (
          <div className="space-y-3">
            {conditions.map((condition, index) => {
              const factLabel = FACT_LABELS[condition.fact] || condition.fact;
              const operatorLabel =
                OPERATOR_LABELS[condition.operator] || condition.operator;
              const valueDisplay =
                typeof condition.value === "boolean"
                  ? condition.value
                    ? "Yes"
                    : "No"
                  : String(condition.value ?? "N/A");

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  data-component-category="data-display"
                  data-testid={`rule-condition-${index}`}
                >
                  <Chip
                    color="primary"
                    data-component-category="ui"
                    data-testid="chip"
                    size="sm"
                    variant="flat"
                  >
                    {factLabel}
                  </Chip>

                  <span className="text-sm font-medium text-gray-700">
                    {operatorLabel}
                  </span>

                  <Chip
                    color="secondary"
                    data-component-category="ui"
                    data-testid="chip"
                    size="sm"
                    variant="flat"
                  >
                    {valueDisplay}
                  </Chip>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
