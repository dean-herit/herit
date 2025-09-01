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
  console.log(
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

// Check for @heroui package import patterns that might fail in Vercel
try {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  // Check specifically for @heroui packages
  const { stdout } = await execAsync(
    "npm ls @heroui/link @heroui/system @heroui/navbar 2>/dev/null || true",
  );

  if (stdout.includes("extraneous")) {
    console.log(
      "⚠️  Found extraneous @heroui packages that might not be available in Vercel",
    );
    console.log(
      "    Recommended: Import from '@heroui/react' instead of individual packages",
    );
  }

  // Check for problematic import patterns in source files
  const { exec: exec2 } = await import("child_process");
  const grepResult = await execAsync(
    'grep -r "from [\'\\"]@heroui/" components/ app/ --include="*.tsx" --include="*.ts" 2>/dev/null || true',
  );

  if (grepResult.stdout) {
    const lines = grepResult.stdout
      .trim()
      .split("\n")
      .filter((line) => line);
    const problematicImports = lines.filter(
      (line) =>
        !line.includes("@heroui/react") &&
        !line.includes("@heroui/theme") &&
        line.includes("@heroui/"),
    );

    if (problematicImports.length > 0) {
      console.log(
        "⚠️  Found direct @heroui package imports that might fail in Vercel:",
      );
      problematicImports.forEach((line) => console.log(`    ${line}`));
      console.log(
        "    Recommended: Use '@heroui/react' for all component imports",
      );
    }
  }
} catch (error) {
  console.log("⚠️  Could not check @heroui import patterns:", error.message);
}

// Check for Cypress version compatibility
if (allDeps.cypress) {
  const cypressVersion = allDeps.cypress.replace(/[^\d.]/g, "");
  const majorCypress = parseInt(cypressVersion.split(".")[0]);

  // Check Testing Library Cypress compatibility
  if (allDeps["@testing-library/cypress"] && majorCypress >= 15) {
    console.log(
      "⚠️  @testing-library/cypress may have compatibility issues with Cypress v15+",
    );
  }

  // Check cypress-real-events compatibility
  if (allDeps["cypress-real-events"] && majorCypress >= 15) {
    console.log(
      "⚠️  cypress-real-events may have compatibility issues with Cypress v15+",
    );
  }
}

// Check for import resolution issues with direct import tests
console.log("🔍 Checking for import resolution issues...");

try {
  // Test common problematic imports by trying to resolve them
  const fs = await import("fs/promises");
  const path = await import("path");

  const problematicImports = [
    {
      file: "components/LayoutWrapper.tsx",
      imports: ["@heroui/link", "@/components/navbar"],
    },
    { file: "app/providers.tsx", imports: ["@heroui/react"] },
    { file: "components/navbar.tsx", imports: ["@heroui/navbar"] },
  ];

  for (const { file, imports } of problematicImports) {
    try {
      const filePath = path.default.resolve(file);
      const fileExists = await fs.default
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        console.log(`🔍 Checking imports in ${file}...`);
        const content = await fs.default.readFile(filePath, "utf8");

        for (const importName of imports) {
          if (content.includes(`from "${importName}"`)) {
            // Try to resolve the module
            try {
              if (importName.startsWith("@heroui/")) {
                // Check if the HeroUI module exists
                const modulePath = path.default.resolve(
                  "node_modules",
                  importName,
                  "dist",
                  "index.d.ts",
                );
                await fs.default.access(modulePath);
                console.log(`✅ ${importName} resolves correctly`);
              } else if (importName.startsWith("@/")) {
                // Check if local module exists
                const localPath = importName.replace("@/", "./");
                const tsPath = path.default.resolve(localPath + ".ts");
                const tsxPath = path.default.resolve(localPath + ".tsx");
                const indexPath = path.default.resolve(localPath, "index.ts");
                const indexTsxPath = path.default.resolve(
                  localPath,
                  "index.tsx",
                );

                const exists = await Promise.all([
                  fs.default
                    .access(tsPath)
                    .then(() => true)
                    .catch(() => false),
                  fs.default
                    .access(tsxPath)
                    .then(() => true)
                    .catch(() => false),
                  fs.default
                    .access(indexPath)
                    .then(() => true)
                    .catch(() => false),
                  fs.default
                    .access(indexTsxPath)
                    .then(() => true)
                    .catch(() => false),
                ]);

                if (exists.some((e) => e)) {
                  console.log(`✅ ${importName} resolves correctly`);
                } else {
                  console.error(
                    `❌ Cannot resolve module: ${importName} in ${file}`,
                  );
                  console.error(
                    `Tried paths: ${tsPath}, ${tsxPath}, ${indexPath}, ${indexTsxPath}`,
                  );
                  process.exit(1);
                }
              }
            } catch (error) {
              console.error(
                `❌ Cannot resolve module: ${importName} in ${file}`,
              );
              console.error(`Error: ${error.message}`);
              process.exit(1);
            }
          }
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not check ${file}: ${error.message}`);
    }
  }

  console.log("✅ Import resolution check passed");
} catch (error) {
  console.log("⚠️  Could not run import resolution check:", error.message);
}

console.log("✅ Vercel environment check completed");
