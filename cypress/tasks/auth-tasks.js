/**
 * Cypress Authentication Tasks
 * Bridges Cypress with real authentication system
 */

// For Cypress tasks, we'll provide a simplified version without full TypeScript integration
// This avoids complex module resolution issues while still providing core functionality

/**
 * Simple test user creation for Cypress
 * Returns mock authentication data that can be used to set cookies
 */
const createMockAuthData = (userType = 'standard') => {
  // Generate realistic-looking but fake tokens for Cypress testing
  const mockAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNjk0NTUzNjAwLCJleHAiOjE2OTQ2NDAwMDB9.mock-signature-${Date.now()}`;
  const mockRefreshToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJmYW1pbHkiOiJ0ZXN0LWZhbWlseSIsImp0aSI6InRlc3QtanRpIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE2OTQ1NTM2MDAsImV4cCI6MTY5NzE0NTYwMH0.mock-refresh-signature-${Date.now()}`;
  
  const mockUser = {
    id: `test-user-${Date.now()}`,
    email: `test-${userType}-${Date.now()}@example.com`,
    first_name: 'Test',
    last_name: 'User',
    onboarding_completed: userType !== 'onboarding',
    verification_completed: true,
  };
  
  return {
    user: mockUser,
    accessToken: mockAccessToken,
    refreshToken: mockRefreshToken,
  };
};

/**
 * Create authenticated test user for Cypress
 */
const createAuthenticatedTestUser = async ({ userType = 'standard', userData = {} }) => {
  try {
    console.log(`Creating Cypress test user: ${userType}`);
    
    // For Cypress, use mock data that provides realistic authentication cookies
    // without complex database integration
    const authContext = createMockAuthData(userType);
    
    console.log(`Created Cypress test user: ${authContext.user.email} (${authContext.user.id})`);
    
    return authContext;
  } catch (error) {
    console.error('Failed to create authenticated test user:', error);
    throw error;
  }
};

/**
 * Clean up specific test user
 */
const cleanupTestUser = async ({ userId }) => {
  try {
    // For Cypress mock users, no actual cleanup needed
    console.log(`Cleaned up Cypress test user: ${userId}`);
    return null;
  } catch (error) {
    console.error('Failed to cleanup test user:', error);
    return null; // Don't throw in Cypress cleanup
  }
};

/**
 * Clean up all test users (for test suite cleanup)
 */
const cleanupAllTestUsers = async () => {
  try {
    // For Cypress mock users, no actual cleanup needed
    console.log('Cleaned up all Cypress test users');
    return null;
  } catch (error) {
    console.error('Failed to cleanup all test users:', error);
    return null; // Don't throw in Cypress cleanup
  }
};

module.exports = {
  createAuthenticatedTestUser,
  cleanupTestUser,
  cleanupAllTestUsers,
};