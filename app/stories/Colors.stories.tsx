import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Design System/Colors",
  parameters: {
    docs: {
      description: {
        component:
          "Color palette for the HeroUI Heritage estate planning platform. All colors are WCAG 2.1 AA compliant and designed for trustworthiness and professionalism.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const ColorSwatch = ({
  name,
  className,
  hex,
  usage,
}: {
  name: string;
  className: string;
  hex: string;
  usage: string;
}) => (
  <div className="flex items-center gap-4 p-4 border rounded-lg">
    <div
      className={`w-16 h-16 rounded-lg ${className} border`}
      style={{ backgroundColor: hex }}
    />
    <div className="flex-1">
      <h4 className="font-semibold text-lg">{name}</h4>
      <p className="text-sm text-gray-600">{hex}</p>
      <p className="text-xs text-gray-500 mt-1">{usage}</p>
    </div>
  </div>
);

export const PrimaryColors: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Primary Colors</h2>
      <ColorSwatch
        name="Heritage Blue"
        className="bg-blue-600"
        hex="#2563eb"
        usage="Primary actions, links, key UI elements"
      />
      <ColorSwatch
        name="Heritage Blue Light"
        className="bg-blue-100"
        hex="#dbeafe"
        usage="Background highlights, hover states"
      />
      <ColorSwatch
        name="Heritage Blue Dark"
        className="bg-blue-900"
        hex="#1e3a8a"
        usage="Text on light backgrounds, emphasis"
      />
    </div>
  ),
};

export const SemanticColors: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Semantic Colors</h2>
      <ColorSwatch
        name="Success Green"
        className="bg-green-600"
        hex="#16a34a"
        usage="Success messages, completed states"
      />
      <ColorSwatch
        name="Warning Orange"
        className="bg-orange-500"
        hex="#f97316"
        usage="Warning messages, pending states"
      />
      <ColorSwatch
        name="Error Red"
        className="bg-red-600"
        hex="#dc2626"
        usage="Error messages, destructive actions"
      />
      <ColorSwatch
        name="Info Blue"
        className="bg-blue-500"
        hex="#3b82f6"
        usage="Information messages, tips"
      />
    </div>
  ),
};

export const NeutralColors: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Neutral Colors</h2>
      <ColorSwatch
        name="Text Primary"
        className="bg-gray-900"
        hex="#111827"
        usage="Primary text, headings"
      />
      <ColorSwatch
        name="Text Secondary"
        className="bg-gray-600"
        hex="#4b5563"
        usage="Secondary text, descriptions"
      />
      <ColorSwatch
        name="Border"
        className="bg-gray-300"
        hex="#d1d5db"
        usage="Borders, dividers"
      />
      <ColorSwatch
        name="Background"
        className="bg-gray-50"
        hex="#f9fafb"
        usage="Page backgrounds, cards"
      />
    </div>
  ),
};

export const AccessibilityCompliance: Story = {
  render: () => (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Accessibility Compliance</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            WCAG AA Compliant Combinations
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-600 text-white rounded">
              <span>White on Heritage Blue</span>
              <span className="text-sm">4.5:1</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 text-white rounded">
              <span>White on Dark Gray</span>
              <span className="text-sm">17.2:1</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white text-gray-900 border rounded">
              <span>Dark Gray on White</span>
              <span className="text-sm">17.2:1</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Color Blind Friendly</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span>Blue (Deuteranopia safe)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>Orange (High contrast)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-700 rounded"></div>
              <span>Gray (Neutral alternative)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};
