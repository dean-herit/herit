/**
 * BeneficiaryCard Component Test
 * Simplified, bulletproof test following proven pattern
 */

import React from "react";

import { BeneficiaryCard } from "./BeneficiaryCard";

// Mock beneficiary data
const mockBeneficiary = {
  id: "test-id",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  relationship_type: "spouse" as const,
  address_line_1: "123 Main St",
  address_line_2: "",
  city: "Dublin",
  county: "Dublin",
  eircode: "D01 X2Y3",
  country: "Ireland",
  date_of_birth: new Date("1990-01-01"),
  allocated_percentage: 50,
  contingent_percentage: 0,
  photo_url: null,
  user_id: "user-id",
  created_at: new Date(),
  updated_at: new Date(),
};

describe("BeneficiaryCard", () => {
  describe("Core Functionality", () => {
    it("renders without crashing", () => {
      cy.mount(<BeneficiaryCard beneficiary={mockBeneficiary} />);
      cy.get('[data-cy="beneficiary-card"]').should("be.visible");
    });

    it("displays beneficiary name", () => {
      cy.mount(<BeneficiaryCard beneficiary={mockBeneficiary} />);
      cy.contains("John Doe").should("be.visible");
    });

    it("displays beneficiary email", () => {
      cy.mount(<BeneficiaryCard beneficiary={mockBeneficiary} />);
      cy.contains("john@example.com").should("be.visible");
    });

    it("displays relationship type", () => {
      cy.mount(<BeneficiaryCard beneficiary={mockBeneficiary} />);
      cy.contains("Spouse").should("be.visible");
    });

    it("shows menu dropdown when callbacks provided", () => {
      const mockCallbacks = {
        onEdit: cy.stub(),
        onDelete: cy.stub(),
        onView: cy.stub(),
      };
      cy.mount(<BeneficiaryCard beneficiary={mockBeneficiary} {...mockCallbacks} />);
      cy.get('button[aria-haspopup="menu"]').should("be.visible");
    });

    it("hides menu dropdown when no callbacks provided", () => {
      cy.mount(<BeneficiaryCard beneficiary={mockBeneficiary} />);
      cy.get('button[aria-haspopup="menu"]').should("not.exist");
    });
  });
});
