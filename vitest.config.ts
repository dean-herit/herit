import path from "path";

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "**/*.{test,spec}.{js,ts,jsx,tsx}",
      "tests/**/*.{test,spec}.{js,ts,jsx,tsx}",
    ],
    exclude: [
      "node_modules",
      "dist",
      ".next",
      "cypress",
      "storybook-static",
      ".storybook",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "*.config.ts",
        "*.config.js",
        ".next/",
        "cypress/",
        ".storybook/",
        "storybook-static/",
        "coverage/",
        "dist/",
        "**/*.d.ts",
        "**/*.stories.{js,ts,jsx,tsx}",
        "tools/",
        "scripts/",
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    // Mock environment variables for tests
    env: {
      NODE_ENV: "test",
      POSTGRES_URL: "postgresql://test:test@localhost:5432/test_db",
      SESSION_SECRET: "test-session-secret-for-vitest-testing-only",
      REFRESH_SECRET: "test-refresh-secret-for-vitest-testing-only",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@/components": path.resolve(__dirname, "./components"),
      "@/lib": path.resolve(__dirname, "./lib"),
      "@/db": path.resolve(__dirname, "./db"),
      "@/hooks": path.resolve(__dirname, "./hooks"),
      "@/types": path.resolve(__dirname, "./types"),
      "@/app": path.resolve(__dirname, "./app"),
    },
  },
});
