import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect, fn } from "@storybook/test";
import { http, HttpResponse } from "msw";
import { BeneficiaryForm } from "./BeneficiaryForm";

const mockBeneficiary = {
  id: "1",
  name: "John Doe",
  relationship: "son" as const,
  allocation_percentage: 50,
  contact_info: {
    phone: "+353-1-555-0123",
    email: "john@example.com",
    address: "123 Main St, Dublin",
  },
};

const meta: Meta<typeof BeneficiaryForm> = {
  title: "Beneficiaries/BeneficiaryForm",
  component: BeneficiaryForm,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Form for creating and editing beneficiary information",
      },
    },
    msw: {
      handlers: [
        http.post("/api/beneficiaries", () => {
          return HttpResponse.json({ ...mockBeneficiary, id: "new-id" });
        }),
        http.put("/api/beneficiaries/:id", () => {
          return HttpResponse.json(mockBeneficiary);
        }),
      ],
    },
  },
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify form fields render
    expect(canvas.getByLabelText(/name/i)).toBeVisible();
    expect(canvas.getByLabelText(/relationship/i)).toBeVisible();
    expect(canvas.getByLabelText(/allocation/i)).toBeVisible();
    expect(canvas.getByRole("button", { name: /save/i })).toBeVisible();
  },
};

// Interactive story
export const Interactive: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Fill out the beneficiary form
    await userEvent.type(canvas.getByLabelText(/name/i), "Jane Smith");
    await userEvent.selectOptions(
      canvas.getByLabelText(/relationship/i),
      "daughter",
    );
    await userEvent.type(canvas.getByLabelText(/allocation/i), "25");

    // Add contact info
    await userEvent.type(canvas.getByLabelText(/phone/i), "+353-1-555-0124");
    await userEvent.type(canvas.getByLabelText(/email/i), "jane@example.com");

    // Submit form
    await userEvent.click(canvas.getByRole("button", { name: /save/i }));

    // Verify submission
    expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Jane Smith",
        relationship: "daughter",
        allocation_percentage: 25,
      }),
    );
  },
};

// Error state (if applicable)

// Error state
export const WithError: Story = {
  args: {
    error: "Failed to save beneficiary. Please try again.",
  },
  parameters: {
    msw: {
      handlers: [
        http.post("/api/beneficiaries", () => {
          return HttpResponse.json(
            { error: "Validation failed" },
            { status: 400 },
          );
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(/failed to save beneficiary/i)).toBeVisible();
  },
};

// Loading state (if applicable)

// Edit mode story
export const EditMode: Story = {
  args: {
    initialData: mockBeneficiary,
    mode: "edit" as const,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify form is pre-filled
    expect(canvas.getByDisplayValue("John Doe")).toBeVisible();
    expect(canvas.getByDisplayValue("50")).toBeVisible();
    expect(canvas.getByRole("button", { name: /update/i })).toBeVisible();
  },
};

// Loading state
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
