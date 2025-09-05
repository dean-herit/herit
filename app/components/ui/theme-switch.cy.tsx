/**
 * ThemeSwitch Component Test
 * Simplified, bulletproof test following GoogleSignInButton pattern
 */

import React from "react";
import { ThemeProvider } from "next-themes";

import { ThemeSwitch } from "./theme-switch";

// Mock theme provider for testing
const TestThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider
    attribute="class"
    defaultTheme="light"
    themes={["light", "dark"]}
    enableSystem={false}
  >
    {children}
  </ThemeProvider>
);

describe("ThemeSwitch", () => {
  describe("Core Functionality", () => {
    it("renders without crashing", () => {
      cy.mount(
        <TestThemeProvider>
          <ThemeSwitch />
        </TestThemeProvider>,
      );
      cy.get('[data-testid="theme-switch"]').should("be.visible");
    });

    it("has toggle input", () => {
      cy.mount(
        <TestThemeProvider>
          <ThemeSwitch />
        </TestThemeProvider>,
      );
      cy.get('[data-testid="button"]').should("exist");
    });

    it("shows sun or moon icon", () => {
      cy.mount(
        <TestThemeProvider>
          <ThemeSwitch />
        </TestThemeProvider>,
      );
      cy.get("svg").should("be.visible");
    });

    it("is clickable", () => {
      cy.mount(
        <TestThemeProvider>
          <ThemeSwitch />
        </TestThemeProvider>,
      );
      cy.get('[data-testid="theme-switch"]').click();
      // Test passes if no error occurs during click
    });
  });
});
