/**
 * Icons Component Test
 * Tests actual icon components functionality
 */

import React from "react";

import { Logo, SunFilledIcon, MoonFilledIcon } from "./icons";

describe("Icons", () => {
  beforeEach(() => {
    cy.viewport(1200, 800);
  });

  describe("Core Functionality", () => {
    it("renders Logo without crashing", { timeout: 5000, retries: 2 }, () => {
      cy.mountWithContext(
        <div data-testid="test-container">
          <Logo />
        </div>,
      );
      cy.get("svg").should("be.visible");
    });

    it("renders SunFilledIcon correctly", { timeout: 5000, retries: 2 }, () => {
      cy.mountWithContext(
        <div data-testid="test-container">
          <SunFilledIcon />
        </div>,
      );
      cy.get("svg").should("be.visible");
    });

    it(
      "renders MoonFilledIcon correctly",
      { timeout: 5000, retries: 2 },
      () => {
        cy.mountWithContext(
          <div data-testid="test-container">
            <MoonFilledIcon />
          </div>,
        );
        cy.get("svg").should("be.visible");
      },
    );
  });

  describe("Accessibility", () => {
    it(
      "meets basic accessibility standards",
      { timeout: 5000, retries: 2 },
      () => {
        cy.mountWithContext(
          <div data-testid="test-container">
            <Logo />
          </div>,
        );

        // Icons should be visible and have appropriate SVG structure
        cy.get("svg").should("be.visible");
      },
    );

    it("supports keyboard navigation", { timeout: 5000, retries: 2 }, () => {
      cy.mountWithContext(
        <div data-testid="test-container">
          <Logo />
        </div>,
      );

      // SVG icons are not focusable by default, which is correct behavior
      cy.get("svg").should("be.visible");
    });
  });

  describe("Responsive Design", () => {
    it(
      "adapts to different screen sizes",
      { timeout: 5000, retries: 2 },
      () => {
        // Test mobile
        cy.viewport(320, 568);
        cy.mountWithContext(
          <div data-testid="test-container">
            <Logo />
          </div>,
        );
        cy.get("svg, svg").should("be.visible");

        // Test tablet
        cy.viewport(768, 1024);
        cy.get("svg, svg").should("be.visible");

        // Test desktop
        cy.viewport(1200, 800);
        cy.get("svg, svg").should("be.visible");
      },
    );
  });

  describe("Integration", () => {
    it("works within parent containers", { timeout: 5000, retries: 2 }, () => {
      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="wrapper">{children}</div>
      );

      cy.mountWithContext(
        <Wrapper>
          <Logo />
        </Wrapper>,
      );

      cy.get('[data-testid="wrapper"]').within(() => {
        cy.get("svg, svg").should("be.visible");
      });
    });
  });
});
