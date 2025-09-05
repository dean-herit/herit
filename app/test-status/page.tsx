import { TestStatusDashboard } from "@/components/TestStatusDashboard";

export default function TestStatusPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <TestStatusDashboard initialResults={null} resetOnMount={true} />
    </div>
  );
}
