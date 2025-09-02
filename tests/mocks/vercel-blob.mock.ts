/**
 * Vercel Blob Mock Stub
 * Placeholder for Vercel Blob service mocking
 */

import { vi } from 'vitest';

export const mockVercelBlob = {
  put: vi.fn().mockResolvedValue({
    url: 'https://blob.vercel.com/test-file.pdf',
    downloadUrl: 'https://blob.vercel.com/download/test-file.pdf',
  }),
  del: vi.fn().mockResolvedValue(undefined),
  list: vi.fn().mockResolvedValue({ blobs: [] }),
};

export default mockVercelBlob;