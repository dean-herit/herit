#!/usr/bin/env node
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import path from "node:path";

import { program } from "commander";

const out = ".artifacts";
const file = path.join(out, "last-run.json");
const historyFile = path.join(out, "test-history.jsonl");

interface TestResult {
  task: string;
  passed: boolean;
  durationMs: number;
  cmd: string;
  timestamp: string;
  output: string;
  exitCode?: number;
  error?: string;
}

function run(cmd: string, task: string, options: { timeout?: number } = {}) {
  const t0 = Date.now();
  let ok = true;
  let output = "";
  let exitCode = 0;
  let error = "";

  try {
    console.log(`🚀 Running: ${task}`);
    console.log(`📝 Command: ${cmd}`);

    output = execSync(cmd, {
      encoding: "utf-8",
      env: { ...process.env, FORCE_COLOR: "0" },
      timeout: options.timeout || 120000, // 2 minutes default
    }).toString();

    console.log(`✅ Completed: ${task}`);
  } catch (e: any) {
    ok = false;
    exitCode = e.status || 1;
    output = e.stdout || "";
    error = e.stderr || e.message || "Unknown error";

    console.log(`❌ Failed: ${task}`);
    console.log(`💥 Error: ${error}`);
  }

  const result: TestResult = {
    task,
    passed: ok,
    durationMs: Date.now() - t0,
    cmd,
    timestamp: new Date().toISOString(),
    output: output.slice(0, 2000), // Limit output size
    exitCode,
    ...(error && { error: error.slice(0, 1000) }),
  };

  // Ensure output directory exists
  mkdirSync(out, { recursive: true });

  // Write latest result
  writeFileSync(file, JSON.stringify(result, null, 2));

  // Append to history
  appendFileSync(historyFile, JSON.stringify(result) + "\n");

  // Pretty print result
  console.log("\n📊 Result Summary:");
  console.log(`   Status: ${ok ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(`   Duration: ${result.durationMs}ms`);
  console.log(`   Exit Code: ${exitCode}`);

  if (!ok) {
    console.log(`   Error: ${error}`);
  }

  console.log(`\n📁 Results saved to: ${file}`);
  console.log(`📜 History updated: ${historyFile}`);

  process.exit(ok ? 0 : 1);
}

// Core build commands
program
  .command("build")
  .description("Build the Next.js application")
  .action(() => run("pnpm build", "build"));

program
  .command("typecheck")
  .description("Run TypeScript type checking")
  .action(() => run("pnpm tsc --noEmit --skipLibCheck", "typecheck"));

program
  .command("lint")
  .description("Run ESLint with auto-fix")
  .action(() => run("pnpm eslint --fix .", "lint"));

// Test commands
program
  .command("test:unit")
  .description("Run Vitest unit tests")
  .action(() => run("pnpm vitest run", "test:unit"));

program
  .command("test:unit:watch")
  .description("Run Vitest in watch mode")
  .action(() => run("pnpm vitest watch", "test:unit:watch"));

program
  .command("test:ct")
  .description("Run Cypress component tests")
  .action(() => run("pnpm cypress run --component", "test:ct"));

program
  .command("test:e2e")
  .description("Run Cypress E2E tests")
  .action(() => run("pnpm cypress run --e2e", "test:e2e"));

program
  .command("test:headed")
  .description("Run Cypress E2E tests in headed mode")
  .action(() => run("pnpm cypress run --headed --e2e", "test:headed"));

program
  .command("storybook:test")
  .description("Run Storybook tests")
  .option("--url <url>", "Storybook URL", "http://localhost:6006")
  .action((options) => {
    const cmd = `pnpm test-storybook --url ${options.url} --watch=false`;

    run(cmd, "storybook:test");
  });

// Database commands
program
  .command("test:db")
  .description("Validate database schema")
  .action(() => run("pnpm db:validate", "db:validate"));

program
  .command("test:security")
  .description("Run security audit")
  .action(() => run("pnpm audit --audit-level=high", "security"));

// Utility commands
program
  .command("clean")
  .description("Clean test artifacts")
  .action(() => {
    try {
      if (existsSync(".artifacts")) {
        execSync("rm -rf .artifacts", { stdio: "inherit" });
      }
      if (existsSync("cypress/videos")) {
        execSync("rm -rf cypress/videos", { stdio: "inherit" });
      }
      if (existsSync("cypress/screenshots")) {
        execSync("rm -rf cypress/screenshots", { stdio: "inherit" });
      }
      console.log("✅ Test artifacts cleaned");
    } catch (error) {
      console.error("❌ Failed to clean artifacts:", error);
      process.exit(1);
    }
  });

program
  .command("history")
  .description("Show test execution history")
  .option("--limit <n>", "Number of entries to show", "10")
  .action((options) => {
    try {
      if (!existsSync(historyFile)) {
        console.log("📜 No test history found");

        return;
      }

      const lines = require("fs")
        .readFileSync(historyFile, "utf-8")
        .split("\n")
        .filter(Boolean)
        .slice(-parseInt(options.limit));

      console.log(`📜 Last ${lines.length} test runs:\n`);

      lines.forEach((line: string, index: number) => {
        const result = JSON.parse(line);
        const status = result.passed ? "✅" : "❌";
        const duration = `${result.durationMs}ms`;
        const time = new Date(result.timestamp).toLocaleString();

        console.log(
          `${index + 1}. ${status} ${result.task} (${duration}) - ${time}`,
        );

        if (!result.passed && result.error) {
          console.log(`   💥 ${result.error.slice(0, 100)}...`);
        }
      });
    } catch (error) {
      console.error("❌ Failed to read history:", error);
      process.exit(1);
    }
  });

// Meta commands
program
  .command("status")
  .description("Show current test infrastructure status")
  .action(() => {
    console.log("🔍 Test Infrastructure Status:\n");

    const checks = [
      { name: "Storybook config", path: ".storybook/main.ts" },
      { name: "Cypress config", path: "cypress.config.ts" },
      { name: "Vitest config", path: "vitest.config.ts" },
      { name: "MSW handlers", path: "src/mocks/handlers.ts" },
      { name: "Test artifacts dir", path: ".artifacts" },
      { name: "pnpm lockfile", path: "pnpm-lock.yaml" },
    ];

    checks.forEach((check) => {
      const exists = existsSync(check.path);
      const status = exists ? "✅" : "❌";

      console.log(`${status} ${check.name}: ${check.path}`);
    });

    console.log("\n📦 Key Dependencies:");
    try {
      const pkg = JSON.parse(
        require("fs").readFileSync("package.json", "utf-8"),
      );
      const deps = ["cypress", "vitest", "storybook", "msw"];

      deps.forEach((dep) => {
        const version = pkg.devDependencies?.[dep] || pkg.dependencies?.[dep];

        if (version) {
          console.log(`✅ ${dep}: ${version}`);
        } else {
          console.log(`❌ ${dep}: not found`);
        }
      });
    } catch (error) {
      console.log("❌ Failed to read package.json");
    }
  });

program.parse();
