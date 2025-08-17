"use client";

import { ReactNode } from "react";
import { Card, CardBody } from "@heroui/react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="py-8">
      <Card className="w-full">
        <CardBody className="p-8">{children}</CardBody>
      </Card>
    </div>
  );
}
