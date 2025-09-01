import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";
import { BeneficiaryCard } from "@/components/beneficiaries/BeneficiaryCard";
import { BeneficiaryWithPhoto } from "@/app/types/beneficiaries";

const meta: Meta = {
  title: "Performance Testing/Component Performance",
  parameters: {
    docs: {
      description: {
        component:
          "Performance testing stories to measure and monitor component rendering performance, memory usage, and interaction responsiveness.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Generate mock data for performance testing
const generateMockBeneficiaries = (count: number): BeneficiaryWithPhoto[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `beneficiary-${i}`,
    user_id: "user-1",
    name: `Test Beneficiary ${i + 1}`,
    relationship_type: ["spouse", "child", "parent", "sibling"][i % 4] as any,
    percentage: Math.floor(Math.random() * 100),
    email: `beneficiary${i}@example.com`,
    phone: `+353 85 ${String(i).padStart(3, "0")} ${String(i * 2).padStart(4, "0")}`,
    address_line_1: `${i + 1} Test Street`,
    address_line_2: i % 3 === 0 ? `Apartment ${i}` : null,
    city: "Dublin",
    county: "Dublin",
    eircode: `D0${(i % 9) + 1} X${String(i).padStart(3, "0")}`,
    country: "Ireland",
    pps_number: `${String(i).padStart(7, "0")}T`,
    photo_url: i % 2 === 0 ? `https://via.placeholder.com/150?text=${i}` : null,
    conditions: i % 3 === 0 ? `Special condition for beneficiary ${i}` : null,
    created_at: new Date(),
    updated_at: new Date(),
    date_of_birth: `19${70 + (i % 30)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
  }));
};

// Performance measurement utilities
const measureRenderTime = async () => {
  const start = performance.now();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return performance.now() - start;
};

const measureMemoryUsage = () => {
  if ("memory" in performance) {
    return {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    };
  }
  return null;
};

export const SmallListPerformance: Story = {
  render: () => {
    const beneficiaries = generateMockBeneficiaries(10);
    return (
      <div className="space-y-4 max-w-4xl">
        <h2 className="text-2xl font-bold">Small List (10 items)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {beneficiaries.map((beneficiary) => (
            <BeneficiaryCard
              key={beneficiary.id}
              beneficiary={beneficiary}
              onEdit={() => {}}
              onDelete={() => {}}
              onView={() => {}}
            />
          ))}
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const startTime = performance.now();

    // Wait for all components to render
    await canvas.findAllByText(/Test Beneficiary/);

    const renderTime = performance.now() - startTime;
    console.log(`Small list render time: ${renderTime.toFixed(2)}ms`);

    // Should render quickly for small lists
    expect(renderTime).toBeLessThan(100);

    // Check that all items are present
    const items = await canvas.findAllByText(/Test Beneficiary/);
    expect(items).toHaveLength(10);
  },
};

export const MediumListPerformance: Story = {
  render: () => {
    const beneficiaries = generateMockBeneficiaries(50);
    return (
      <div className="space-y-4 max-w-4xl">
        <h2 className="text-2xl font-bold">Medium List (50 items)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {beneficiaries.map((beneficiary) => (
            <BeneficiaryCard
              key={beneficiary.id}
              beneficiary={beneficiary}
              onEdit={() => {}}
              onDelete={() => {}}
              onView={() => {}}
            />
          ))}
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const startTime = performance.now();
    const initialMemory = measureMemoryUsage();

    // Wait for first few items to render (virtual scrolling consideration)
    await canvas.findByText("Test Beneficiary 1");

    const renderTime = performance.now() - startTime;
    const finalMemory = measureMemoryUsage();

    console.log(`Medium list render time: ${renderTime.toFixed(2)}ms`);
    if (initialMemory && finalMemory) {
      const memoryIncrease =
        finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      console.log(
        `Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    // Should still render reasonably quickly
    expect(renderTime).toBeLessThan(500);
  },
};

export const InteractionPerformance: Story = {
  render: () => {
    const beneficiary = generateMockBeneficiaries(1)[0];
    return (
      <div className="max-w-md">
        <h2 className="text-2xl font-bold mb-4">Interaction Performance</h2>
        <BeneficiaryCard
          beneficiary={beneficiary}
          onEdit={() => console.log("Edit clicked")}
          onDelete={() => console.log("Delete clicked")}
          onView={() => console.log("View clicked")}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test dropdown interaction performance
    const dropdownButton = canvas.getByRole("button", { name: /options/i });

    const interactionStart = performance.now();
    dropdownButton.click();

    // Wait for dropdown to appear
    await canvas.findByText("Edit");

    const interactionTime = performance.now() - interactionStart;
    console.log(`Dropdown interaction time: ${interactionTime.toFixed(2)}ms`);

    // Interactions should feel instant (< 16ms for 60fps)
    expect(interactionTime).toBeLessThan(50);
  },
};

export const MemoryLeakTest: Story = {
  render: () => {
    const [beneficiaries, setBeneficiaries] = React.useState(() =>
      generateMockBeneficiaries(20),
    );

    React.useEffect(() => {
      const interval = setInterval(() => {
        setBeneficiaries(generateMockBeneficiaries(20));
      }, 1000);

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="space-y-4 max-w-4xl">
        <h2 className="text-2xl font-bold">Memory Leak Test</h2>
        <p className="text-sm text-gray-600">
          Components re-render every second to test for memory leaks
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {beneficiaries.slice(0, 6).map((beneficiary) => (
            <BeneficiaryCard
              key={beneficiary.id}
              beneficiary={beneficiary}
              onEdit={() => {}}
              onDelete={() => {}}
              onView={() => {}}
            />
          ))}
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const initialMemory = measureMemoryUsage();

    // Wait for initial render
    await canvas.findByText("Test Beneficiary 1");

    // Wait for a few re-renders
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const finalMemory = measureMemoryUsage();

    if (initialMemory && finalMemory) {
      const memoryGrowth =
        finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const memoryGrowthMB = memoryGrowth / 1024 / 1024;

      console.log(
        `Memory growth after re-renders: ${memoryGrowthMB.toFixed(2)}MB`,
      );

      // Memory growth should be minimal for proper cleanup
      expect(memoryGrowthMB).toBeLessThan(5);
    }
  },
};

export const LargeDatasetPerformance: Story = {
  render: () => {
    const beneficiaries = generateMockBeneficiaries(100);
    const [visibleCount, setVisibleCount] = React.useState(20);

    return (
      <div className="space-y-4 max-w-4xl">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Large Dataset (100 items)</h2>
          <div className="space-x-2">
            <button
              onClick={() => setVisibleCount(Math.min(visibleCount + 20, 100))}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              Load More
            </button>
            <span className="text-sm text-gray-600">
              Showing {visibleCount} of {beneficiaries.length}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {beneficiaries.slice(0, visibleCount).map((beneficiary) => (
            <BeneficiaryCard
              key={beneficiary.id}
              beneficiary={beneficiary}
              onEdit={() => {}}
              onDelete={() => {}}
              onView={() => {}}
            />
          ))}
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const loadMoreButton = canvas.getByText("Load More");

    const initialRenderTime = performance.now();
    await canvas.findByText("Test Beneficiary 1");
    const initialTime = performance.now() - initialRenderTime;

    console.log(`Initial render time: ${initialTime.toFixed(2)}ms`);

    // Test incremental loading performance
    const loadStart = performance.now();
    loadMoreButton.click();

    await canvas.findByText("Showing 40 of 100");
    const loadTime = performance.now() - loadStart;

    console.log(`Load more time: ${loadTime.toFixed(2)}ms`);

    expect(initialTime).toBeLessThan(200);
    expect(loadTime).toBeLessThan(100);
  },
};

// Add React import for the stories that use hooks
const React = require("react");
