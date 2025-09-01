"use client";

import React from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

import { InheritanceRule, RuleAllocation } from "@/db/schema";
import { useDeleteRule } from "@/app/hooks/useRules";

interface ViewRuleModalProps {
  isOpen: boolean;
  rule: (InheritanceRule & { allocations: RuleAllocation[] }) | null;
  onClose: () => void;
  onEdit?: () => void;
}

export function ViewRuleModal({
  isOpen,
  rule,
  onClose,
  onEdit,
}: ViewRuleModalProps) {
  const deleteRuleMutation = useDeleteRule();

  if (!rule) {
    return null;
  }

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

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <div>
            <h2 className="text-xl font-bold">{rule.name}</h2>
            {rule.description && (
              <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
            )}
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Rule Status</h3>
              <p className="text-sm">
                Status: {rule.is_active ? "Active" : "Inactive"}
              </p>
              <p className="text-sm">Priority: {rule.priority || 1}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Allocations</h3>
              <p className="text-sm">
                This rule has {rule.allocations.length} allocation(s)
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Conditions</h3>
              <p className="text-sm text-gray-500">
                Conditions display will be enhanced in a future update
              </p>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex justify-between items-center w-full">
            <Button
              color="danger"
              data-testid="Button-piazc9blb"
              isLoading={deleteRuleMutation.isPending}
              startContent={<TrashIcon className="w-4 h-4" />}
              variant="light"
              onPress={handleDeleteRule}
            >
              Delete Rule
            </Button>

            <div className="flex gap-2">
              <Button
                data-testid="Button-nthm6tadh"
                variant="light"
                onPress={onClose}
              >
                Close
              </Button>

              {onEdit && (
                <Button
                  color="primary"
                  data-testid="Button-7z3shyaaa"
                  startContent={<PencilIcon className="w-4 h-4" />}
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
