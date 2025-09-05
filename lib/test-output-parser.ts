/**
 * Standardized Test Output Parser
 * Unified parsing logic for all test types with consistent statistics
 */

export interface ParsedTestStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  progress: number;
}

export interface TestParseResult {
  stats: ParsedTestStats;
  isComplete: boolean;
  currentTest?: string;
  errors: string[];
}

export type TestSuiteType =
  | "backendTests"
  | "linting"
  | "build"
  | "componentTestsAccessibility"
  | "componentTestsCore";

// Test counts interface for parser context
interface TestCounts {
  backendTests: { total: number };
  componentTests: { total: number };
}

/**
 * Standardized test output parser - single source of truth for all test statistics
 */
export class TestOutputParser {
  /**
   * Parse test output and return standardized statistics
   */
  static parse(
    output: string,
    suiteType: TestSuiteType,
    exitCode: number = 0,
    testCounts?: TestCounts,
  ): TestParseResult {
    let result: TestParseResult;

    switch (suiteType) {
      case "backendTests":
        result = this.parseVitestOutput(output, exitCode, testCounts);
        break;
      case "linting":
        result = this.parseLintingOutput(output, exitCode);
        break;
      case "build":
        result = this.parseBuildOutput(output, exitCode);
        break;
      case "componentTestsAccessibility":
      case "componentTestsCore":
        result = this.parseCypressOutput(output, exitCode, testCounts);
        break;
      default:
        result = this.getDefaultStats();
        break;
    }

    // MATH FIX: If we're complete but numbers don't add up, use testCounts as authoritative total
    if (suiteType === "backendTests") {
      console.log(
        `🔍 Backend test check: isComplete=${result.isComplete}, testCounts=${!!testCounts}, passed+failed=${result.stats.passed + result.stats.failed}`,
      );

      if (result.isComplete && testCounts) {
        const expectedTotal =
          testCounts.backendTests?.total || result.stats.total;

        console.log(
          `🔍 Expected total: ${expectedTotal}, parsed total: ${result.stats.total}`,
        );

        if (
          result.stats.passed + result.stats.failed !== expectedTotal &&
          result.stats.passed + result.stats.failed > 0
        ) {
          console.log(
            `🔧 Math correction: parsed ${result.stats.passed}+${result.stats.failed}=${result.stats.passed + result.stats.failed}, expected ${expectedTotal}`,
          );
          // Keep failed count (usually accurate), adjust total to match testCounts
          result.stats.total = expectedTotal;
          result.stats.skipped =
            expectedTotal - result.stats.passed - result.stats.failed;
          result.stats.passRate = Math.round(
            (result.stats.passed / result.stats.total) * 100,
          );
        }
      }
    }

    return result;
  }

  /**
   * Parse Vitest backend test output
   */
  private static parseVitestOutput(
    output: string,
    exitCode: number,
    testCounts?: TestCounts,
  ): TestParseResult {
    const stats: ParsedTestStats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      passRate: 0,
      progress: 0,
    };

    let isComplete = false;
    let currentTest: string | undefined;
    const errors: string[] = [];

    // Parse Vitest final summary - prioritize "Tests" over "Test Files"
    // "Tests  99 failed | 348 passed (447)" - individual test counts
    const testsSummaryMatch = output.match(
      /Tests\s+(?:(\d+)\s+failed\s*\|\s*)?(\d+)\s+passed\s+\((\d+)\)/i,
    );

    if (testsSummaryMatch) {
      const [, failedStr, passedStr, totalStr] = testsSummaryMatch;

      stats.failed = failedStr ? parseInt(failedStr) : 0;
      stats.passed = parseInt(passedStr) || 0;
      stats.total = parseInt(totalStr) || 0;
      stats.skipped = stats.total - stats.passed - stats.failed;
      isComplete = true;
    } else {
      // Fallback to "Test Files" pattern if no "Tests" pattern found
      const filesSummaryMatch = output.match(
        /Test Files\s+(?:(\d+)\s+failed,?\s*)?(\d+)\s+passed\s+\((\d+)\)/i,
      );

      if (filesSummaryMatch) {
        const [, failedStr, passedStr, totalStr] = filesSummaryMatch;

        stats.failed = failedStr ? parseInt(failedStr) : 0;
        stats.passed = parseInt(passedStr) || 0;
        stats.total = parseInt(totalStr) || 0;
        stats.skipped = stats.total - stats.passed - stats.failed;
        isComplete = true;
      }
    }

    // Also parse individual test results: "✓ test name" and "×" for failures
    const testMatches = output.matchAll(/\s+[✓×]\s+(.+?)(?:\s+(\d+)ms)?$/gm);
    let individualPassed = 0;
    let individualFailed = 0;

    for (const match of testMatches) {
      if (match[0].includes("✓")) {
        individualPassed++;
      } else if (match[0].includes("×")) {
        individualFailed++;
      }
    }

    // Use individual test counts if we have them and no file summary
    if ((individualPassed > 0 || individualFailed > 0) && !isComplete) {
      stats.passed = individualPassed;
      stats.failed = individualFailed;

      // FIXED: Use known total from test counts, not just completed tests
      if (testCounts?.backendTests?.total) {
        stats.total = testCounts.backendTests.total;
        const completedTests = individualPassed + individualFailed;

        stats.progress = Math.round((completedTests / stats.total) * 100);
        console.log(
          `🔢 Progress calculation: ${completedTests}/${stats.total} = ${stats.progress}%`,
        );
      } else {
        // No test counts available - use completed tests only
        stats.total = individualPassed + individualFailed;
        stats.progress =
          stats.total > 0
            ? Math.round(
                ((individualPassed + individualFailed) / stats.total) * 100,
              )
            : 0;
        console.warn(
          `⚠️ No test counts available, using completed tests as total`,
        );
      }
    }

    // FIXED: Extract current test file using proper vitest patterns
    if (!isComplete) {
      // Multiple patterns to match vitest output (same as in generator)
      const vitestPatterns = [
        /✓\s+([^\s>]+\.test\.ts)/, // ✓ tests/api/assets.test.ts
        /RUN\s+([^\s>]+\.test\.ts)/, // RUN tests/api/assets.test.ts
        /×\s+([^\s>]+\.test\.ts)/, // × tests/api/assets.test.ts (failed)
        /PASS\s+([^\s>]+\.test\.ts)/, // PASS tests/api/assets.test.ts
        /FAIL\s+([^\s>]+\.test\.ts)/, // FAIL tests/api/assets.test.ts
      ];

      // Get recent lines and find the most recent test file mentioned
      const recentLines = output.split("\n").slice(-10);

      for (const line of recentLines.reverse()) {
        for (const pattern of vitestPatterns) {
          const match = line.match(pattern);

          if (match && match[1]) {
            currentTest = match[1].replace(/.*\//, ""); // Just filename
            break;
          }
        }
        if (currentTest) break;
      }

      // Initial startup detection
      if (!currentTest && output.includes("RUN  v")) {
        currentTest = "Starting tests...";
      }
    }

    // Calculate pass rate
    if (stats.total > 0) {
      stats.passRate = Math.round((stats.passed / stats.total) * 100);
      // Only override progress to 100% if test is complete, otherwise keep the calculated value
      if (isComplete) {
        stats.progress = 100;
      }
    }

    // Extract errors - look for FAIL patterns or failed test descriptions
    if (output.includes("FAIL") || exitCode !== 0) {
      const failMatches = output.matchAll(/(?:FAIL|×)\s+(.+)/g);

      for (const match of failMatches) {
        errors.push(match[1].trim());
      }
    }

    return { stats, isComplete, currentTest, errors };
  }

  /**
   * Parse ESLint output
   */
  private static parseLintingOutput(
    output: string,
    exitCode: number,
  ): TestParseResult {
    const stats: ParsedTestStats = {
      total: 1, // Linting is binary - pass or fail
      passed: 0,
      failed: 0,
      skipped: 0,
      passRate: 0,
      progress: 0,
    };

    const errors: string[] = [];

    // Parse ESLint summary: "✖ 418 problems (1 error, 417 warnings)"
    const problemsMatch = output.match(
      /✖ (\d+) problems? \((\d+) errors?, (\d+) warnings?\)/,
    );

    if (problemsMatch) {
      const [, , errorsStr] = problemsMatch;
      const errorCount = parseInt(errorsStr) || 0;

      if (errorCount > 0) {
        stats.failed = 1;
        stats.passRate = 0;
        errors.push(`${errorCount} ESLint errors found`);
      } else {
        stats.passed = 1;
        stats.passRate = 100;
      }
    } else if (exitCode === 0) {
      // No problems found
      stats.passed = 1;
      stats.passRate = 100;
    } else {
      // Unknown error
      stats.failed = 1;
      stats.passRate = 0;
      errors.push(`Linting failed with exit code ${exitCode}`);
    }

    stats.progress = 100; // Linting completes quickly

    return {
      stats,
      isComplete: true,
      errors,
    };
  }

  /**
   * Parse TypeScript build output
   */
  private static parseBuildOutput(
    output: string,
    exitCode: number,
  ): TestParseResult {
    const stats: ParsedTestStats = {
      total: 1, // Build is binary - pass or fail
      passed: 0,
      failed: 0,
      skipped: 0,
      passRate: 0,
      progress: 0,
    };

    const errors: string[] = [];

    if (exitCode === 0) {
      stats.passed = 1;
      stats.passRate = 100;
    } else {
      stats.failed = 1;
      stats.passRate = 0;

      // Extract TypeScript errors
      const errorMatches = output.matchAll(
        /(.+\.tsx?)\((\d+),(\d+)\): error TS\d+: (.+)/g,
      );

      for (const match of errorMatches) {
        const [, file, line, col, message] = match;

        errors.push(`${file}:${line}:${col} - ${message}`);
      }

      if (errors.length === 0) {
        errors.push(`Build failed with exit code ${exitCode}`);
      }
    }

    stats.progress = 100; // Build completes when done

    return {
      stats,
      isComplete: true,
      errors,
    };
  }

  /**
   * Parse Cypress component test output
   */
  private static parseCypressOutput(
    output: string,
    exitCode: number,
    testCounts?: TestCounts,
  ): TestParseResult {
    const stats: ParsedTestStats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      passRate: 0,
      progress: 0,
    };

    let isComplete = false;
    let currentTest: string | undefined;
    const errors: string[] = [];

    // Parse Cypress final summary: "6 passing (248ms)" or "2 passing, 1 failing"
    const summaryMatch = output.match(
      /(\d+) passing(?:,\s*(\d+) failing)?.*?(?:\((\d+)ms\))?/i,
    );

    if (summaryMatch) {
      const [, passingStr, failingStr] = summaryMatch;

      stats.passed = parseInt(passingStr) || 0;
      stats.failed = failingStr ? parseInt(failingStr) : 0;
      stats.total = stats.passed + stats.failed;
      isComplete = true;
    }

    // Only parse individual test completions if we don't have a summary (to avoid double counting)
    if (!isComplete) {
      const testMatches = output.matchAll(/\s+[✓×]\s+(.+?)\s+\((\d+)ms\)/g);
      let completedTests = 0;
      let individualPassed = 0;
      let individualFailed = 0;

      for (const match of testMatches) {
        completedTests++;
        if (match[0].includes("×")) {
          individualFailed++;
        } else {
          individualPassed++;
        }
      }

      if (completedTests > 0) {
        stats.passed = individualPassed;
        stats.failed = individualFailed;
        stats.total = completedTests;
        stats.progress = Math.round((completedTests / stats.total) * 100);
      }
    }

    // Parse running test pattern: look for describe blocks
    const runningMatch = output.match(/^\s*(.+)$/m);

    if (runningMatch && !isComplete) {
      currentTest = runningMatch[1].trim();
    }

    // Calculate pass rate
    if (stats.total > 0) {
      stats.passRate = Math.round((stats.passed / stats.total) * 100);
      if (isComplete) {
        stats.progress = 100;
      }
    }

    // Handle exit codes
    if (exitCode !== 0 && !isComplete) {
      // Process was killed or errored - mark as incomplete but don't fail parsing
      if (stats.total === 0) {
        stats.total = 1;
        stats.failed = 1;
        errors.push(`Cypress process failed with exit code ${exitCode}`);
      }
    }

    // Extract Cypress errors from failure descriptions
    if (output.includes("failing") || output.includes("Error:")) {
      const failureMatches = output.matchAll(/\d+\)\s+(.+?)(?:\n|Error:|$)/g);

      for (const match of failureMatches) {
        if (match[1].trim()) {
          errors.push(match[1].trim());
        }
      }
    }

    return { stats, isComplete, currentTest, errors };
  }

  /**
   * Get default stats structure
   */
  private static getDefaultStats(): TestParseResult {
    return {
      stats: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        passRate: 0,
        progress: 0,
      },
      isComplete: false,
      errors: [],
    };
  }

  /**
   * Aggregate statistics across multiple test suites
   */
  static aggregateStats(
    suiteStats: Record<string, ParsedTestStats>,
  ): ParsedTestStats {
    const totals = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      passRate: 0,
      progress: 0,
    };

    let totalWeight = 0;
    const weights = {
      linting: 0.05,
      build: 0.1,
      backendTests: 0.45,
      componentTestsAccessibility: 0.2,
      componentTestsCore: 0.2,
    };

    Object.entries(suiteStats).forEach(([suite, stats]) => {
      totals.total += stats.total;
      totals.passed += stats.passed;
      totals.failed += stats.failed;
      totals.skipped += stats.skipped;

      const weight = weights[suite as keyof typeof weights] || 0.2;

      totals.progress += stats.progress * weight;
      totalWeight += weight;
    });

    // Calculate overall pass rate
    if (totals.total > 0) {
      totals.passRate = Math.round((totals.passed / totals.total) * 100);
    }

    // Calculate weighted progress
    if (totalWeight > 0) {
      totals.progress = Math.round(totals.progress / totalWeight);
    }

    return totals;
  }
}
