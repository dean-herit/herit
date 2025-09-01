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
    table: "drizzle_migrations",
    schema: "public",
  },
  // Development-specific settings
  introspect: {
    casing: "preserve",
  },
});
