/**
 * Universal Component Test Wrapper for Cypress
 * Modern 2025 implementation with App Router + TanStack Query + Auth context
 */

import React from 'react';
import { QueryClient } from '@tanstack/react-query';
import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { FormProvider, useForm } from 'react-hook-form';

// Import our custom providers
import { AppRouterProvider, type MockRouterProps } from './next-app-router-mock';
import { 
  QueryProviderWrapper, 
  createTestQueryClient,
  setupAuthInterceptors,
  setupAuthenticatedInterceptors,
  setupLoadingInterceptors
} from './query-client-setup';

/**
 * Authentication state configuration for testing
 */
export interface TestAuthState {
  user?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    onboarding_completed?: boolean;
    profile_photo_url?: string;
  } | null;
  isAuthenticated?: boolean;
  isSessionLoading?: boolean;
  authError?: string | null;
}

/**
 * Universal test wrapper configuration
 */
export interface UniversalTestWrapperProps {
  children: React.ReactNode;
  authState?: TestAuthState;
  routerProps?: MockRouterProps;
  queryClient?: QueryClient;
  theme?: 'light' | 'dark' | 'system';
  setupInterceptors?: boolean;
  formOptions?: {
    defaultValues?: Record<string, any>;
    mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  };
}

/**
 * FormProvider Test Wrapper Component
 * Provides react-hook-form context for form components
 */
const FormProviderWrapper: React.FC<{ children: React.ReactNode; options?: UniversalTestWrapperProps['formOptions'] }> = ({ 
  children, 
  options = {} 
}) => {
  const methods = useForm({
    defaultValues: {
      name: "",
      email: "test@example.com",
      phone: "",
      address_line_1: "",
      city: "",
      county: "",
      eircode: "",
      country: "Ireland",
      ...options.defaultValues,
    },
    mode: options.mode || 'onChange',
  });

  return (
    <FormProvider {...methods}>
      {children}
    </FormProvider>
  );
};

/**
 * Universal Test Wrapper Component
 * Provides all necessary context for component testing
 */
export const UniversalTestWrapper: React.FC<UniversalTestWrapperProps> = ({
  children,
  authState = { user: null, isAuthenticated: false, isSessionLoading: false },
  routerProps = {},
  queryClient,
  theme = 'light',
  setupInterceptors = true,
  formOptions,
}) => {
  // Create isolated QueryClient for this test if not provided
  const testQueryClient = queryClient || createTestQueryClient();

  // Note: API interceptors are set up in the mount commands, not in React component render

  // Set up auth session data in QueryClient directly
  React.useEffect(() => {
    const sessionData = authState.isAuthenticated && authState.user 
      ? { user: authState.user, error: authState.authError }
      : { user: null, error: authState.authError };
    
    // Set the session data in the query client
    testQueryClient.setQueryData(['auth', 'session'], sessionData);
  }, [authState, testQueryClient]);

  const content = formOptions ? (
    <FormProviderWrapper options={formOptions}>
      {children}
    </FormProviderWrapper>
  ) : children;

  return (
    <AppRouterProvider router={routerProps}>
      <QueryProviderWrapper queryClient={testQueryClient}>
        <HeroUIProvider>
          <NextThemesProvider
            attribute="class"
            defaultTheme={theme}
            themes={['light', 'dark']}
            enableSystem={false}
          >
            {content}
          </NextThemesProvider>
        </HeroUIProvider>
      </QueryProviderWrapper>
    </AppRouterProvider>
  );
};

/**
 * Cypress mount command with context
 */
export interface MountWithContextOptions extends UniversalTestWrapperProps {
  // Allow any additional mount options
  [key: string]: any;
}

export function mountWithContext(
  component: React.ReactElement,
  options: Omit<MountWithContextOptions, 'children'> = {}
) {
  const { authState, routerProps, queryClient, theme, setupInterceptors = true, ...mountOptions } = options;

  // Set up API interceptors BEFORE mounting React component
  if (setupInterceptors) {
    if (authState?.isSessionLoading) {
      setupLoadingInterceptors();
    } else if (authState?.isAuthenticated && authState?.user) {
      setupAuthenticatedInterceptors(authState.user);
    } else {
      setupAuthInterceptors();
    }
  }

  return cy.mount(
    <UniversalTestWrapper
      authState={authState}
      routerProps={routerProps}
      queryClient={queryClient}
      theme={theme}
      setupInterceptors={false} // Already set up above
    >
      {component}
    </UniversalTestWrapper>,
    mountOptions
  );
}

/**
 * Cypress command definitions
 */
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Mount a component with full testing context
       * Includes App Router, TanStack Query, auth mocking, and theme providers
       */
      mountWithContext(
        component: React.ReactElement,
        options?: Omit<MountWithContextOptions, 'children'>
      ): Chainable<any>;

      /**
       * Mount with authenticated user state
       */
      mountAuthenticated(
        component: React.ReactElement,
        user?: TestAuthState['user'],
        options?: Omit<MountWithContextOptions, 'children' | 'authState'>
      ): Chainable<any>;

      /**
       * Mount with loading state
       */
      mountLoading(
        component: React.ReactElement,
        options?: Omit<MountWithContextOptions, 'children' | 'authState'>
      ): Chainable<any>;

      /**
       * Mount with form provider context
       */
      mountWithForm(
        component: React.ReactElement,
        formOptions?: UniversalTestWrapperProps['formOptions'],
        options?: Omit<MountWithContextOptions, 'children' | 'formOptions'>
      ): Chainable<any>;
    }
  }
}

// Register the commands
Cypress.Commands.add('mountWithContext', mountWithContext);

Cypress.Commands.add('mountAuthenticated', (component, user = {
  id: 'test-user',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  onboarding_completed: true,
}, options = {}) => {
  const authState = {
    user,
    isAuthenticated: true,
    isSessionLoading: false,
  };
  
  return mountWithContext(component, {
    authState,
    ...options,
  });
});

Cypress.Commands.add('mountLoading', (component, options = {}) => {
  const authState = {
    user: null,
    isAuthenticated: false,
    isSessionLoading: true,
  };
  
  return mountWithContext(component, {
    authState,
    ...options,
  });
});

Cypress.Commands.add('mountWithForm', (component, formOptions = {}, options = {}) => {
  return mountWithContext(component, {
    formOptions,
    ...options,
  });
});

export default UniversalTestWrapper;