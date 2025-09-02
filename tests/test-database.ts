/**
 * Test Database Stub
 * Placeholder for database testing utilities
 */

export const testDb = {
  query: {
    users: {
      findFirst: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
    },
  },
  select: () => Promise.resolve([]),
  insert: () => Promise.resolve({}),
  update: () => Promise.resolve({}),
  delete: () => Promise.resolve({}),
};

export default testDb;