"use client";

import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div
      className="space-y-6"
      data-component-category="layout"
      data-component-id="dashboard-layout"
    >
      {/* The children now include welcome message outside card and content inside card */}
      {children}
    </div>
  );
}
