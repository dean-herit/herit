import type { Meta, StoryObj } from "@storybook/react";

import { within, userEvent, expect, fn } from "@storybook/test";

import { VerticalSteps, VerticalStepProps } from "./VerticalSteps";

// Mock steps data
const mockSteps: VerticalStepProps[] = [
  {
    title: "Personal Information",
    description: "Enter your basic details and contact information",
  },
  {
    title: "Digital Signature",
    description: "Create your legal digital signature",
  },
  {
    title: "Legal Consent",
    description: "Review and accept terms and conditions",
  },
  {
    title: "Identity Verification",
    description: "Verify your identity with official documents",
  },
];

const meta: Meta<typeof VerticalSteps> = {
  title: "UI/VerticalSteps",
  component: VerticalSteps,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Vertical stepper component for multi-step processes like onboarding flows.",
      },
    },
  },
  args: {
    steps: mockSteps,
    onStepChange: fn(),
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story - step 1 active
export const Default: Story = {
  args: {
    currentStep: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show all steps
    expect(canvas.getByText("Personal Information")).toBeVisible();
    expect(canvas.getByText("Digital Signature")).toBeVisible();
    expect(canvas.getByText("Legal Consent")).toBeVisible();
    expect(canvas.getByText("Identity Verification")).toBeVisible();

    // First step should be active (step number visible)
    expect(canvas.getByText("1")).toBeVisible();
  },
};

// Step 2 active
export const Step2Active: Story = {
  args: {
    currentStep: 1,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // First step should be completed (checkmark)
    const checkIcon = canvas.getByRole("img", { hidden: true }); // CheckIcon

    expect(checkIcon).toBeInTheDocument();

    // Second step should be active
    expect(canvas.getByText("2")).toBeVisible();
  },
};

// Step 3 active with progress line
export const Step3Active: Story = {
  args: {
    currentStep: 2,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Steps 1 and 2 should be completed
    const checkIcons = canvas.getAllByRole("img", { hidden: true });

    expect(checkIcons).to.have.length.at.least(2);

    // Step 3 should be active
    expect(canvas.getByText("3")).toBeVisible();
  },
};

// All steps completed
export const AllCompleted: Story = {
  args: {
    currentStep: 4,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // All steps should have checkmarks
    const checkIcons = canvas.getAllByRole("img", { hidden: true });

    expect(checkIcons).to.have.length.at.least(4);
  },
};

// Click interaction
export const ClickableSteps: Story = {
  args: {
    currentStep: 2,
    clickableSteps: [true, true, true, false], // Last step not clickable
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click on first step (completed)
    const personalInfoStep = canvas.getByText("Personal Information");

    await userEvent.click(personalInfoStep);

    // Should call onStepChange
    expect(args.onStepChange).toHaveBeenCalledWith(0);
  },
};

// Non-clickable steps
export const NonClickableSteps: Story = {
  args: {
    currentStep: 1,
    clickableSteps: [false, false, false, false], // All steps non-clickable
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Try to click a step
    const personalInfoStep = canvas.getByText("Personal Information");

    await userEvent.click(personalInfoStep);

    // Should not call onStepChange
    expect(args.onStepChange).not.toHaveBeenCalled();
  },
};

// Hidden progress bars
export const NoProgressBars: Story = {
  args: {
    currentStep: 1,
    hideProgressBars: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show steps without connecting lines
    expect(canvas.getByText("Personal Information")).toBeVisible();
    expect(canvas.getByText("Digital Signature")).toBeVisible();
  },
};

// Custom step classes
export const CustomStyling: Story = {
  args: {
    currentStep: 1,
    className: "bg-gray-50 p-4 rounded-lg",
    stepClassName: "hover:bg-blue-50 transition-colors",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Custom styling should be applied
    expect(canvas.getByText("Personal Information")).toBeVisible();
  },
};

// Single step
export const SingleStep: Story = {
  args: {
    steps: [mockSteps[0]],
    currentStep: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show only one step
    expect(canvas.getByText("Personal Information")).toBeVisible();
    expect(canvas.queryByText("Digital Signature")).not.toBeInTheDocument();
  },
};

// Many steps (scrolling scenario)
export const ManySteps: Story = {
  args: {
    steps: [
      ...mockSteps,
      {
        title: "Additional Step 1",
        description: "More steps for complex workflows",
      },
      {
        title: "Additional Step 2",
        description: "Testing with many steps",
      },
      {
        title: "Final Step",
        description: "The last step in a long process",
      },
    ],
    currentStep: 3,
  },
  parameters: {
    layout: "padded",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show all steps
    expect(canvas.getByText("Personal Information")).toBeVisible();
    expect(canvas.getByText("Final Step")).toBeVisible();
  },
};

// Long text handling
export const LongText: Story = {
  args: {
    steps: [
      {
        title:
          "This Is A Very Long Step Title That Should Handle Text Wrapping Gracefully",
        description:
          "This is a very long description that should wrap properly and not break the layout of the vertical steps component even with extensive text content.",
      },
      {
        title: "Normal Step",
        description: "Regular description",
      },
    ],
    currentStep: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Long text should be visible and wrapped properly
    expect(canvas.getByText(/This Is A Very Long Step Title/)).toBeVisible();
    expect(canvas.getByText(/This is a very long description/)).toBeVisible();
  },
};

// Interactive demo
export const InteractiveDemo: Story = {
  render: function InteractiveSteps() {
    const [currentStep, setCurrentStep] = React.useState(0);

    return (
      <div className="space-y-4">
        <VerticalSteps
          clickableSteps={[true, true, true, true]}
          currentStep={currentStep}
          steps={mockSteps}
          onStepChange={setCurrentStep}
        />
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded"
            data-testid="button-w1pdzptrn"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded"
            data-testid="button-8ebcqgf9s"
            disabled={currentStep === mockSteps.length - 1}
            onClick={() =>
              setCurrentStep(Math.min(mockSteps.length - 1, currentStep + 1))
            }
          >
            Next
          </button>
        </div>
      </div>
    );
  },
  parameters: {
    layout: "padded",
  },
};
