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
}

export interface DashboardMetrics {
  successRate: number;
  performanceGrade: string;
  testsPassingCount: number;
  executionTime: number;
  lastExecution: string;
  routeBreakdown: RouteMetrics[];
}

export interface RouteMetrics {
  name: string;
  successRate: number;
  testsPassingCount: number;
  totalTests: number;
}

export interface LiveTestUpdate {
  type:
    | "test_start"
    | "test_pass"
    | "test_fail"
    | "test_skip"
    | "test_progress"
    | "suite_complete";
  executionId: string;
  suite:
    | "backendTests"
    | "linting"
    | "build"
    | "componentTestsAccessibility"
    | "componentTestsCore";
  testName?: string;
  error?: string;
  duration?: number;
  stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    progress: number; // Suite-specific progress (0-100) - required for live updates
  };
  overallStats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
  };
  timestamp: string;
}

export interface SuiteProgress {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  progress: number; // 0-100
  status: "pending" | "running" | "completed" | "failed";
  currentTest?: string;
}

export interface LiveDashboardState {
  isRunning: boolean;
  currentTest?: string;
  progress: number;
  latestResults?: TestSuiteResults;
  error?: string;
  currentExecutionId?: string; // Track current execution for stale state prevention
  // DEPRECATED: Will be removed in favor of unified TestSuiteResults.overall and TestResult fields
  // Keeping for backward compatibility during migration
  liveStats?: {
    overall: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
      passRate: number;
    };
    suites: {
      backendTests: SuiteProgress;
      linting: SuiteProgress;
      build: SuiteProgress;
      componentTests: SuiteProgress;
    };
  };
}

// Backward compatibility type alias
export type LegacySuiteProgress = SuiteProgress;

// Helper type for migration - represents the unified data access pattern
export interface UnifiedSuiteData {
  status: "pending" | "running" | "completed" | "failed";
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  progress: number;
  currentTest?: string;
  output: string;
  error?: string;
  duration?: number;
}
