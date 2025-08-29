import { defineConfig } from "drizzle-kit";

const prodUrl = process.env.PRODUCTION_POSTGRES_URL || process.env.POSTGRES_URL;

if (!prodUrl) {
  throw new Error(
    "PRODUCTION_POSTGRES_URL or POSTGRES_URL is required for production migrations",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: prodUrl,
  },
  verbose: true,
  strict: true,
  migrations: {
    table: "drizzle_migrations",
    schema: "public",
  },
  // Production-specific settings - extra safety
  introspect: {
    casing: "preserve",
  },
});
