import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VisualDevModePanel } from "@/components/dev/VisualDevMode";

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requireOnboarding={true}>
      <DashboardLayout>{children}</DashboardLayout>
      <VisualDevModePanel />
    </ProtectedRoute>
  );
}
