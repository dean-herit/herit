import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { verifyPassword, setAuthCookies } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit";

async function loginHandler(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Set authentication cookies
    await setAuthCookies(user.id, user.email);

    // Determine onboarding completion
    const onboarding_completed = !!(
      user.personalInfoCompleted &&
      user.signatureCompleted &&
      user.legalConsentCompleted &&
      user.verificationCompleted &&
      user.onboardingCompletedAt
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        onboardingStatus: user.onboardingStatus,
        onboardingCurrentStep: user.onboardingCurrentStep,
        onboarding_completed,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Apply rate limiting: 5 attempts per minute per IP
export const POST = withRateLimit(loginHandler, {
  interval: 60000, // 1 minute
  limit: 5, // 5 attempts
});

export const dynamic = "force-dynamic";
