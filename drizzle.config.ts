import { defineConfig } from "drizzle-kit";

import { env } from "./app/lib/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: env.POSTGRES_URL,
  },
  verbose: true,
  strict: true,
  migrations: {
    table: "drizzle_migrations", // Standardized migration tracking table
    schema: "public", // Keep migrations in public schema
  },
});
