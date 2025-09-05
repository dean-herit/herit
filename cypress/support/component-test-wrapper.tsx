/**
 * Universal Component Test Wrapper
 * Provides all necessary context providers for component testing
 * Fixes useRouter/useAuth issues by providing proper mocks
 */

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the useAuth hook to return stable values
const createMockUseAuth = () => ({
  user: null,
  isAuthenticated: false,
  authError: null,
  isSessionLoading: false,
  sessionError: null,
  refetchSession: () => Promise.resolve(),
  login: () => {},
  signup: () => {},
  logout: () => {},
  refreshToken: () => {},
  isLoggingIn: false,
  isSigningUp: false,
  isLoggingOut: false,
  isRefreshing: false,
  loginError: null,
  signupError: null,
  logoutError: null,
  refreshError: null,
});

// Mock the useRouter hook to return stable values  
const createMockUseRouter = () => ({
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
});

export interface ComponentTestWrapperProps {
  children: React.ReactNode;
  authState?: {
    user?: any;
    isAuthenticated?: boolean;
    isSessionLoading?: boolean;
  };
}

/**
 * Universal test wrapper that provides all necessary context
 */
export const ComponentTestWrapper: React.FC<ComponentTestWrapperProps> = ({ 
  children, 
  authState = {} 
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Mock useAuth hook with custom state
  const mockUseAuth = () => ({
    ...createMockUseAuth(),
    ...authState,
  });

  // Set up mocks before rendering
  React.useEffect(() => {
    // Mock the auth hook
    if (typeof window !== 'undefined') {
      // Store original implementations
      const originalUseAuth = require('@/app/hooks/useAuth').useAuth;
      const originalUseRouter = require('next/navigation').useRouter;
      
      // Apply mocks
      require('@/app/hooks/useAuth').useAuth = mockUseAuth;
      require('next/navigation').useRouter = createMockUseRouter;
      
      // Cleanup on unmount
      return () => {
        require('@/app/hooks/useAuth').useAuth = originalUseAuth;
        require('next/navigation').useRouter = originalUseRouter;
      };
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Cypress command to mount components with proper context
 */
export const mountWithContext = (
  component: React.ReactElement,
  options: ComponentTestWrapperProps = {}
) => {
  const { authState, ...wrapperProps } = options;
  
  return cy.mount(
    <ComponentTestWrapper authState={authState} {...wrapperProps}>
      {component}
    </ComponentTestWrapper>
  );
};

// Add to Cypress commands
declare global {
  namespace Cypress {
    interface Chainable {
      mountWithContext: typeof mountWithContext;
    }
  }
}

Cypress.Commands.add('mountWithContext', mountWithContext);

export default ComponentTestWrapper;