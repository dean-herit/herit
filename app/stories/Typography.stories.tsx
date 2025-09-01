import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Design System/Typography",
  parameters: {
    docs: {
      description: {
        component:
          "Typography scale and styles for the HeroUI Heritage platform. Designed for readability, accessibility, and professional estate planning context.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const TypeScale = ({
  level,
  className,
  children,
}: {
  level: string;
  className: string;
  children: React.ReactNode;
}) => (
  <div className="border-b border-gray-200 py-4">
    <div className="flex items-baseline gap-4 mb-2">
      <span className="text-sm text-gray-500 w-20">{level}</span>
      <span className="text-sm font-mono text-gray-400">{className}</span>
    </div>
    <div className={className}>{children}</div>
  </div>
);

export const Headings: Story = {
  render: () => (
    <div className="max-w-4xl space-y-0">
      <h2 className="text-2xl font-bold mb-6">Heading Hierarchy</h2>
      <TypeScale level="H1" className="text-4xl font-bold text-gray-900">
        Estate Planning Dashboard
      </TypeScale>
      <TypeScale level="H2" className="text-3xl font-bold text-gray-900">
        Assets & Beneficiaries
      </TypeScale>
      <TypeScale level="H3" className="text-2xl font-semibold text-gray-900">
        Property Assets
      </TypeScale>
      <TypeScale level="H4" className="text-xl font-semibold text-gray-900">
        Residential Property
      </TypeScale>
      <TypeScale level="H5" className="text-lg font-medium text-gray-900">
        Property Details
      </TypeScale>
      <TypeScale level="H6" className="text-base font-medium text-gray-900">
        Additional Information
      </TypeScale>
    </div>
  ),
};

export const BodyText: Story = {
  render: () => (
    <div className="max-w-4xl space-y-0">
      <h2 className="text-2xl font-bold mb-6">Body Text Styles</h2>
      <TypeScale level="Large" className="text-lg text-gray-900">
        Large body text for introductions and important content. Used sparingly
        for emphasis and key information that needs to stand out from regular
        body text.
      </TypeScale>
      <TypeScale level="Regular" className="text-base text-gray-900">
        Regular body text for most content. This is the primary text style used
        throughout the application for descriptions, form labels, and general
        content.
      </TypeScale>
      <TypeScale level="Small" className="text-sm text-gray-600">
        Small text for secondary information, captions, and helper text. Often
        used for form descriptions, metadata, and supplementary details.
      </TypeScale>
      <TypeScale level="Extra Small" className="text-xs text-gray-500">
        Extra small text for fine print, legal disclaimers, and very minor
        supporting information.
      </TypeScale>
    </div>
  ),
};

export const SpecializedText: Story = {
  render: () => (
    <div className="max-w-4xl space-y-0">
      <h2 className="text-2xl font-bold mb-6">Specialized Text Styles</h2>
      <TypeScale level="Lead" className="text-xl text-gray-700 font-light">
        Lead text for article introductions and important announcements. This
        style draws attention while maintaining readability.
      </TypeScale>
      <TypeScale
        level="Code"
        className="text-sm font-mono bg-gray-100 px-2 py-1 rounded"
      >
        PPS1234567T, D02 X285, €125,000
      </TypeScale>
      <TypeScale
        level="Link"
        className="text-base text-blue-600 hover:text-blue-800 underline"
      >
        Navigate to beneficiaries section
      </TypeScale>
      <TypeScale level="Error" className="text-sm text-red-600 font-medium">
        Please provide a valid Irish Eircode
      </TypeScale>
      <TypeScale level="Success" className="text-sm text-green-600 font-medium">
        Asset information saved successfully
      </TypeScale>
    </div>
  ),
};

export const FormLabels: Story = {
  render: () => (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Form Typography</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base"
            placeholder="Enter your full name"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter your legal name as it appears on official documents
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PPS Number
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-base font-mono"
            placeholder="1234567T"
          />
        </div>

        <div className="border border-red-300 rounded-md p-3 bg-red-50">
          <p className="text-sm text-red-800">
            <span className="font-medium">Validation Error:</span> Please enter
            a valid Irish PPS number
          </p>
        </div>
      </div>
    </div>
  ),
};

export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Accessibility Features</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Contrast Ratios</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Heading on white</span>
              <span className="text-sm font-mono">17.2:1</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Body text on white</span>
              <span className="text-sm font-mono">17.2:1</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Secondary text</span>
              <span className="text-sm font-mono">7.8:1</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Link text</span>
              <span className="text-sm font-mono">4.7:1</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Font Features</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              OpenType features enabled
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Tabular numbers for financial data
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Proper line height ratios (1.5-1.6)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              System font fallbacks
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Screen Reader Support:</span> All text
          styles include proper semantic markup and ARIA labels where
          appropriate for optimal screen reader compatibility.
        </p>
      </div>
    </div>
  ),
};
