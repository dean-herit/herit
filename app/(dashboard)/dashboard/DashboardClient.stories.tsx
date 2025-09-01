import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect, fn } from "@storybook/test";
import { http, HttpResponse } from "msw";
import { DashboardClient } from "./DashboardClient";

const mockDashboardData = {
  stats: {
    totalAssets: 3,
    totalValue: 250000,
    beneficiaries: 2,
    documents: 5,
  },
  recentAssets: [
    { id: "1", name: "Family Home", type: "property", value: 150000 },
    { id: "2", name: "Savings Account", type: "financial", value: 75000 },
  ],
  recentBeneficiaries: [
    {
      id: "1",
      name: "John Doe",
      relationship: "son",
      allocation_percentage: 60,
    },
    {
      id: "2",
      name: "Jane Doe",
      relationship: "daughter",
      allocation_percentage: 40,
    },
  ],
};

const meta: Meta<typeof DashboardClient> = {
  title: "Dashboard/DashboardClient",
  component: DashboardClient,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Main dashboard showing estate overview and statistics",
      },
    },
    msw: {
      handlers: [
        http.get("/api/dashboard/stats", () => {
          return HttpResponse.json(mockDashboardData.stats);
        }),
        http.get("/api/assets", () => {
          return HttpResponse.json(mockDashboardData.recentAssets);
        }),
        http.get("/api/beneficiaries", () => {
          return HttpResponse.json(mockDashboardData.recentBeneficiaries);
        }),
        http.get("/api/auth/session", () => {
          return HttpResponse.json({
            user: { id: "1", email: "user@example.com" },
          });
        }),
      ],
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify dashboard stats cards render
    expect(canvas.getByText(/total assets/i)).toBeVisible();
    expect(canvas.getByText(/total value/i)).toBeVisible();
    expect(canvas.getByText(/beneficiaries/i)).toBeVisible();

    // Verify stats values
    expect(canvas.getByText("3")).toBeVisible(); // total assets
    expect(canvas.getByText("€250,000")).toBeVisible(); // total value
    expect(canvas.getByText("2")).toBeVisible(); // beneficiaries
  },
};

// Interactive story
export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test navigation buttons
    const addAssetButton = canvas.getByRole("button", { name: /add asset/i });
    const addBeneficiaryButton = canvas.getByRole("button", {
      name: /add beneficiary/i,
    });

    expect(addAssetButton).toBeVisible();
    expect(addBeneficiaryButton).toBeVisible();

    // Test clicking navigation buttons
    await userEvent.click(addAssetButton);
    await userEvent.click(addBeneficiaryButton);

    // Test recent items navigation
    const firstAssetLink = canvas.getByText("Family Home");
    await userEvent.click(firstAssetLink);
  },
};

// Loading state
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/dashboard/stats", () => {
          return new Promise(() => {}); // Never resolves
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByTestId("dashboard-loading")).toBeVisible();
  },
};

// Error state
export const WithError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/dashboard/stats", () => {
          return HttpResponse.json(
            { error: "Failed to load dashboard" },
            { status: 500 },
          );
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/error loading dashboard/i)).toBeVisible();
  },
};

// Empty state
export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/dashboard/stats", () => {
          return HttpResponse.json({
            totalAssets: 0,
            totalValue: 0,
            beneficiaries: 0,
            documents: 0,
          });
        }),
        http.get("/api/assets", () => {
          return HttpResponse.json([]);
        }),
        http.get("/api/beneficiaries", () => {
          return HttpResponse.json([]);
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/no assets yet/i)).toBeVisible();
    expect(canvas.getByText(/no beneficiaries yet/i)).toBeVisible();
  },
};
