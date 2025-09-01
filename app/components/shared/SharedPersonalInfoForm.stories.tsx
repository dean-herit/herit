import type { Meta, StoryObj } from "@storybook/react";

import { within } from "@storybook/test";

import { SharedPersonalInfoForm } from "./SharedPersonalInfoForm";

const meta: Meta<typeof SharedPersonalInfoForm> = {
  title: "Shared/SharedPersonalInfoForm",
  component: SharedPersonalInfoForm,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Reusable personal information form component",
      },
    },
  },
  // Add common args here based on component analysis
  args: {
    // Add form-specific args here
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

// Error state
export const WithError: Story = {
  args: {
    error: "Something went wrong",
  },
};

// Loading state (if applicable)

// Loading state
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
