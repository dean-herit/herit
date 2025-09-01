import type { Meta, StoryObj } from "@storybook/react";

import { within, fn } from "@storybook/test";

import { GoogleSignInButton } from "./GoogleSignInButton";

const meta: Meta<typeof GoogleSignInButton> = {
  title: "Auth/GoogleSignInButton",
  component: GoogleSignInButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Google OAuth sign-in button component",
      },
    },
  },
  // Add common args here based on component analysis
  args: {
    onClick: fn(),
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  // Add default story configuration

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Add basic interaction tests
    // Verify component renders
    // expect(canvas.getByRole("")).toBeVisible();
  },
};

// Interactive story
export const Interactive: Story = {
  args: {
    // Add interactive story args
  },

  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Add interaction tests
    // Test user interactions
    // await userEvent.click(canvas.getByRole("button"));
  },
};

// Error state (if applicable)

// Loading state (if applicable)

// Loading state
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
