#!/usr/bin/env node

/**
 * Vercel Environment Check
 * Simulates Vercel's environment to catch issues early
 */

console.log("🔍 Checking Vercel-like environment compatibility...");

// Check Node.js version (Vercel uses Node 18/20)
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);

if (majorVersion < 18) {
  console.error(
    `❌ Node.js version ${nodeVersion} is too old. Vercel requires Node.js 18+`,
  );
  process.exit(1);
}

console.log(`✅ Node.js version ${nodeVersion} is compatible`);

// Check for ES modules compatibility
console.log("🔍 Checking ES modules configuration...");

const packageJson = await import("./package.json", { with: { type: "json" } });

if (packageJson.default.type === "module") {
  console.log("✅ Package configured as ES module");

  // Check that config files are ES module compatible
  const configFiles = [
    "next.config.js",
    "tailwind.config.js",
    "postcss.config.js",
  ];

  for (const configFile of configFiles) {
    try {
      // Try to read the file and check for CommonJS syntax
      const fs = await import("fs/promises");
      const path = await import("path");

      const filePath = path.default.resolve(configFile);
      const content = await fs.default.readFile(filePath, "utf8");

      if (content.includes("module.exports") || content.includes("require(")) {
        console.error(
          `❌ ${configFile} contains CommonJS syntax but package.json is set to ES modules`,
        );
        process.exit(1);
      }

      console.log(`✅ ${configFile} is ES module compatible`);
    } catch (error) {
      // File might not exist, which is fine
      if (error.code !== "ENOENT") {
        console.warn(`⚠️  Could not check ${configFile}: ${error.message}`);
      }
    }
  }
} else {
  console.log("✅ Package configured as CommonJS");
}

// Check for critical environment variables
console.log("🔍 Checking environment variables...");

const criticalEnvVars = ["POSTGRES_URL", "SESSION_SECRET", "REFRESH_SECRET"];

const missingEnvVars = criticalEnvVars.filter(
  (varName) => !process.env[varName],
);

if (missingEnvVars.length > 0) {
  console.warn(
    `⚠️  Missing environment variables (these will be needed in production): ${missingEnvVars.join(", ")}`,
  );
} else {
  console.log("✅ All critical environment variables are set");
}

// Check dependencies for known Vercel issues
console.log("🔍 Checking for known dependency issues...");

const dependencies = packageJson.default.dependencies || {};
const devDependencies = packageJson.default.devDependencies || {};
const allDeps = { ...dependencies, ...devDependencies };

// Check for Cypress version compatibility
if (allDeps.cypress) {
  const cypressVersion = allDeps.cypress.replace(/[^\d.]/g, "");
  const majorCypress = parseInt(cypressVersion.split(".")[0]);

  // Check Testing Library Cypress compatibility
  if (allDeps["@testing-library/cypress"] && majorCypress >= 15) {
    console.warn(
      "⚠️  @testing-library/cypress may have compatibility issues with Cypress v15+",
    );
  }

  // Check cypress-real-events compatibility
  if (allDeps["cypress-real-events"] && majorCypress >= 15) {
    console.warn(
      "⚠️  cypress-real-events may have compatibility issues with Cypress v15+",
    );
  }
}

console.log("✅ Vercel environment check completed");
