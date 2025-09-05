import type { Meta, StoryObj } from "@storybook/react";
import { TestStatusDashboard } from "./TestStatusDashboard";

const mockTestResults = {
  executionId: "test-1693845000000",
  timestamp: "2025-09-02T13:00:00.000Z",
  status: "completed" as const,
  overallSuccess: true,
  results: {
    backendTests: {
      command: "npm run test:unit -- tests/api/assets/assets.test.ts",
      status: "completed" as const,
      output: "✓ tests/api/assets/assets.test.ts (16 tests) 4753ms",
      startTime: Date.now() - 5000,
      endTime: Date.now(),
      duration: 5000,
    },
    linting: {
      command: "npm run lint",
      status: "completed" as const,
      output: "All files passed linting checks",
      startTime: Date.now() - 3000,
      endTime: Date.now(),
      duration: 3000,
    },
    build: {
      command: "npm run build",
      status: "completed" as const,
      output: "Build completed successfully",
      startTime: Date.now() - 30000,
      endTime: Date.now(),
      duration: 30000,
    },
    componentTests: {
      command: "npm run test:ct",
      status: "completed" as const,
      output: "All component tests passed",
      startTime: Date.now() - 45000,
      endTime: Date.now(),
      duration: 45000,
    },
  },
  totalDuration: 83000,
};

const mockFailedResults = {
  ...mockTestResults,
  overallSuccess: false,
  status: "failed" as const,
  results: {
    ...mockTestResults.results,
    build: {
      ...mockTestResults.results.build,
      status: "failed" as const,
      error: "Build failed with TypeScript errors",
    },
  },
};

const meta = {
  title: "Dashboard/TestStatusDashboard",
  component: TestStatusDashboard,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    initialResults: {
      description: "Initial test results to display",
    },
  },
} satisfies Meta<typeof TestStatusDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSuccessfulResults: Story = {
  args: {
    initialResults: mockTestResults,
  },
};

export const WithFailedResults: Story = {
  args: {
    initialResults: mockFailedResults,
  },
};

export const WithNoResults: Story = {
  args: {
    initialResults: null,
  },
};

export const WithRunningTests: Story = {
  args: {
    initialResults: {
      ...mockTestResults,
      status: "running",
      overallSuccess: false,
      results: {
        backendTests: {
          ...mockTestResults.results.backendTests,
          status: "completed",
        },
        linting: {
          ...mockTestResults.results.linting,
          status: "running",
        },
        build: {
          ...mockTestResults.results.build,
          status: "pending",
        },
        componentTests: {
          ...mockTestResults.results.componentTests,
          status: "pending",
        },
      },
    },
  },
};