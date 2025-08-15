'use client';

import { ReactNode } from 'react';
import { Card, CardBody } from '@heroui/react';
import { Navbar } from '@/components/navbar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-6 py-8">
        <Card className="w-full">
          <CardBody className="p-8">
            {children}
          </CardBody>
        </Card>
      </main>
    </div>
  );
}