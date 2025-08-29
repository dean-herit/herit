import { defineConfig } from "drizzle-kit";

const stagingUrl = process.env.STAGING_POSTGRES_URL || process.env.POSTGRES_URL;

if (!stagingUrl) {
  throw new Error(
    "STAGING_POSTGRES_URL or POSTGRES_URL is required for staging migrations",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: stagingUrl,
  },
  verbose: true,
  strict: true,
  migrations: {
    table: "drizzle_migrations",
    schema: "public",
  },
  // Staging-specific settings
  introspect: {
    casing: "preserve",
  },
});
