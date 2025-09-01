"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";

import { useAuth } from "@/app/hooks/useAuth";
import { AuthErrorHandler } from "@/app/components/auth/AuthErrorHandler";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({
  children,
  requireOnboarding = false,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isSessionLoading, authError, refetchSession } =
    useAuth();
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("ProtectedRoute effect:", {
      isSessionLoading,
      isAuthenticated,
      requireOnboarding,
      userId: user?.id,
      onboardingCompleted: user?.onboarding_completed,
    });

    // Clear any pending redirects
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    if (!isSessionLoading) {
      if (!isAuthenticated) {
        console.log("ProtectedRoute: Not authenticated, redirecting to login");
        redirectTimeoutRef.current = setTimeout(() => {
          router.push("/login");
        }, 100); // Small delay to prevent rapid redirects

        return;
      }

      if (requireOnboarding && user && !user.onboarding_completed) {
        console.log(
          "ProtectedRoute: Onboarding required but not completed, redirecting to onboarding",
        );
        redirectTimeoutRef.current = setTimeout(() => {
          router.push("/onboarding");
        }, 100); // Small delay to prevent rapid redirects

        return;
      }
    }

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, isSessionLoading, user, requireOnboarding, router]);

  // Show authentication error handler if there are JWT issues
  if (authError) {
    return <AuthErrorHandler error={authError} onRetry={refetchSession} />;
  }

  if (isSessionLoading || (!isAuthenticated && typeof window !== "undefined")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner color="primary" size="lg" />
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
