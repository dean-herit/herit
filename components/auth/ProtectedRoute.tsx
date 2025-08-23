"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";

import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({
  children,
  requireOnboarding = false,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isSessionLoading } = useAuth();

  useEffect(() => {
    if (!isSessionLoading) {
      if (!isAuthenticated) {
        router.push("/login");

        return;
      }

      if (requireOnboarding && user && !user.onboarding_completed) {
        router.push("/onboarding");

        return;
      }
    }
  }, [isAuthenticated, isSessionLoading, user, requireOnboarding, router]);

  if (isSessionLoading || (!isAuthenticated && typeof window !== "undefined")) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-component-category="layout"
        data-component-id="protected-route"
      >
        <div className="flex flex-col items-center gap-4">
          <Spinner
            color="primary"
            data-component-category="ui"
            data-component-id="spinner"
            size="lg"
          />
          <p className="text-default-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireOnboarding && user && !user.onboarding_completed) {
    return null;
  }

  return <>{children}</>;
}
