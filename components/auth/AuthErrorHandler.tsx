"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Button } from "@heroui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface AuthErrorHandlerProps {
  error:
    | "token_invalid"
    | "token_expired"
    | "token_missing"
    | "user_not_found"
    | null;
  onRetry?: () => void;
}

export function AuthErrorHandler({ error, onRetry }: AuthErrorHandlerProps) {
  const router = useRouter();

  const handleForceLogout = async () => {
    try {
      // Clear authentication cookies
      await fetch("/api/auth/logout", { method: "POST" });

      // Clear any cached data
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Redirect to login with error context
      router.push(`/login?error=auth_${error}`);
    } catch (err) {
      console.error("Force logout failed:", err);
      // Hard redirect as fallback
      window.location.href = "/login?error=force_logout";
    }
  };

  // Auto-logout on critical errors
  useEffect(() => {
    if (error === "token_invalid" || error === "user_not_found") {
      console.warn(
        `Critical authentication error: ${error}. Auto-logout initiated.`,
      );
      handleForceLogout();
    }
  }, [error]);

  if (!error) return null;

  const errorMessages = {
    token_invalid: {
      title: "Authentication Error",
      description:
        "Your session token is corrupted or invalid. Please log in again.",
      action: "Login Again",
      severity: "critical" as const,
    },
    token_expired: {
      title: "Session Expired",
      description: "Your session has expired. Please log in to continue.",
      action: "Login Again",
      severity: "warning" as const,
    },
    token_missing: {
      title: "Not Logged In",
      description: "You need to log in to access this page.",
      action: "Login",
      severity: "info" as const,
    },
    user_not_found: {
      title: "Account Error",
      description:
        "Your account could not be found. Please contact support or try logging in again.",
      action: "Login Again",
      severity: "critical" as const,
    },
  };

  const errorInfo = errorMessages[error];

  // For critical errors, show full-screen overlay
  if (errorInfo.severity === "critical") {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardBody className="text-center p-6 space-y-4">
            <div className="flex justify-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-danger" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {errorInfo.title}
              </h2>
              <p className="text-default-600 text-sm">
                {errorInfo.description}
              </p>
            </div>
            <div className="space-y-2">
              <Button
                className="w-full"
                color="primary"
                data-testid="Button-qz719cz74"
                onPress={handleForceLogout}
              >
                {errorInfo.action}
              </Button>
              {onRetry && (
                <Button
                  className="w-full"
                  data-testid="Button-cuxwy4ncs"
                  variant="ghost"
                  onPress={onRetry}
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // For non-critical errors, show inline message
  return (
    <Card className="border-warning-200 bg-warning-50">
      <CardBody className="p-4">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-warning-800 mb-1">
              {errorInfo.title}
            </h3>
            <p className="text-sm text-warning-700 mb-3">
              {errorInfo.description}
            </p>
            <div className="flex gap-2">
              <Button
                color="warning"
                data-testid="Button-n77famagb"
                size="sm"
                variant="solid"
                onPress={() => router.push("/login")}
              >
                {errorInfo.action}
              </Button>
              {onRetry && (
                <Button
                  data-testid="Button-k6q3yndwl"
                  size="sm"
                  variant="ghost"
                  onPress={onRetry}
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
