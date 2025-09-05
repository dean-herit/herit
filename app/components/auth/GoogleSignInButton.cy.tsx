/**
 * GoogleSignInButton Component Test
 * Simplified, bulletproof test with proper mocking
 */

import React from "react";

import { GoogleSignInButton } from "./GoogleSignInButton";

describe("GoogleSignInButton", () => {
  describe("Core Functionality", () => {
    it("renders without crashing", () => {
      cy.mount(<GoogleSignInButton />);
      cy.get('[data-testid="googlesigninbutton"]').should("be.visible");
    });

    it("displays correct text", () => {
      cy.mount(<GoogleSignInButton />);
      cy.get('[data-testid="googlesigninbutton"]').should(
        "contain.text",
        "Continue with Google",
      );
    });

    it("calls onSignInStart callback when provided", () => {
      const onSignInStart = cy.stub().as("onSignInStart");

      cy.mount(<GoogleSignInButton onSignInStart={onSignInStart} />);

      cy.get('[data-testid="googlesigninbutton"]').click();
      cy.get("@onSignInStart").should("have.been.called");
    });
  });
});
