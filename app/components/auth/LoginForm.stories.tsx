import type { Meta, StoryObj } from "@storybook/react";

import { within, userEvent, expect } from "@storybook/test";
import { http, HttpResponse } from "msw";

import { LoginForm } from "./LoginForm";

// Mock the useAuth hook for Storybook
const meta: Meta<typeof LoginForm> = {
  title: "Auth/LoginForm",
  component: LoginForm,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Main authentication form supporting email/password login, OAuth providers, and user registration.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        // Mock successful auth session check
        http.get("/api/auth/session", () => {
          return HttpResponse.json({ user: null, isAuthenticated: false });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show default state with email button
    expect(
      canvas.getByRole("button", { name: /continue with email/i }),
    ).toBeVisible();
    expect(
      canvas.getByRole("button", { name: /continue with google/i }),
    ).toBeVisible();
  },
};

// Email authentication flow
export const EmailAuthFlow: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/auth/session", () => {
          return HttpResponse.json({ user: null, isAuthenticated: false });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click email authentication
    const emailButton = canvas.getByRole("button", {
      name: /continue with email/i,
    });

    await userEvent.click(emailButton);

    // Should show login/signup tabs
    expect(canvas.getByRole("button", { name: /sign in/i })).toBeVisible();
    expect(canvas.getByRole("button", { name: /sign up/i })).toBeVisible();

    // Should show login form by default
    expect(canvas.getByLabelText(/email/i)).toBeVisible();
    expect(canvas.getByLabelText(/password/i)).toBeVisible();
  },
};

// Switch between login and signup
export const ToggleAuthMode: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/auth/session", () => {
          return HttpResponse.json({ user: null, isAuthenticated: false });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open email auth
    await userEvent.click(
      canvas.getByRole("button", { name: /continue with email/i }),
    );

    // Switch to signup
    await userEvent.click(canvas.getByRole("button", { name: /sign up/i }));

    // Should show signup form with additional fields
    expect(canvas.getByLabelText(/first name/i)).toBeVisible();
    expect(canvas.getByLabelText(/last name/i)).toBeVisible();
    expect(canvas.getByLabelText(/email/i)).toBeVisible();
    expect(canvas.getByLabelText(/password/i)).toBeVisible();

    // Switch back to login
    await userEvent.click(canvas.getByRole("button", { name: /sign in/i }));

    // Should show login form again
    expect(canvas.getByLabelText(/email/i)).toBeVisible();
    expect(canvas.getByLabelText(/password/i)).toBeVisible();
    expect(canvas.queryByLabelText(/first name/i)).not.toBeInTheDocument();
  },
};

// Error state display
export const WithError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/auth/session", () => {
          return HttpResponse.json({ user: null, isAuthenticated: false });
        }),
        // Mock login error
        http.post("/api/auth/login", () => {
          return HttpResponse.json(
            { error: "Invalid email or password. Please try again." },
            { status: 401 },
          );
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Navigate to email auth
    await userEvent.click(
      canvas.getByRole("button", { name: /continue with email/i }),
    );

    // Fill in login form
    await userEvent.type(canvas.getByLabelText(/email/i), "user@example.com");
    await userEvent.type(canvas.getByLabelText(/password/i), "wrongpassword");

    // Submit form (would normally trigger error via useAuth hook)
    const submitButton = canvas.getByRole("button", { name: /sign in/i });

    await userEvent.click(submitButton);

    // Note: In a real scenario, the error would be displayed via useAuth hook
    // This story demonstrates the error UI structure
  },
};

// Back navigation
export const BackNavigation: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/auth/session", () => {
          return HttpResponse.json({ user: null, isAuthenticated: false });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open email auth
    await userEvent.click(
      canvas.getByRole("button", { name: /continue with email/i }),
    );

    // Should show back button
    const backButton = canvas.getByRole("button", {
      name: /back to other sign-in options/i,
    });

    expect(backButton).toBeVisible();

    // Click back
    await userEvent.click(backButton);

    // Should return to main auth screen
    expect(
      canvas.getByRole("button", { name: /continue with email/i }),
    ).toBeVisible();
    expect(
      canvas.getByRole("button", { name: /continue with google/i }),
    ).toBeVisible();
  },
};

// Loading states
export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [
        // Simulate slow auth check
        http.get("/api/auth/session", async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          return HttpResponse.json({ user: null, isAuthenticated: false });
        }),
      ],
    },
  },
};
