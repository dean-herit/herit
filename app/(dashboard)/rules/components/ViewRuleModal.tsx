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

import { InheritanceRule, RuleAllocation } from "@/db/schema";

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
  // Early return if rule is null
  if (!rule) {
    return null;
  }

  return (
    <Modal
      data-component-category="ui"
      data-component-id="modal"
      isOpen={isOpen}
      size="4xl"
      onClose={onClose}
    >
      <ModalContent
        data-component-category="ui"
        data-component-id="modal-content"
      >
        <ModalHeader
          data-component-category="ui"
          data-component-id="modal-header"
        >
          <h2>Rule: {rule.name}</h2>
        </ModalHeader>
        <ModalBody data-component-category="ui" data-component-id="modal-body">
          <p>
            Rule details will be implemented once TypeScript issues are
            resolved.
          </p>
          <p>Rule has {rule.allocations.length} allocations.</p>
        </ModalBody>
        <ModalFooter
          data-component-category="ui"
          data-component-id="modal-footer"
        >
          <Button onPress={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
