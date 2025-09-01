import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "herit-estate",
  video: true,
  videoCompression: 32,
  videosFolder: "cypress/videos",
  screenshotsFolder: "cypress/screenshots",
  retries: { runMode: 2, openMode: 0 },
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 10000,
  reporter: "spec",
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
      });

      return config;
    },
  },
  component: {
    devServer: {
      framework: "next", // Use 'next' not 'react' for Next.js 15
      bundler: "webpack", // Next.js uses webpack, not vite
    },
    supportFile: "cypress/support/component.ts",
    specPattern: [
      "components/**/*.cy.{js,jsx,ts,tsx}",
      "app/**/*.cy.{js,jsx,ts,tsx}",
      "providers/**/*.cy.{js,jsx,ts,tsx}",
    ], // Colocated tests
    indexHtmlFile: "cypress/support/component-index.html",
  },
});
