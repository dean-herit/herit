/**
 * Next.js App Router Mock Infrastructure for Cypress Component Testing
 * Based on 2025 best practices and proven solutions
 */

import React from 'react';

// Import the internal Next.js App Router context
// This is the proper way to handle Next.js 15 App Router in component tests
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface MockRouterProps {
  pathname?: string;
  searchParams?: URLSearchParams;
  push?: (href: string, options?: any) => void;
  replace?: (href: string, options?: any) => void;
  back?: () => void;
  forward?: () => void;
  refresh?: () => void;
  prefetch?: (href: string, options?: any) => Promise<void>;
}

/**
 * Creates a mock App Router instance with Cypress spies
 * This solves the "invariant expected app router to be mounted" error
 */
export function createMockAppRouter(params: MockRouterProps = {}): AppRouterInstance {
  return {
    back: params.back || cy.spy().as('router-back'),
    forward: params.forward || cy.spy().as('router-forward'),
    prefetch: params.prefetch || cy.stub().as('router-prefetch').resolves(),
    push: params.push || cy.spy().as('router-push'),
    replace: params.replace || cy.spy().as('router-replace'),
    refresh: params.refresh || cy.spy().as('router-refresh'),
    ...params,
  } as AppRouterInstance;
}

/**
 * App Router Context Provider Wrapper
 * Wraps components to provide Next.js App Router context during testing
 */
export interface AppRouterProviderProps {
  children: React.ReactNode;
  router?: MockRouterProps;
}

export const AppRouterProvider: React.FC<AppRouterProviderProps> = ({ 
  children, 
  router = {} 
}) => {
  const mockRouter = createMockAppRouter(router);
  
  return React.createElement(
    AppRouterContext.Provider,
    { value: mockRouter },
    children
  );
};

/**
 * Cypress command type definitions
 */
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Get the router spy by alias name
       * @example cy.getRouterSpy('router-push').should('have.been.calledWith', '/dashboard')
       */
      getRouterSpy(alias: string): Chainable<any>;
    }
  }
}

/**
 * Helper command to access router spies in tests
 */
Cypress.Commands.add('getRouterSpy', (alias: string) => {
  return cy.get(`@${alias}`);
});

export default AppRouterProvider;