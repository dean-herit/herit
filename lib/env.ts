import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Database
    POSTGRES_URL: z.string().url().min(1, "Database URL is required"),

    // Authentication
    SESSION_SECRET: z
      .string()
      .min(32, "Session secret must be at least 32 characters"),
    REFRESH_SECRET: z
      .string()
      .min(32, "Refresh secret must be at least 32 characters")
      .optional(),

    // OAuth - Google
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REDIRECT_URI: z.string().url().optional(),

    // OAuth - GitHub
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // Vercel (optional)
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    VERCEL_OIDC_TOKEN: z.string().optional(),

    // Node Environment
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  client: {
    // Public environment variables go here
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },

  // Runtime validation
  runtimeEnv: {
    // Server
    POSTGRES_URL: process.env.POSTGRES_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    REFRESH_SECRET: process.env.REFRESH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
    NODE_ENV: process.env.NODE_ENV,

    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // Only allow skipping validation in development
  skipValidation:
    process.env.NODE_ENV === "development" && !!process.env.SKIP_ENV_VALIDATION,

  // Make it clear when we're in production but missing vars
  emptyStringAsUndefined: true,
});
