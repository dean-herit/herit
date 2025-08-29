"use client";

import { DashboardClient } from "./DashboardClient";

// Force dynamic rendering for user-specific data
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <DashboardClient
      data-component-category="ui"
      data-component-id="dashboard-client"
    />
  );
}
