/**
 * Auth Mock Stub
 * Placeholder for authentication mocking utilities
 */

import { vi } from 'vitest';

export const createMockSession = vi.fn(() => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}));

export const mockAuthSuccess = vi.fn();
export const mockAuthFailure = vi.fn();