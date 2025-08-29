"use client";

import React from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import {
  PencilIcon,
  TrashIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";

import { useComponentMetadata } from "@/hooks/useComponentMetadata";
import { ComponentCategory } from "@/types/component-registry";
import { InheritanceRule, RuleAllocation } from "@/db/schema";
import { willQueryOptions, assetsQueryOptions } from "@/lib/query-options";
import { useDeleteRule } from "@/hooks/useRules";

interface ViewRuleModalProps {
  isOpen: boolean;
  rule: (InheritanceRule & { allocations: RuleAllocation[] }) | null;
  onClose: () => void;
  onEdit?: () => void;
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

export function ViewRuleModal({
  isOpen,
  rule,
  onClose,
  onEdit,
}: ViewRuleModalProps) {
  const componentProps = useComponentMetadata(
    "view-rule-modal",
    ComponentCategory.BUSINESS,
  );

  const deleteRuleMutation = useDeleteRule();

  // Fetch required data
  const { data: beneficiariesData } = useQuery(
    willQueryOptions.beneficiaries(),
  );
  const { data: assetsData } = useQuery(assetsQueryOptions.all());

  // Early return if rule is null
  if (!rule) {
    return null;
  }

  const beneficiaries = beneficiariesData || [];
  const assets = assetsData || [];

  const handleDeleteRule = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete the rule "${rule.name}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteRuleMutation.mutateAsync(rule.id);
        onClose();
      } catch (error) {
        console.error("Failed to delete rule:", error);
      }
    }
  };

  const conditions = ((rule.rule_definition as any)?.conditions?.all || []) as Array<{
    fact: string;
    operator: string;
    value: string | number | boolean | null;
  }>;
  const totalAllocationPercentage = rule.allocations.reduce(
    (sum, allocation) => sum + (allocation.allocation_percentage || 0),
    0,
  );
  const totalAllocationAmount = rule.allocations.reduce(
    (sum, allocation) => sum + (allocation.allocation_amount || 0),
    0,
  );

  return (
    <Modal
      classNames={{
        base: "max-h-[90vh]",
        body: "py-6",
      }}
      data-component-category="ui"
      data-component-id="modal"
      isOpen={isOpen}
      scrollBehavior="inside"
      size="4xl"
      onClose={onClose}
    >
      <ModalContent
        {...componentProps}
        data-component-category="ui"
        data-component-id="modal-content"
      >
        <ModalHeader
          className="flex flex-col gap-1"
          data-component-category="ui"
          data-component-id="modal-header"
        >
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-2xl font-bold">{rule.name}</h2>
              {rule.description && (
                <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Chip
                color={rule.is_active ? "success" : "warning"}
                data-component-category="ui"
                data-component-id="chip"
                size="sm"
                startContent={
                  rule.is_active ? (
                    <CheckCircleIcon
                      className="w-3 h-3"
                      data-component-category="ui"
                      data-component-id="check-circle-icon"
                    />
                  ) : (
                    <XCircleIcon
                      className="w-3 h-3"
                      data-component-category="ui"
                      data-component-id="x-circle-icon"
                    />
                  )
                }
                variant="flat"
              >
                {rule.is_active ? "Active" : "Inactive"}
              </Chip>
              <Chip
                color="default"
                data-component-category="ui"
                data-component-id="chip"
                size="sm"
                startContent={
                  <Cog6ToothIcon
                    className="w-3 h-3"
                    data-component-category="ui"
                    data-component-id="cog6-tooth-icon"
                  />
                }
                variant="flat"
              >
                Priority: {rule.priority || 1}
              </Chip>
            </div>
          </div>
        </ModalHeader>

        <ModalBody data-component-category="ui" data-component-id="modal-body">
          <div className="space-y-6">
            {/* Rule Overview */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Rule Overview</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Conditions</p>
                    <p className="text-lg font-semibold">{conditions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Allocations</p>
                    <p className="text-lg font-semibold">
                      {rule.allocations.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-lg font-semibold">
                      {new Date(rule.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Updated</p>
                    <p className="text-lg font-semibold">
                      {new Date(rule.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Conditions */}
            {/* @ts-ignore */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Conditions</h3>
                <p className="text-sm text-gray-600">
                  All conditions must be true for this rule to trigger
                </p>
              </CardHeader>
              <CardBody>
                {conditions.length === 0 ? (
                  <p className="text-gray-500 italic">No conditions defined</p>
                ) : (
                  <div className="space-y-3">
                    {conditions.map(
                      (
                        condition: {
                          fact: string;
                          operator: string;
                          value: string | number | boolean | null;
                        },
                        index: number,
                      ) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          data-component-category="data-display"
                          data-component-id={`rule-condition-${index.toString()}`}
                        >
                          <Chip
                            color="primary"
                            data-component-category="ui"
                            data-component-id="chip"
                            size="sm"
                            variant="flat"
                          >
                            {(FACT_LABELS[condition.fact] || condition.fact) as string}
                          </Chip>

                          <span className="text-sm font-medium text-gray-700">
                            {(OPERATOR_LABELS[condition.operator] ||
                              condition.operator) as string}
                          </span>

                          <Chip
                            color="secondary"
                            data-component-category="ui"
                            data-component-id="chip"
                            size="sm"
                            variant="flat"
                          >
                            {(() => {
                              if (typeof condition.value === "boolean") {
                                return condition.value ? "Yes" : "No";
                              }

                              return condition.value?.toString() || "N/A";
                            })()}
                          </Chip>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Allocations */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">Asset Allocations</h3>
                    <p className="text-sm text-gray-600">
                      How assets will be distributed when this rule triggers
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Percentage</p>
                    <p className="text-lg font-semibold text-primary">
                      {totalAllocationPercentage.toFixed(1)}%
                    </p>
                    {totalAllocationAmount > 0 && (
                      <>
                        <p className="text-sm text-gray-600 mt-1">
                          Total Amount
                        </p>
                        <p className="text-lg font-semibold text-primary">
                          €{totalAllocationAmount.toLocaleString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {rule.allocations.length === 0 ? (
                  <p className="text-gray-500 italic">No allocations defined</p>
                ) : (
                  <div className="space-y-4">
                    {rule.allocations.map((allocation, index) => {
                      const asset = assets.find(
                        (a) => a.id === allocation.asset_id,
                      );
                      const beneficiary = beneficiaries.find(
                        (b: any) => b.id === allocation.beneficiary_id,
                      );

                      return (
                        <div
                          key={index}
                          className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          data-component-category="data-display"
                          data-component-id={`rule-allocation-${index.toString()}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {asset?.name || "Unknown Asset"}
                              </h4>
                              <Chip
                                color="default"
                                data-component-category="ui"
                                data-component-id="chip"
                                size="sm"
                                variant="flat"
                              >
                                {asset?.asset_type || "Unknown Type"}
                              </Chip>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>to</span>
                              <span className="font-medium text-gray-900">
                                {beneficiary
                                  ? beneficiary.name
                                  : "Unknown Beneficiary"}
                              </span>
                              {beneficiary?.relationship_type && (
                                <Chip
                                  color="secondary"
                                  data-component-category="ui"
                                  data-component-id="chip"
                                  size="sm"
                                  variant="flat"
                                >
                                  {beneficiary.relationship_type}
                                </Chip>
                              )}
                            </div>

                            {asset && (
                              <div className="mt-2 text-sm text-gray-500">
                                Asset Value: €{asset.value.toLocaleString()}
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            {allocation.allocation_percentage && (
                              <div className="mb-1">
                                <span className="text-2xl font-bold text-primary">
                                  {allocation.allocation_percentage}%
                                </span>
                              </div>
                            )}

                            {allocation.allocation_amount && (
                              <div className="text-sm text-gray-600">
                                €{allocation.allocation_amount.toLocaleString()}
                              </div>
                            )}

                            {asset && allocation.allocation_percentage && (
                              <div className="text-sm text-gray-500 mt-1">
                                ≈ €
                                {(
                                  (asset.value *
                                    allocation.allocation_percentage) /
                                  100
                                ).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Rule Definition JSON (for debugging/technical view) */}
            {rule.rule_definition && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Technical Details</h3>
                  <p className="text-sm text-gray-600">
                    JSON rules engine definition
                  </p>
                </CardHeader>
                <CardBody>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-700">
                      {JSON.stringify(rule.rule_definition, null, 2)}
                    </pre>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </ModalBody>

        <ModalFooter
          data-component-category="ui"
          data-component-id="modal-footer"
        >
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2">
              <Button
                color="danger"
                isLoading={deleteRuleMutation.isPending}
                startContent={
                  <TrashIcon
                    className="w-4 h-4"
                    data-component-category="ui"
                    data-component-id="trash-icon"
                  />
                }
                variant="light"
                onPress={handleDeleteRule}
              >
                Delete Rule
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="light" onPress={onClose}>
                Close
              </Button>

              {onEdit && (
                <Button
                  color="primary"
                  startContent={
                    <PencilIcon
                      className="w-4 h-4"
                      data-component-category="ui"
                      data-component-id="pencil-icon"
                    />
                  }
                  onPress={onEdit}
                >
                  Edit Rule
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
