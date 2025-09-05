// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import "./commands";
import "@cypress/code-coverage/support";
import "@testing-library/cypress/add-commands";
import "cypress-real-events/support";

// Import shared testing utilities
import "./test-utils";
import "./integration-utils";

// Import modern 2025 component testing infrastructure
import "./next-app-router-mock";
import "./query-client-setup";
import "./universal-test-wrapper";

// Import commands.ts using ES2015 syntax:
import { mount } from "cypress/react";

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add("mount", mount);

// Example use:
// cy.mount(<MyComponent />)
