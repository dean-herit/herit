import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      user: session.user,
      onboardingStatus: session.user.onboarding_status,
      currentStep: session.user.onboarding_current_step,
      isComplete: session.user.onboarding_completed,
    });
  } catch (error) {
    console.error("Onboarding status error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
