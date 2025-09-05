/**
 * AST-based Test Counter - Real test counting instead of guessing
 * Scans actual test files to count tests programmatically
 */

import * as fs from "fs";
import * as path from "path";

import * as ts from "typescript";
import { glob } from "glob";

export interface TestCounts {
  componentTests: {
    total: number;
    files: number;
    fileDetails: { [filename: string]: number };
  };
  backendTests: {
    total: number;
    files: number;
    fileDetails: { [filename: string]: number };
  };
  totalTests: number;
  totalFiles: number;
  lastScan: string;
  scanDuration: number;
}

export class TestCounter {
  /**
   * Main entry point - scan all tests and return real counts
   */
  static async scanAllTests(): Promise<TestCounts> {
    const startTime = Date.now();

    const componentTestCounts = await this.scanComponentTests();
    const backendTestCounts = await this.scanBackendTests();

    const totalTests = componentTestCounts.total + backendTestCounts.total;
    const totalFiles = componentTestCounts.files + backendTestCounts.files;

    return {
      componentTests: componentTestCounts,
      backendTests: backendTestCounts,
      totalTests,
      totalFiles,
      lastScan: new Date().toISOString(),
      scanDuration: Date.now() - startTime,
    };
  }

  /**
   * Scan all Cypress component test files (.cy.tsx)
   */
  private static async scanComponentTests() {
    const componentTestFiles = await glob("**/*.cy.tsx", {
      cwd: process.cwd(),
      ignore: ["node_modules/**", ".next/**", "dist/**"],
    });

    let totalTests = 0;
    const fileDetails: { [filename: string]: number } = {};

    for (const filePath of componentTestFiles) {
      const fullPath = path.join(process.cwd(), filePath);
      const testCount = this.countTestsInFile(fullPath);

      fileDetails[filePath] = testCount;
      totalTests += testCount;
    }

    return {
      total: totalTests,
      files: componentTestFiles.length,
      fileDetails,
    };
  }

  /**
   * Scan backend test files (*.test.ts) - only in tests/api directory to match test runner
   */
  private static async scanBackendTests() {
    const backendTestFiles = await glob("tests/api/**/*.test.ts", {
      cwd: process.cwd(),
      ignore: ["node_modules/**", ".next/**", "dist/**"],
    });

    let totalTests = 0;
    const fileDetails: { [filename: string]: number } = {};

    for (const filePath of backendTestFiles) {
      const fullPath = path.join(process.cwd(), filePath);
      const testCount = this.countTestsInFile(fullPath);

      fileDetails[filePath] = testCount;
      totalTests += testCount;
    }

    return {
      total: totalTests,
      files: backendTestFiles.length,
      fileDetails,
    };
  }

  /**
   * Count tests in a single file using AST parsing
   */
  private static countTestsInFile(filePath: string): number {
    try {
      const sourceCode = fs.readFileSync(filePath, "utf-8");
      const sourceFile = ts.createSourceFile(
        filePath,
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
      );

      let testCount = 0;

      // Recursive function to traverse AST and count test blocks
      function visit(node: ts.Node) {
        if (ts.isCallExpression(node)) {
          const expression = node.expression;

          // Check for test function calls: it(), test(), describe()
          if (ts.isIdentifier(expression)) {
            const functionName = expression.text;

            // Count actual test functions (not describe blocks)
            if (functionName === "it" || functionName === "test") {
              testCount++;
            }
          }
        }

        // Continue traversing child nodes
        ts.forEachChild(node, visit);
      }

      visit(sourceFile);

      return testCount;
    } catch (error) {
      console.warn(`Failed to parse test file ${filePath}:`, error);

      return 0;
    }
  }

  /**
   * Quick cache-friendly scan for dashboard initialization
   */
  static async getTestCounts(): Promise<TestCounts> {
    // For now, always scan fresh. We can add caching later if needed.
    return this.scanAllTests();
  }

  /**
   * Get test count summary for logging/debugging
   */
  static formatTestCountSummary(counts: TestCounts): string {
    return [
      `Total Tests: ${counts.totalTests}`,
      `  - Component Tests: ${counts.componentTests.total} (${counts.componentTests.files} files)`,
      `  - Backend Tests: ${counts.backendTests.total} (${counts.backendTests.files} files)`,
      `Scan Duration: ${counts.scanDuration}ms`,
      `Last Scan: ${new Date(counts.lastScan).toLocaleTimeString()}`,
    ].join("\n");
  }
}
