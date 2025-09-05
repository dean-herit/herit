"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
} from "@heroui/react";
import {
  PlusIcon,
  Cog6ToothIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

import { CreateRuleModal } from "./components/CreateRuleModal";
import { EditRuleModal } from "./components/EditRuleModal";
import { ViewRuleModal } from "./components/ViewRuleModal";

import { useRules, useDeleteRule } from "@/app/hooks/useRules";
import { InheritanceRule, RuleAllocation } from "@/db/schema";

export default function RulesPage() {
  const componentProps = {};
  const [selectedRule, setSelectedRule] = useState<
    (InheritanceRule & { allocations: RuleAllocation[] }) | null
  >(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { data: rulesData, isLoading, error } = useRules();
  const deleteRuleMutation = useDeleteRule();

  const handleViewRule = (
    rule: InheritanceRule & { allocations: RuleAllocation[] },
  ) => {
    setSelectedRule(rule);
    setIsViewModalOpen(true);
  };

  const handleEditRule = (
    rule: InheritanceRule & { allocations: RuleAllocation[] },
  ) => {
    setSelectedRule(rule);
    setIsEditModalOpen(true);
  };

  const handleDeleteRule = async (
    rule: InheritanceRule & { allocations: RuleAllocation[] },
  ) => {
    if (
      window.confirm(
        `Are you sure you want to delete the rule "${rule.name}"? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteRuleMutation.mutateAsync(rule.id);
      } catch (error) {
        console.error("Failed to delete rule:", error);
        // You might want to show a toast notification here
      }
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedRule(null);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedRule(null);
  };

  if (isLoading) {
    return (
      <div
        {...componentProps}
        className="flex justify-center items-center min-h-96"
      >
        <Spinner label="Loading rules..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div {...componentProps}>
        <Card className="bg-danger-50 border-danger-200">
          <CardBody>
            <p className="text-danger">
              Failed to load rules. Please try again.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const rules = rulesData?.rules || [];

  return (
    <div {...componentProps} className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Inheritance Rules
          </h1>
          <p className="text-gray-600">
            Create and manage conditional inheritance rules for your assets and
            beneficiaries.
          </p>
        </div>
        <Button
          className="shrink-0"
          color="primary"
          data-testid="rule-button"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={() => setIsCreateModalOpen(true)}
        >
          Create Rule
        </Button>
      </div>

      {/* Rules Count Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-gray-600">Total Rules</p>
                <p className="text-2xl font-bold">{rules.length}</p>
              </div>
              <Cog6ToothIcon className="w-8 h-8 text-gray-400" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-gray-600">Active Rules</p>
                <p className="text-2xl font-bold text-success">
                  {rules.filter((rule) => rule.is_active).length}
                </p>
              </div>
              <div className="w-3 h-3 bg-success rounded-full" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-gray-600">Inactive Rules</p>
                <p className="text-2xl font-bold text-warning">
                  {rules.filter((rule) => !rule.is_active).length}
                </p>
              </div>
              <div className="w-3 h-3 bg-warning rounded-full" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card className="py-16">
          <CardBody className="text-center">
            <Cog6ToothIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Rules Created Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start by creating your first inheritance rule to define how your
              assets should be distributed to beneficiaries based on specific
              conditions.
            </p>
            <Button
              color="primary"
              data-testid="rule-button"
              startContent={<PlusIcon className="w-4 h-4" />}
              onPress={() => setIsCreateModalOpen(true)}
            >
              Create Your First Rule
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6">
          {rules.map((rule) => (
            <Card key={rule.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start w-full">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {rule.name}
                    </h3>
                    {rule.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {rule.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Chip
                        color={rule.is_active ? "success" : "warning"}
                        size="sm"
                        variant="flat"
                      >
                        {rule.is_active ? "Active" : "Inactive"}
                      </Chip>
                      <Chip color="default" size="sm" variant="flat">
                        Priority: {rule.priority || 1}
                      </Chip>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      isIconOnly
                      data-testid="rule-button"
                      size="sm"
                      variant="light"
                      onPress={() => handleViewRule(rule)}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      data-testid="rule-button"
                      size="sm"
                      variant="light"
                      onPress={() => handleEditRule(rule)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      color="danger"
                      data-testid="rule-button"
                      isLoading={deleteRuleMutation.isPending}
                      size="sm"
                      variant="light"
                      onPress={() => handleDeleteRule(rule)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Allocations:</span>
                    <span className="font-medium">
                      {rule.allocations.length} assignment(s)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Conditions:</span>
                    <span className="font-medium">
                      {(rule.rule_definition as any)?.conditions?.all?.length ||
                        (rule.rule_definition as any)?.conditions?.length ||
                        0}{" "}
                      condition(s)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(rule.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateRuleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedRule && (
        <>
          <EditRuleModal
            isOpen={isEditModalOpen}
            rule={selectedRule}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
          />

          <ViewRuleModal
            isOpen={isViewModalOpen}
            rule={selectedRule}
            onClose={closeViewModal}
          />
        </>
      )}
    </div>
  );
}
