/**
 * Phase 3 Monitoring Dashboard Configuration
 * Real-time backend test performance monitoring
 */

export const MonitoringConfig = {
  // Performance Thresholds
  thresholds: {
    successRate: {
      critical: 75, // Below this blocks deployment
      warning: 80, // Below this triggers alerts
      target: 85, // Phase 3+ excellence target
    },
    executionTime: {
      critical: 120, // 2 minutes max for CI/CD
      warning: 60, // 1 minute preferred
      target: 30, // Optimal performance
    },
    authTests: {
      critical: 70, // Auth must work
      warning: 75, // Auth should be stable
      target: 85, // Auth excellence
    },
  },

  // Monitoring Intervals
  intervals: {
    continuous: 300000, // 5 minutes
    health_check: 60000, // 1 minute
    full_suite: 3600000, // 1 hour
  },

  // Alert Configuration
  alerts: {
    slack: {
      enabled: false, // Enable when webhook available
      webhook: process.env.SLACK_WEBHOOK_URL,
    },
    console: {
      enabled: true,
      verbose: true,
    },
  },

  // Quality Gates
  gates: {
    pre_commit: ["typescript", "critical_tests"],
    pre_push: ["auth_tests", "performance_check"],
    deployment: ["full_suite", "success_rate", "security_scan"],
  },
};

export default MonitoringConfig;
