/**
 * Mock for Next.js navigation hooks in component tests
 * Handles useRouter and related navigation hooks
 */

// Create global mock functions that can be accessed by tests
declare global {
  interface Window {
    __NEXT_ROUTER_MOCK: {
      push: any;
      replace: any;
      back: any;
      forward: any;
      refresh: any;
      prefetch: any;
    };
  }
}

/**
 * Setup navigation mocks for a test
 * This should be called in beforeEach or individual tests
 */
export function setupNavigationMocks() {
  cy.window().then((win) => {
    // Create Cypress spies that can be accessed in tests
    const mockPush = cy.stub().as('router-push');
    const mockReplace = cy.stub().as('router-replace');
    const mockBack = cy.stub().as('router-back'); 
    const mockForward = cy.stub().as('router-forward');
    const mockRefresh = cy.stub().as('router-refresh');
    const mockPrefetch = cy.stub().as('router-prefetch').resolves();
    
    // Store mocks on window for module mocking
    win.__NEXT_ROUTER_MOCK = {
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
      forward: mockForward,
      refresh: mockRefresh,
      prefetch: mockPrefetch,
    };
  });
}

/**
 * Mock implementation of useRouter hook
 * This will be used to replace the real useRouter
 */
export function mockUseRouter() {
  if (typeof window !== 'undefined' && window.__NEXT_ROUTER_MOCK) {
    return window.__NEXT_ROUTER_MOCK;
  }
  
  // Fallback for cases where window mock isn't set up
  return {
    push: cy.stub().as('router-push-fallback'),
    replace: cy.stub().as('router-replace-fallback'),
    back: cy.stub().as('router-back-fallback'),
    forward: cy.stub().as('router-forward-fallback'),
    refresh: cy.stub().as('router-refresh-fallback'),
    prefetch: cy.stub().as('router-prefetch-fallback').resolves(),
  };
}

/**
 * Mock implementation for usePathname
 */
export function mockUsePathname() {
  return '/test-path';
}

/**
 * Mock implementation for useSearchParams
 */
export function mockUseSearchParams() {
  return new URLSearchParams('?test=value');
}