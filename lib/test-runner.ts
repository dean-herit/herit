import type { LiveTestUpdate } from "@/types/test-results";

import { spawn } from "child_process";
import { writeFile } from "fs/promises";
import path from "path";

import { TestOutputParser, type TestSuiteType } from "./test-output-parser";
import { TestCounter, type TestCounts } from "./test-counter";

export interface TestResult {
  command: string;
  status: "pending" | "running" | "completed" | "failed";
  output: string;
  error?: string;
  duration?: number;
  startTime: number;
  endTime?: number;
  // Enhanced for real-time updates - unified with live progress tracking
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  progress: number; // 0-100
  currentTest?: string;
  // Legacy field for backward compatibility
  individualTests?: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
  };
}

export interface TestContinuationOptions {
  onlyFailed?: boolean;
  skipQualityGates?: boolean;
  continueSuites?: Array<keyof TestSuiteResults["results"]>;
  fromState?: Partial<TestSuiteResults>;
}

export interface TestSuiteResults {
  executionId: string;
  timestamp: string;
  status: "pending" | "running" | "completed" | "failed";
  overallSuccess: boolean;
  results: {
    backendTests: TestResult;
    linting: TestResult;
    build: TestResult;
    componentTestsAccessibility: TestResult;
    componentTestsCore: TestResult;
  };
  totalDuration?: number;
  // Enhanced overall tracking (unified from LiveDashboardState)
  overall: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
  };
  // Test count scan results from Phase 0
  testCounts?: {
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
  };
  // Legacy field for backward compatibility
  individualTests?: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    progress: number;
  };
}

// Global singleton state to prevent multiple executions
let globalRunning = false;
let globalAbortController: AbortController | null = null;
let globalExecutionId: string | null = null;
let globalActiveProcesses: Set<any> = new Set(); // Track active child processes

export class TestRunner {
  public readonly executionId: string; // Make public for API access
  private continuationOptions?: TestContinuationOptions;

  constructor(continuationOptions?: TestContinuationOptions) {
    this.continuationOptions = continuationOptions;
    this.executionId =
      continuationOptions?.fromState?.executionId || `test-${Date.now()}`;

    if (continuationOptions) {
      console.log(`🔄 Test continuation mode active:`, {
        onlyFailed: continuationOptions.onlyFailed,
        skipQualityGates: continuationOptions.skipQualityGates,
        continueSuites: continuationOptions.continueSuites,
        fromExecutionId: continuationOptions.fromState?.executionId,
      });
    }
  }

  // Singleton enforcement methods
  static isRunning(): boolean {
    return globalRunning;
  }

  static getCurrentExecutionId(): string | null {
    return globalExecutionId;
  }

  static abort(): void {
    if (globalAbortController) {
      console.log("🛑 Aborting current test execution...");
      globalAbortController.abort();

      // Kill all active child processes
      console.log(
        `🛑 Terminating ${globalActiveProcesses.size} active processes...`,
      );
      globalActiveProcesses.forEach((childProcess) => {
        try {
          if (childProcess && !childProcess.killed) {
            childProcess.kill("SIGTERM");
            // Force kill after 2 seconds if still running
            setTimeout(() => {
              if (!childProcess.killed) {
                childProcess.kill("SIGKILL");
              }
            }, 2000);
          }
        } catch (error) {
          console.warn(`Failed to kill child process:`, error);
        }
      });
      globalActiveProcesses.clear();

      globalRunning = false;
      globalExecutionId = null;
      globalAbortController = null;
    }
  }

  // Get the latest test results
  static async getLatestResults(): Promise<TestSuiteResults | undefined> {
    try {
      const { readFile } = await import("fs/promises");
      const latestPath = path.join(
        process.cwd(),
        "tests",
        "test-reports",
        "latest.json",
      );
      const content = await readFile(latestPath, "utf-8");

      return JSON.parse(content);
    } catch (error) {
      console.log("No previous test results found");

      return undefined;
    }
  }

  // Determine which suites should run based on continuation options
  private shouldRunSuite(
    suiteName: keyof TestSuiteResults["results"],
    previousResults?: TestSuiteResults,
  ): boolean {
    // If specific suites are specified, only run those
    if (this.continuationOptions?.continueSuites) {
      return this.continuationOptions.continueSuites.includes(suiteName);
    }

    // If onlyFailed is true, only run previously failed or incomplete suites
    if (this.continuationOptions?.onlyFailed && previousResults) {
      const suiteResult = previousResults.results[suiteName];

      return (
        suiteResult.status === "failed" ||
        suiteResult.status === "running" ||
        suiteResult.status === "pending"
      );
    }

    // Default: run all suites
    return true;
  }

  // Check if quality gates should be skipped
  private shouldSkipQualityGates(): boolean {
    return this.continuationOptions?.skipQualityGates === true;
  }

  // Basic test execution for compatibility - now with real test execution
  async executeAllTests(): Promise<TestSuiteResults> {
    // Use the streaming method internally and collect final result
    const generator = this.executeTestsStreamingEnhanced();
    let finalResults: TestSuiteResults | null = null;

    for await (const result of generator) {
      if (result && "status" in result && result.status !== undefined) {
        finalResults = result as TestSuiteResults;
      }
    }

    if (!finalResults) {
      // Fallback if something went wrong
      finalResults = {
        executionId: this.executionId,
        timestamp: new Date().toISOString(),
        status: "failed",
        overallSuccess: false,
        results: {
          backendTests: {
            command: "npm run test:unit",
            status: "failed",
            output: "Execution failed",
            startTime: Date.now(),
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            passRate: 0,
            progress: 0,
          },
          linting: {
            command: "npm run lint",
            status: "failed",
            output: "Execution failed",
            startTime: Date.now(),
            total: 1,
            passed: 0,
            failed: 1,
            skipped: 0,
            passRate: 0,
            progress: 0,
          },
          build: {
            command: "npm run typecheck",
            status: "failed",
            output: "Execution failed",
            startTime: Date.now(),
            total: 1,
            passed: 0,
            failed: 1,
            skipped: 0,
            passRate: 0,
            progress: 0,
          },
          componentTestsAccessibility: {
            command: "npm run test:ct:accessibility",
            status: "failed",
            output: "Execution failed",
            startTime: Date.now(),
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            passRate: 0,
            progress: 0,
          },
          componentTestsCore: {
            command: "npm run test:ct:core",
            status: "failed",
            output: "Execution failed",
            startTime: Date.now(),
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            passRate: 0,
            progress: 0,
          },
        },
        overall: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          passRate: 0,
        },
      };
    }

    return finalResults!;
  }

  // Enhanced streaming execution with continuation support and real test execution
  async *executeTestsStreamingEnhanced(
    abortSignal?: AbortSignal,
  ): AsyncGenerator<Partial<TestSuiteResults> | LiveTestUpdate, void, unknown> {
    globalRunning = true;
    globalExecutionId = this.executionId;
    globalAbortController = new AbortController();

    console.log(
      `🚀 Starting test execution ${this.executionId} with continuation options`,
    );

    try {
      // Get previous results for continuation logic
      const previousResults = await TestRunner.getLatestResults();

      // Scan test counts for accurate progress calculation
      console.log(
        "🔍 Scanning test counts for accurate progress calculation...",
      );
      const testCounts = await TestCounter.scanAllTests();

      console.log(
        `📊 Test count scan complete: ${testCounts.totalTests} tests in ${testCounts.totalFiles} files (${testCounts.scanDuration}ms)`,
      );

      // Initialize results
      const suiteResults: TestSuiteResults = {
        executionId: this.executionId,
        timestamp: new Date().toISOString(),
        status: "running",
        overallSuccess: false,
        results: {
          backendTests: {
            command: "",
            status: "pending",
            output: "",
            startTime: Date.now(),
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            passRate: 0,
            progress: 0,
          },
          linting: {
            command: "",
            status: "pending",
            output: "",
            startTime: Date.now(),
            total: 1,
            passed: 0,
            failed: 0,
            skipped: 0,
            passRate: 0,
            progress: 0,
          },
          build: {
            command: "",
            status: "pending",
            output: "",
            startTime: Date.now(),
            total: 1,
            passed: 0,
            failed: 0,
            skipped: 0,
            passRate: 0,
            progress: 0,
          },
          componentTestsAccessibility: {
            command: "",
            status: "pending",
            output: "",
            startTime: Date.now(),
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            passRate: 0,
            progress: 0,
          },
          componentTestsCore: {
            command: "",
            status: "pending",
            output: "",
            startTime: Date.now(),
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            passRate: 0,
            progress: 0,
          },
        },
        overall: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          passRate: 0,
        },
        testCounts,
      };

      // Determine which suites to run based on continuation logic
      const suitesToRun = [];

      if (this.shouldRunSuite("linting", previousResults)) {
        suiteResults.results.linting.command = "npm run lint";
        suitesToRun.push("linting");
      }
      if (this.shouldRunSuite("build", previousResults)) {
        suiteResults.results.build.command = "npm run typecheck";
        suitesToRun.push("build");
      }
      if (this.shouldRunSuite("backendTests", previousResults)) {
        suiteResults.results.backendTests.command =
          "npm run test:unit -- tests/api";
        suitesToRun.push("backendTests");
      }
      if (this.shouldRunSuite("componentTestsAccessibility", previousResults)) {
        suiteResults.results.componentTestsAccessibility.command =
          "npm run test:ct:accessibility";
        suitesToRun.push("componentTestsAccessibility");
      }
      if (this.shouldRunSuite("componentTestsCore", previousResults)) {
        suiteResults.results.componentTestsCore.command =
          "npm run test:ct:core";
        suitesToRun.push("componentTestsCore");
      }

      console.log(
        `🎯 Running ${suitesToRun.length} test suites: ${suitesToRun.join(", ")}`,
      );

      if (this.shouldSkipQualityGates()) {
        console.log(`⏭️ Skipping quality gates (skipQualityGates: true)`);
      }

      yield { ...suiteResults };

      // Execute quality gates first (unless skipped)
      if (
        !this.shouldSkipQualityGates() &&
        (suitesToRun.includes("linting") || suitesToRun.includes("build"))
      ) {
        console.log(`🔍 Phase 1: Quality Gates (continuation-aware)`);

        // Run linting if required
        if (suitesToRun.includes("linting")) {
          console.log(`🚨 Quality Gate: linting`);
          suiteResults.results.linting.status = "running";
          yield { ...suiteResults };

          try {
            const result = await this.executeCommand(
              "npm",
              ["run", "lint"],
              "linting",
              testCounts,
            );

            suiteResults.results.linting = result;

            if (result.status === "failed") {
              console.log(
                `❌ Quality Gate linting FAILED - Stopping execution`,
              );
              suiteResults.status = "failed";
              suiteResults.overallSuccess = false;
              await this.saveResults(suiteResults);
              yield { ...suiteResults };

              return;
            }

            console.log(`✅ Quality Gate linting passed`);
            yield { ...suiteResults };
          } catch (error) {
            console.error(`❌ Linting failed:`, error);
            suiteResults.results.linting.status = "failed";
            suiteResults.results.linting.error =
              error instanceof Error ? error.message : "Linting failed";
            suiteResults.status = "failed";
            suiteResults.overallSuccess = false;
            await this.saveResults(suiteResults);
            yield { ...suiteResults };

            return;
          }
        }

        // Run build/typecheck if required
        if (suitesToRun.includes("build")) {
          console.log(`🚨 Quality Gate: build`);
          suiteResults.results.build.status = "running";
          yield { ...suiteResults };

          try {
            const result = await this.executeCommand(
              "npm",
              ["run", "typecheck"],
              "build",
              testCounts,
            );

            suiteResults.results.build = result;

            if (result.status === "failed") {
              console.log(`❌ Quality Gate build FAILED - Stopping execution`);
              suiteResults.status = "failed";
              suiteResults.overallSuccess = false;
              await this.saveResults(suiteResults);
              yield { ...suiteResults };

              return;
            }

            console.log(`✅ Quality Gate build passed`);
            yield { ...suiteResults };
          } catch (error) {
            console.error(`❌ Build failed:`, error);
            suiteResults.results.build.status = "failed";
            suiteResults.results.build.error =
              error instanceof Error ? error.message : "Build failed";
            suiteResults.status = "failed";
            suiteResults.overallSuccess = false;
            await this.saveResults(suiteResults);
            yield { ...suiteResults };

            return;
          }
        }
      }

      // Execute test suites in parallel
      const testSuitesToRun = suitesToRun.filter(
        (suite) => !["linting", "build"].includes(suite),
      );

      if (testSuitesToRun.length > 0) {
        console.log(
          `🚀 Phase 2: Running ${testSuitesToRun.length} test suites in parallel`,
        );

        // Update UI to show Phase 2 has started (quality gates passed)
        testSuitesToRun.forEach((suite) => {
          const suiteName = suite as keyof TestSuiteResults["results"];

          suiteResults.results[suiteName].status = "running";
        });
        yield { ...suiteResults };

        // Execute test suites with proper progress streaming
        // Backend tests run sequentially to allow real-time progress updates
        // Other tests can run in parallel

        const backendTestSuite = testSuitesToRun.find(
          (suite) => suite === "backendTests",
        );
        const otherTestSuites = testSuitesToRun.filter(
          (suite) => suite !== "backendTests",
        );

        // Run backend tests first with live progress streaming
        if (backendTestSuite) {
          const suiteName =
            backendTestSuite as keyof TestSuiteResults["results"];

          suiteResults.results[suiteName].status = "running";
          yield { ...suiteResults };

          let backendTestCompleted = false;

          try {
            const command = suiteResults.results[suiteName].command;
            const [cmd, ...args] = command.split(" ");

            console.log(
              `🚀 Running backend tests with live progress: ${command}`,
            );

            // Execute with progress streaming - simplified logic
            for await (const update of this.executeCommandWithProgress(
              cmd,
              args,
              suiteName as any,
              testCounts,
            )) {
              if ("type" in update) {
                // This is a LiveTestUpdate - yield it for SSE
                console.log(
                  `🔄 Yielding progress update for ${update.suite}: ${update.testName}`,
                );
                yield update;
              } else {
                // This is the final TestResult - update suite results
                console.log(
                  `✅ Backend tests completed, updating suite results`,
                );
                suiteResults.results[suiteName] = update;
                backendTestCompleted = true;
                yield { ...suiteResults };
                break; // Final result received, exit loop
              }
            }
          } catch (error) {
            console.error(`❌ Backend tests failed with exception:`, error);

            // Create a proper failed result if we didn't get one
            if (!backendTestCompleted) {
              suiteResults.results[suiteName] = {
                ...suiteResults.results[suiteName],
                status: "failed",
                error:
                  error instanceof Error
                    ? error.message
                    : `Backend tests failed: ${error}`,
                endTime: Date.now(),
                duration:
                  Date.now() - suiteResults.results[suiteName].startTime,
                total: 0,
                passed: 0,
                failed: 1, // Mark as failed
                skipped: 0,
                passRate: 0,
                progress: 0,
              };
            }
            yield { ...suiteResults };
          }

          // Safety check - ensure we have a completed result
          if (!backendTestCompleted) {
            console.warn(
              `⚠️ Backend tests didn't complete normally, marking as failed`,
            );
            suiteResults.results[suiteName] = {
              ...suiteResults.results[suiteName],
              status: "failed",
              error: "Backend tests did not complete normally",
              endTime: Date.now(),
              duration: Date.now() - suiteResults.results[suiteName].startTime,
              total: 0,
              passed: 0,
              failed: 1,
              skipped: 0,
              passRate: 0,
              progress: 0,
            };
            yield { ...suiteResults };
          }
        }

        // Run other test suites with progress streaming for better transparency
        for (const suite of otherTestSuites) {
          const suiteName = suite as keyof TestSuiteResults["results"];

          suiteResults.results[suiteName].status = "running";
          yield { ...suiteResults };

          let suiteCompleted = false;

          try {
            const command = suiteResults.results[suiteName].command;
            const [cmd, ...args] = command.split(" ");

            console.log(`🚀 Running ${suite} with live progress: ${command}`);

            // Use progress streaming for component tests too!
            for await (const update of this.executeCommandWithProgress(
              cmd,
              args,
              suiteName as any,
              testCounts,
            )) {
              if ("type" in update) {
                // This is a LiveTestUpdate - yield it for SSE
                console.log(
                  `🔄 Yielding progress update for ${update.suite}: ${update.testName}`,
                );
                yield update;
              } else {
                // This is the final TestResult - update suite results
                console.log(`✅ ${suite} completed, updating suite results`);
                suiteResults.results[suiteName] = update;
                suiteCompleted = true;
                yield { ...suiteResults };
                break; // Final result received, exit loop
              }
            }
          } catch (error) {
            console.error(`❌ ${suite} failed with exception:`, error);

            // Create a proper failed result if we didn't get one
            if (!suiteCompleted) {
              suiteResults.results[suiteName] = {
                ...suiteResults.results[suiteName],
                status: "failed",
                error:
                  error instanceof Error ? error.message : `${suite} failed`,
                endTime: Date.now(),
                duration:
                  Date.now() - suiteResults.results[suiteName].startTime,
                total: 0,
                passed: 0,
                failed: 1,
                skipped: 0,
                passRate: 0,
                progress: 0,
              };
            }
            yield { ...suiteResults };
          }

          // Safety check - ensure we have a completed result
          if (!suiteCompleted) {
            console.warn(
              `⚠️ ${suite} didn't complete normally, marking as failed`,
            );
            suiteResults.results[suiteName] = {
              ...suiteResults.results[suiteName],
              status: "failed",
              error: `${suite} did not complete normally`,
              endTime: Date.now(),
              duration: Date.now() - suiteResults.results[suiteName].startTime,
              total: 0,
              passed: 0,
              failed: 1,
              skipped: 0,
              passRate: 0,
              progress: 0,
            };
            yield { ...suiteResults };
          }
        }
      }

      // Determine overall success
      const allResults = Object.values(suiteResults.results);

      suiteResults.overallSuccess = allResults.every(
        (result) => result.command === "" || result.status === "completed",
      );
      suiteResults.status = suiteResults.overallSuccess
        ? "completed"
        : "failed";

      await this.saveResults(suiteResults);
      yield { ...suiteResults };

      console.log(
        `✅ Test execution ${this.executionId} completed with continuation logic`,
      );
    } catch (error) {
      console.error(`❌ Test execution ${this.executionId} failed:`, error);
      throw error;
    } finally {
      globalRunning = false;
      globalExecutionId = null;
      globalAbortController = null;
    }
  }

  // Execute a command with streaming progress updates - BULLETPROOF VERSION
  private async *executeCommandWithProgress(
    command: string,
    args: string[],
    suiteName:
      | "backendTests"
      | "linting"
      | "build"
      | "componentTestsAccessibility"
      | "componentTestsCore",
    testCounts?: TestCounts,
  ): AsyncGenerator<LiveTestUpdate | TestResult, void, unknown> {
    const startTime = Date.now();
    const fullCommand = `${command} ${args.join(" ")}`;

    console.log(`🚀 Executing with progress: ${fullCommand}`);

    const childProcess = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    globalActiveProcesses.add(childProcess);

    let stdout = "";
    let stderr = "";
    let lastProgressYield = Date.now();
    let isComplete = false;
    let progressInterval: NodeJS.Timeout | null = null;

    // Set up timeout for hanging processes
    const timeoutMs = suiteName.includes("componentTests") ? 180000 : 120000;
    const timeoutId = setTimeout(() => {
      if (childProcess && !childProcess.killed) {
        console.log(
          `⏰ ${fullCommand} timed out after ${timeoutMs}ms, killing process...`,
        );
        childProcess.kill("SIGTERM");
        setTimeout(() => {
          if (childProcess && !childProcess.killed) {
            childProcess.kill("SIGKILL");
          }
        }, 2000);
      }
    }, timeoutMs);

    // Setup cleanup function
    const cleanup = () => {
      clearTimeout(timeoutId);
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      globalActiveProcesses.delete(childProcess);
    };

    // Create promise that resolves when process completes
    const processComplete = new Promise<TestResult>((resolve) => {
      childProcess.on("close", (code, signal) => {
        isComplete = true;
        const endTime = Date.now();

        const result: TestResult = {
          command: fullCommand,
          status: code === 0 ? "completed" : "failed",
          output: stdout + stderr,
          startTime,
          endTime,
          duration: endTime - startTime,
          // Initialize unified fields
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          passRate: 0,
          progress: code === 0 ? 100 : 0,
        };

        if (signal === "SIGTERM" || signal === "SIGKILL") {
          result.error = `Process was terminated (${signal}) due to timeout`;
          console.log(`⏰ ${fullCommand} was terminated due to timeout`);
        } else if (code !== 0) {
          result.error = `Process exited with code ${code}`;
          console.log(`❌ ${fullCommand} failed with code ${code}`);
        } else {
          console.log(`✅ ${fullCommand} completed successfully`);
        }

        // Parse test results and populate unified fields
        if (result.output) {
          try {
            const parseResult = TestOutputParser.parse(
              result.output,
              suiteName as TestSuiteType,
              code || 0,
              testCounts,
            );

            result.total = parseResult.stats.total;
            result.passed = parseResult.stats.passed;
            result.failed = parseResult.stats.failed;
            result.skipped = parseResult.stats.skipped;
            result.passRate = parseResult.stats.passRate;
            result.progress = parseResult.stats.progress;
            result.currentTest = parseResult.currentTest;
            result.individualTests = parseResult.stats; // Legacy compatibility

            console.log(
              `📊 Final result: ${result.total} tests, ${result.passed} passed, ${result.failed} failed`,
            );
          } catch (error) {
            console.warn("Failed to parse final results:", error);
          }
        }

        resolve(result);
      });

      childProcess.on("error", (error) => {
        isComplete = true;
        const endTime = Date.now();

        const errorResult: TestResult = {
          command: fullCommand,
          status: "failed",
          output: stderr,
          error: error.message,
          startTime,
          endTime,
          duration: endTime - startTime,
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          passRate: 0,
          progress: 0,
        };

        resolve(errorResult);
      });
    });

    // Set up data handlers
    childProcess.stdout?.on("data", (data) => {
      const chunk = data.toString();

      stdout += chunk;
    });

    childProcess.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    try {
      // Simple polling loop - no race conditions, no setInterval bullshit
      while (!isComplete) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Yield progress for all test types with stdout
        if (stdout && Date.now() - lastProgressYield > 2000) {
          try {
            const parseResult = TestOutputParser.parse(
              stdout,
              suiteName as TestSuiteType,
              0,
              testCounts,
            );

            // Extract current test status based on suite type
            let currentTestStatus = this.getCurrentTestStatus(
              suiteName,
              stdout,
            );

            const liveUpdate: LiveTestUpdate = {
              type: "test_progress",
              suite: suiteName,
              testName: currentTestStatus,
              stats: parseResult.stats,
              overallStats: parseResult.stats,
              timestamp: new Date().toISOString(),
              executionId: this.executionId,
            };

            console.log(
              `📊 Progress update: ${currentTestStatus} (${parseResult.stats.progress}%)`,
            );
            lastProgressYield = Date.now();

            yield liveUpdate; // YIELD the progress update
          } catch (error) {
            console.warn("Failed to parse progress:", error);
          }
        }
      }

      // Wait for final result and YIELD it (not return!)
      const finalResult = await processComplete;

      console.log(`📊 Final result ready, yielding TestResult`);
      yield finalResult;
    } finally {
      cleanup();
    }
  }

  // Execute a command and return TestResult
  private async executeCommand(
    command: string,
    args: string[],
    suiteName:
      | "backendTests"
      | "linting"
      | "build"
      | "componentTestsAccessibility"
      | "componentTestsCore",
    testCounts?: TestCounts,
    onProgressUpdate?: (update: LiveTestUpdate) => void,
  ): Promise<TestResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const fullCommand = `${command} ${args.join(" ")}`;

      console.log(`🚀 Executing: ${fullCommand}`);

      const childProcess = spawn(command, args, {
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
      });

      // Track this process for cleanup
      globalActiveProcesses.add(childProcess);

      let stdout = "";
      let stderr = "";
      let lastProgressUpdate = Date.now();

      // Set up timeout for hanging processes (especially Cypress)
      const timeoutMs = suiteName.includes("componentTests") ? 180000 : 120000; // 3 min for Cypress, 2 min for others
      const timeoutId = setTimeout(() => {
        if (childProcess && !childProcess.killed) {
          console.log(
            `⏰ ${fullCommand} timed out after ${timeoutMs}ms, killing process...`,
          );

          // First try SIGTERM
          childProcess.kill("SIGTERM");

          // Force kill after 2 seconds if still running
          setTimeout(() => {
            if (childProcess && !childProcess.killed) {
              childProcess.kill("SIGKILL");
            }
          }, 2000);
        }
      }, timeoutMs);

      childProcess.stdout?.on("data", (data) => {
        const chunk = data.toString();

        stdout += chunk;

        // Send real-time progress updates for backend tests
        if (
          onProgressUpdate &&
          suiteName === "backendTests" &&
          Date.now() - lastProgressUpdate > 500
        ) {
          // Parse current output to extract progress
          const parseResult = TestOutputParser.parse(
            stdout,
            suiteName as TestSuiteType,
            0,
            testCounts,
          );

          // Extract current test file being processed
          let currentTestFile = "Processing tests...";
          const fileMatches = chunk.match(
            /(?:RUN|PASS|FAIL)\s+([^\s]+\.test\.ts)/,
          );

          if (fileMatches && fileMatches[1]) {
            currentTestFile = fileMatches[1];
          }

          const liveUpdate: LiveTestUpdate = {
            type: "test_progress",
            suite: suiteName,
            testName: currentTestFile,
            stats: parseResult.stats,
            overallStats: parseResult.stats,
            timestamp: new Date().toISOString(),
            executionId: this.executionId,
          };

          onProgressUpdate(liveUpdate);
          lastProgressUpdate = Date.now();
        }
      });

      childProcess.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      childProcess.on("close", (code, signal) => {
        clearTimeout(timeoutId);
        const endTime = Date.now();
        const result: TestResult = {
          command: fullCommand,
          status: code === 0 ? "completed" : "failed",
          output: stdout + stderr,
          startTime,
          endTime,
          duration: endTime - startTime,
          // Initialize unified fields
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          passRate: 0,
          progress: code === 0 ? 100 : 0,
        };

        if (signal === "SIGTERM" || signal === "SIGKILL") {
          result.error = `Process was terminated (${signal}) due to timeout`;
          console.log(`⏰ ${fullCommand} was terminated due to timeout`);
        } else if (code !== 0) {
          result.error = `Process exited with code ${code}`;
          console.log(`❌ ${fullCommand} failed with code ${code}`);
        } else {
          console.log(`✅ ${fullCommand} completed successfully`);
        }

        // Parse test results and populate unified fields
        if (result.output) {
          const parseResult = TestOutputParser.parse(
            result.output,
            suiteName as TestSuiteType,
            code || 0,
            testCounts,
          );

          // Populate both new unified fields AND legacy field for compatibility
          result.total = parseResult.stats.total;
          result.passed = parseResult.stats.passed;
          result.failed = parseResult.stats.failed;
          result.skipped = parseResult.stats.skipped;
          result.passRate = parseResult.stats.passRate;
          result.progress = parseResult.stats.progress;
          result.currentTest = parseResult.currentTest;
          result.individualTests = parseResult.stats; // Legacy compatibility
        }

        // Remove process from tracking set
        globalActiveProcesses.delete(childProcess);
        resolve(result);
      });

      childProcess.on("error", (error) => {
        clearTimeout(timeoutId);
        const endTime = Date.now();

        // Remove process from tracking set
        globalActiveProcesses.delete(childProcess);

        resolve({
          command: fullCommand,
          status: "failed",
          output: stderr,
          error: error.message,
          startTime,
          endTime,
          duration: endTime - startTime,
          // Initialize unified fields
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          passRate: 0,
          progress: 0,
        });
      });
    });
  }

  // Save test results
  private async saveResults(results: TestSuiteResults): Promise<void> {
    try {
      // Aggregate individual test statistics before saving
      const suiteStats: Record<string, any> = {};

      Object.entries(results.results).forEach(([suiteName, result]) => {
        if (result.individualTests) {
          suiteStats[suiteName] = result.individualTests;
        }
      });

      // Use TestOutputParser.aggregateStats to get overall statistics
      if (Object.keys(suiteStats).length > 0) {
        results.individualTests = TestOutputParser.aggregateStats(suiteStats);
      }

      const reportsDir = path.join(process.cwd(), "tests", "test-reports");

      // Create reports directory if it doesn't exist
      await import("fs/promises").then((fs) =>
        fs.mkdir(reportsDir, { recursive: true }).catch(() => {}),
      );

      // Save with timestamp
      const timestampedPath = path.join(
        reportsDir,
        `${results.executionId}.json`,
      );

      await writeFile(timestampedPath, JSON.stringify(results, null, 2));

      // Save as latest
      const latestPath = path.join(reportsDir, "latest.json");

      await writeFile(latestPath, JSON.stringify(results, null, 2));

      console.log(`💾 Test results saved to ${timestampedPath}`);
    } catch (error) {
      console.error("Failed to save test results:", error);
    }
  }

  // Extract current test status based on suite type and output patterns
  private getCurrentTestStatus(suiteName: string, stdout: string): string {
    const recentLines = stdout.split("\n").slice(-20);

    if (suiteName === "backendTests") {
      // Vitest patterns for backend tests
      const vitestPatterns = [
        /✓\s+([^\s>]+\.test\.ts)/, // ✓ tests/api/assets.test.ts
        /RUN\s+([^\s>]+\.test\.ts)/, // RUN tests/api/assets.test.ts
        /×\s+([^\s>]+\.test\.ts)/, // × tests/api/assets.test.ts (failed)
        /PASS\s+([^\s>]+\.test\.ts)/, // PASS tests/api/assets.test.ts
        /FAIL\s+([^\s>]+\.test\.ts)/, // FAIL tests/api/assets.test.ts
      ];

      // Find the most recent test file mentioned
      for (const line of recentLines.reverse()) {
        for (const pattern of vitestPatterns) {
          const match = line.match(pattern);

          if (match && match[1]) {
            return match[1].replace(/.*\//, ""); // Just filename
          }
        }
      }

      return "Processing backend tests...";
    } else if (suiteName.includes("componentTests")) {
      // Cypress patterns for component tests
      const cypressPatterns = [
        /Running (\d+) tests? in (.+\.cy\.tsx?)/, // Running 5 tests in LoginForm.cy.tsx
        /✓\s+(.+\.cy\.tsx?)/, // ✓ LoginForm.cy.tsx
        /spec:\s+(.+\.cy\.tsx?)/, // spec: LoginForm.cy.tsx
        /Compiling.*?([^\s/]+\.cy\.tsx?)/, // Webpack compiling messages
        /Building for production.../, // Build messages
        /compiled successfully/, // Compilation success
      ];

      // Look for webpack compilation messages
      if (
        stdout.includes("webpack compiled") ||
        stdout.includes("compiled successfully")
      ) {
        return "Cypress starting up...";
      }

      if (
        stdout.includes("Building for production") ||
        stdout.includes("Compiling")
      ) {
        return "Compiling components...";
      }

      // Find the most recent test file mentioned
      for (const line of recentLines.reverse()) {
        for (const pattern of cypressPatterns) {
          const match = line.match(pattern);

          if (match && match[1]) {
            return match[1].replace(/.*\//, ""); // Just filename
          }
        }
      }

      // Check for generic cypress startup messages
      if (stdout.includes("cypress")) {
        return "Starting Cypress...";
      }

      return suiteName === "componentTestsAccessibility"
        ? "Preparing accessibility tests..."
        : "Preparing component tests...";
    } else {
      // Linting, build, etc.
      return `Processing ${suiteName}...`;
    }
  }
}
