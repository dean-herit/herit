"use client";

import { usePathname } from "next/navigation";
import { lazy, Suspense } from "react";
import { Link } from "@heroui/link";

// Lazy load navbar for better performance
const Navbar = lazy(() =>
  import("@/components/navbar").then((mod) => ({ default: mod.Navbar })),
);

// Loading component for navbar
function NavbarSkeleton() {
  return (
    <div className="h-16 bg-content1 border-b border-default-200 animate-pulse" />
  );
}

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if we're on the login page only
  const isLoginPage = pathname?.startsWith("/login");

  if (isLoginPage) {
    // For login page, render children directly without container, navbar, or footer
    return <>{children}</>;
  }

  // For all other pages, render with navbar, container, and footer
  return (
    <div className="relative flex flex-col h-screen">
      <Suspense fallback={<NavbarSkeleton />}>
        <Navbar />
      </Suspense>
      <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
        {children}
      </main>
      <footer className="w-full flex items-center justify-center py-3">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://heroui.com?utm_source=next-app-template"
          title="heroui.com homepage"
        >
          <span className="text-default-600">Powered by</span>
          <p className="text-primary">HeroUI</p>
        </Link>
      </footer>
    </div>
  );
}
