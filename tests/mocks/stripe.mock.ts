/**
 * Stripe Mock Stub
 * Placeholder for Stripe service mocking
 */

import { vi } from 'vitest';

export const mockStripe = {
  paymentIntent: {
    create: vi.fn().mockResolvedValue({
      id: 'pi_test123',
      status: 'succeeded',
    }),
  },
  timeout: vi.fn(),
  error: vi.fn(),
};

export default mockStripe;