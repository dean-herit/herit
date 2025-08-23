"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";

export function HomePageClient() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session");

        if (response.ok) {
          const data = await response.json();

          if (data.user) {
            // User is authenticated, redirect to dashboard
            router.push("/dashboard");
          } else {
            // Not authenticated, redirect to login
            router.push("/login");
          }
        } else {
          // Session check failed, redirect to login
          router.push("/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  // Show loading while checking auth
  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center"
      data-component-category="layout"
      data-component-id="home-page-client"
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
