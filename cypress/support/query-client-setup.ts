/**
 * TanStack Query Test Configuration for Cypress Component Testing
 * Based on 2025 best practices - network-level mocking, isolated clients
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

/**
 * Creates a test-optimized QueryClient instance
 * - Zero retries to avoid timing issues in tests
 * - Suppressed error logging for cleaner test output
 * - Short cache times for predictable behavior
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        staleTime: 0,
        gcTime: 0, // Previously called cacheTime in v4
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
    // Suppress network error logging during tests
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

/**
 * Query Provider Wrapper for Component Testing
 * Provides isolated QueryClient instance per test
 */
export interface QueryProviderWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export const QueryProviderWrapper: React.FC<QueryProviderWrapperProps> = ({
  children,
  queryClient = createTestQueryClient(),
}) => {
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  );
};

/**
 * Common API interceptors for authentication endpoints
 * Use these in your tests for consistent auth mocking
 */
export const setupAuthInterceptors = () => {
  // Mock session endpoint - unauthenticated by default
  cy.intercept('GET', '/api/auth/session', {
    statusCode: 200,
    body: { user: null, isAuthenticated: false },
  }).as('authSession');

  // Mock login endpoint
  cy.intercept('POST', '/api/auth/login', {
    statusCode: 200,
    body: { success: true, user: { id: 'test-user', email: 'test@example.com' } },
  }).as('authLogin');

  // Mock logout endpoint  
  cy.intercept('POST', '/api/auth/logout', {
    statusCode: 200,
    body: { success: true },
  }).as('authLogout');

  // Mock refresh endpoint
  cy.intercept('POST', '/api/auth/refresh', {
    statusCode: 200,
    body: { success: true, user: { id: 'test-user', email: 'test@example.com' } },
  }).as('authRefresh');
};

/**
 * Sets up authenticated user interceptor
 */
export const setupAuthenticatedInterceptors = (user = {
  id: 'test-user',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  onboarding_completed: true,
}) => {
  cy.intercept('GET', '/api/auth/session', {
    statusCode: 200,
    body: { user, isAuthenticated: true },
  }).as('authSessionAuthenticated');
};

/**
 * Sets up loading state interceptor (delayed response)
 */
export const setupLoadingInterceptors = (delay: number = 1000) => {
  cy.intercept('GET', '/api/auth/session', (req) => {
    req.reply({ statusCode: 200, body: { user: null, isAuthenticated: false }, delay });
  }).as('authSessionLoading');
};

export default QueryProviderWrapper;