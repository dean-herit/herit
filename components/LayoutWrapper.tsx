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

  // Check if we're on the login or signup page
  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/signup");

  if (isAuthPage) {
    // For auth pages, render children directly without container, navbar, or footer
    return <>{children}</>;
  }

  // For all other pages, render with navbar, container, and footer
  return (
    <div className="relative flex flex-col h-screen">
      <Suspense fallback={<NavbarSkeleton />}>
        <Navbar />
      </Suspense>
      <main className="container mx-auto max-w-7xl pt-4 px-6 flex-grow">
        {children}
      </main>
      <footer className="w-full border-t border-default-200 bg-content1 py-8">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <span className="text-default-600 text-sm">© 2024 Herit</span>
              <div className="flex items-center gap-4">
                <Link
                  href="/privacy"
                  className="text-default-500 hover:text-default-600 text-sm"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="text-default-500 hover:text-default-600 text-sm"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/contact"
                  className="text-default-500 hover:text-default-600 text-sm"
                >
                  Contact
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-default-600">
              <span>Need help?</span>
              <Link
                href="mailto:support@herit.ie"
                className="text-primary hover:text-primary-600"
              >
                support@herit.ie
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
