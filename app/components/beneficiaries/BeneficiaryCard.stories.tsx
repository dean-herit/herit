import type { Meta, StoryObj } from "@storybook/react";

import { within, userEvent, expect, fn } from "@storybook/test";

import { BeneficiaryCard } from "./BeneficiaryCard";

import { BeneficiaryWithPhoto } from "@/app/types/beneficiaries";

// Mock beneficiary data
const mockBeneficiary: BeneficiaryWithPhoto = {
  id: "1",
  user_id: "user-1",
  name: "John Doe",
  relationship_type: "spouse",
  percentage: 50,
  email: "john.doe@example.com",
  phone: "+353 85 123 4567",
  address_line_1: "123 Main Street",
  address_line_2: "Apartment 2B",
  city: "Dublin",
  county: "Dublin",
  eircode: "D02 X285",
  country: "Ireland",
  pps_number: "1234567T",
  photo_url: "https://via.placeholder.com/150",
  conditions: "Must complete university education before inheritance",
  created_at: new Date(),
  updated_at: new Date(),
  date_of_birth: "1990-01-15",
};

const mockBeneficiaryMinimal: BeneficiaryWithPhoto = {
  id: "2",
  user_id: "user-1",
  name: "Jane Smith",
  relationship_type: "child",
  percentage: 25,
  email: null,
  phone: null,
  address_line_1: null,
  address_line_2: null,
  city: null,
  county: null,
  eircode: null,
  country: null,
  pps_number: null,
  photo_url: null,
  conditions: null,
  created_at: new Date(),
  updated_at: new Date(),
  date_of_birth: null,
};

const meta: Meta<typeof BeneficiaryCard> = {
  title: "Beneficiaries/BeneficiaryCard",
  component: BeneficiaryCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Card component for displaying beneficiary information with actions for edit, delete, and view.",
      },
    },
  },
  args: {
    onEdit: fn(),
    onDelete: fn(),
    onView: fn(),
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with full beneficiary data
export const Default: Story = {
  args: {
    beneficiary: mockBeneficiary,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Should display beneficiary information
    expect(canvas.getByText("John Doe")).toBeVisible();
    expect(canvas.getByText("Spouse")).toBeVisible();
    expect(canvas.getByText("50%")).toBeVisible();
    expect(canvas.getByText("john.doe@example.com")).toBeVisible();
    expect(canvas.getByText("+353 85 123 4567")).toBeVisible();
    expect(canvas.getByText(/123 Main Street/)).toBeVisible();
    expect(canvas.getByText("PPS: 1234567T")).toBeVisible();
    expect(
      canvas.getByText(/Must complete university education/),
    ).toBeVisible();
  },
};

// Minimal beneficiary data
export const MinimalData: Story = {
  args: {
    beneficiary: mockBeneficiaryMinimal,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should display basic information
    expect(canvas.getByText("Jane Smith")).toBeVisible();
    expect(canvas.getByText("Child")).toBeVisible();
    expect(canvas.getByText("25%")).toBeVisible();

    // Should not display optional information when null
    expect(canvas.queryByText(/@/)).not.toBeInTheDocument();
    expect(canvas.queryByText(/\+/)).not.toBeInTheDocument();
    expect(canvas.queryByText(/PPS:/)).not.toBeInTheDocument();
    expect(canvas.queryByText(/Conditions:/)).not.toBeInTheDocument();
  },
};

// Without photo
export const NoPhoto: Story = {
  args: {
    beneficiary: {
      ...mockBeneficiary,
      photo_url: null,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show initials fallback
    const avatar = canvas.getByText("JD");

    expect(avatar).toBeVisible();
  },
};

// Dropdown interactions
export const DropdownInteraction: Story = {
  args: {
    beneficiary: mockBeneficiary,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click dropdown trigger
    const dropdownButton = canvas.getByRole("button", { name: /options/i });

    await userEvent.click(dropdownButton);

    // Should show dropdown menu
    expect(canvas.getByText("Edit")).toBeVisible();
    expect(canvas.getByText("Delete")).toBeVisible();
  },
};

// Edit action
export const EditAction: Story = {
  args: {
    beneficiary: mockBeneficiary,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Open dropdown and click edit
    const dropdownButton = canvas.getByRole("button", { name: /options/i });

    await userEvent.click(dropdownButton);

    const editButton = canvas.getByText("Edit");

    await userEvent.click(editButton);

    // Should call onEdit
    expect(args.onEdit).toHaveBeenCalledWith(mockBeneficiary);
  },
};

// Delete action
export const DeleteAction: Story = {
  args: {
    beneficiary: mockBeneficiary,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Open dropdown and click delete
    const dropdownButton = canvas.getByRole("button", { name: /options/i });

    await userEvent.click(dropdownButton);

    const deleteButton = canvas.getByText("Delete");

    await userEvent.click(deleteButton);

    // Should call onDelete
    expect(args.onDelete).toHaveBeenCalledWith(mockBeneficiary);
  },
};

// Card click to view
export const ViewAction: Story = {
  args: {
    beneficiary: mockBeneficiary,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click on the card (not the dropdown)
    const cardElement = canvas.getByTestId(
      `beneficiary-card-${mockBeneficiary.id}`,
    );

    await userEvent.click(cardElement);

    // Should call onView
    expect(args.onView).toHaveBeenCalledWith(mockBeneficiary);
  },
};

// Different relationship types
export const DifferentRelationships: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <BeneficiaryCard
        beneficiary={{
          ...mockBeneficiary,
          relationship_type: "spouse",
          name: "Sarah Spouse",
        }}
        onDelete={fn()}
        onEdit={fn()}
        onView={fn()}
      />
      <BeneficiaryCard
        beneficiary={{
          ...mockBeneficiary,
          relationship_type: "child",
          name: "Tommy Child",
          percentage: 25,
        }}
        onDelete={fn()}
        onEdit={fn()}
        onView={fn()}
      />
      <BeneficiaryCard
        beneficiary={{
          ...mockBeneficiary,
          relationship_type: "parent",
          name: "Mary Parent",
          percentage: 15,
        }}
        onDelete={fn()}
        onEdit={fn()}
        onView={fn()}
      />
      <BeneficiaryCard
        beneficiary={{
          ...mockBeneficiary,
          relationship_type: "sibling",
          name: "Bob Sibling",
          percentage: 10,
        }}
        onDelete={fn()}
        onEdit={fn()}
        onView={fn()}
      />
    </div>
  ),
  parameters: {
    layout: "padded",
  },
};

// Long text handling
export const LongText: Story = {
  args: {
    beneficiary: {
      ...mockBeneficiary,
      name: "This Is A Very Long Name That Should Handle Text Wrapping Properly",
      address_line_1:
        "This is a very long address line that should be truncated or wrapped properly in the UI",
      conditions:
        "This is a very long condition text that should be displayed properly without breaking the card layout and should wrap to multiple lines if needed",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should handle long text gracefully
    expect(canvas.getByText(/This Is A Very Long Name/)).toBeVisible();
    expect(canvas.getByText(/This is a very long address/)).toBeVisible();
    expect(canvas.getByText(/This is a very long condition/)).toBeVisible();
  },
};

// High inheritance percentage
export const HighPercentage: Story = {
  args: {
    beneficiary: {
      ...mockBeneficiary,
      percentage: 100,
      relationship_type: "spouse",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByText("100%")).toBeVisible();
  },
};
