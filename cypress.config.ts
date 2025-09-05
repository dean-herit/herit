import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "herit-estate",
  // Performance optimizations - disable video/screenshots for faster runs
  video: process.env.CI === "true", // Only record video in CI
  videoCompression: 32,
  videosFolder: "cypress/videos",
  screenshotsFolder: "cypress/screenshots",
  screenshotOnRunFailure: process.env.CI === "true", // Only screenshots in CI
  retries: { runMode: 1, openMode: 0 }, // Reduce retries for speed
  viewportWidth: 1280,
  viewportHeight: 720,
  // Aggressive timeout optimizations
  defaultCommandTimeout: 4000, // Reduced from 10000
  requestTimeout: 5000, // Reduced from 10000
  responseTimeout: 5000, // Reduced from 10000
  pageLoadTimeout: 10000, // Explicit page load timeout
  reporter: "spec",
  // Enhanced parallel execution settings with aggressive memory management
  numTestsKeptInMemory: 3, // Reduced to 3 for better memory management
  experimentalMemoryManagement: true,
  experimentalSourceRewriting: false, // Disable for performance
  // Additional memory optimizations
  trashAssetsBeforeRuns: true, // Clear assets before each run
  // Record key for Cypress Dashboard (for parallelization)
  // recordKey: process.env.CYPRESS_RECORD_KEY,
  // Cross-browser testing configuration
  chromeWebSecurity: false,
  userAgent: null, // Let browser set default user agent
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      require("@cypress/code-coverage/task")(on, config);

      // Database tasks
      on("task", {
        "db:seed": require("./cypress/tasks/db-tasks").seed,
        "db:clean": require("./cypress/tasks/db-tasks").clean,
        "db:verify-audit": require("./cypress/tasks/db-tasks").verifyAudit,
        "db:get-user-assets": require("./cypress/tasks/db-tasks").getUserAssets,
        "db:get-user-beneficiaries": require("./cypress/tasks/db-tasks")
          .getUserBeneficiaries,
        // Real Authentication tasks
        createAuthenticatedTestUser: require("./cypress/tasks/auth-tasks")
          .createAuthenticatedTestUser,
        cleanupTestUser: require("./cypress/tasks/auth-tasks").cleanupTestUser,
        cleanupAllTestUsers: require("./cypress/tasks/auth-tasks")
          .cleanupAllTestUsers,
      });

      return config;
    },
  },
  component: {
    devServer: {
      framework: "next", // Use 'next' not 'react' for Next.js 15
      bundler: "webpack", // Next.js uses webpack, not vite
      // Performance optimizations for dev server with memory management
      webpackConfig: {
        optimization: {
          splitChunks: false, // Disable code splitting for faster builds
          removeAvailableModules: false, // Reduce memory usage
          removeEmptyChunks: false, // Reduce memory usage
          mergeDuplicateChunks: false, // Reduce processing overhead
        },
        devtool: false, // Disable source maps for speed
        resolve: {
          // Reduce resolver overhead
          symlinks: false,
          cacheWithContext: false,
        },
        // Memory management for Node.js
        node: {
          __filename: false,
          __dirname: false,
        },
        // Reduce chunk processing overhead
        performance: {
          hints: false, // Disable performance hints
        },
      },
    },
    supportFile: "cypress/support/component.ts",
    specPattern: [
      "components/**/*.cy.{js,jsx,ts,tsx}",
      "app/**/*.cy.{js,jsx,ts,tsx}",
      "providers/**/*.cy.{js,jsx,ts,tsx}",
    ], // Colocated tests
    indexHtmlFile: "cypress/support/component-index.html",
    // Component test optimizations
    experimentalSingleTabRunMode: true, // Use single tab for all component tests
    // Note: testIsolation is not available for component tests
    setupNodeEvents(on, config) {
      // Same tasks for component tests
      on("task", {
        createAuthenticatedTestUser: require("./cypress/tasks/auth-tasks")
          .createAuthenticatedTestUser,
        cleanupTestUser: require("./cypress/tasks/auth-tasks").cleanupTestUser,
        cleanupAllTestUsers: require("./cypress/tasks/auth-tasks")
          .cleanupAllTestUsers,
      });

      return config;
    },
  },
});
