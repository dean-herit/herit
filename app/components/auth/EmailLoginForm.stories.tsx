import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect, fn } from "@storybook/test";
import { http, HttpResponse } from "msw";
import { EmailLoginForm } from "./EmailLoginForm";

const meta: Meta<typeof EmailLoginForm> = {
  title: "Auth/EmailLoginForm",
  component: EmailLoginForm,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Email-based user login form with validation",
      },
    },
    msw: {
      handlers: [
        http.post("/api/auth/signin/credentials", () => {
          return HttpResponse.json({
            user: { id: "1", email: "test@example.com" },
          });
        }),
      ],
    },
  },
  args: {
    onSubmit: fn(),
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify form renders with email and password inputs
    expect(canvas.getByLabelText(/email/i)).toBeVisible();
    expect(canvas.getByLabelText(/password/i)).toBeVisible();
    expect(canvas.getByRole("button", { name: /sign in/i })).toBeVisible();
  },
};

// Interactive story
export const Interactive: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Fill out the form
    const emailInput = canvas.getByLabelText(/email/i);
    const passwordInput = canvas.getByLabelText(/password/i);
    const submitButton = canvas.getByRole("button", { name: /sign in/i });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(submitButton);

    // Verify form submission
    expect(args.onSubmit).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  },
};

// Error state (if applicable)

// Error state
export const WithError: Story = {
  args: {
    error: "Invalid credentials. Please try again.",
  },
  parameters: {
    msw: {
      handlers: [
        http.post("/api/auth/signin/credentials", () => {
          return HttpResponse.json(
            { error: "Invalid credentials" },
            { status: 401 },
          );
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/invalid credentials/i)).toBeVisible();
  },
};

// Loading state (if applicable)

// Loading state
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
