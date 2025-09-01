import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { getSession } from "@/app/lib/auth";
import { StripeIdentityService } from "@/app/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get user's verification status
    const user = await db
      .select({
        verification_session_id: users.verification_session_id,
        verification_status: users.verification_status,
        verification_completed: users.verification_completed,
        verification_completed_at: users.verification_completed_at,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = user[0];

    // If there's a Stripe session, check its current status
    let stripeStatus = null;

    if (
      userData.verification_session_id &&
      userData.verification_session_id.startsWith("vs_")
    ) {
      try {
        const stripeSession =
          await StripeIdentityService.getVerificationSession(
            userData.verification_session_id,
          );

        stripeStatus = {
          id: stripeSession.id,
          status: stripeSession.status,
          url: stripeSession.url,
          lastError: stripeSession.last_error,
        };
      } catch {
        // Error fetching Stripe verification session
      }
    }

    return NextResponse.json({
      success: true,
      verification: {
        sessionId: userData.verification_session_id,
        status: userData.verification_status,
        completed: userData.verification_completed || false,
        completedAt: userData.verification_completed_at,
        stripeStatus,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Critical validation: Ensure we have a valid user ID
    if (!session.user?.id) {
      console.error("Session missing user ID - this should never happen:", {
        isAuthenticated: session.isAuthenticated,
        hasUser: !!session.user,
        userEmail: session.user?.email,
      });

      return NextResponse.json(
        {
          error: "Invalid session",
          details:
            "User ID not found in session. Please log out and log in again.",
        },
        { status: 401 },
      );
    }

    const data = await request.json();
    const { verificationMethod, returnUrl } = data;

    // Basic validation
    if (!verificationMethod) {
      return NextResponse.json(
        { error: "Verification method required" },
        { status: 400 },
      );
    }

    let verificationSessionId = null;
    let verificationStatus:
      | "not_started"
      | "pending"
      | "requires_input"
      | "processing"
      | "verified"
      | "failed" = "pending";
    let verificationUrl = null;

    // Handle different verification methods
    if (verificationMethod === "stripe_identity") {
      try {
        // Construct production-safe return URL
        const baseUrl =
          process.env.NEXTAUTH_URL || process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000";

        const safeReturnUrl =
          returnUrl || `${baseUrl}/onboarding?step=3&verification=complete`;

        // Create real Stripe Identity verification session
        const stripeSession =
          await StripeIdentityService.createVerificationSession(
            session.user.id,
            safeReturnUrl,
            {
              metadata: {
                user_email: session.user.email,
                user_id: session.user.id, // Ensure user_id is in metadata
                created_via: "onboarding",
              },
            },
          );

        verificationSessionId = stripeSession.id;
        // Map Stripe status to our enum values
        verificationStatus =
          stripeSession.status === "verified"
            ? "verified"
            : stripeSession.status === "requires_input"
              ? "requires_input"
              : stripeSession.status === "processing"
                ? "processing"
                : "pending";
        verificationUrl = stripeSession.url;
      } catch (error) {
        return NextResponse.json(
          {
            error: "Failed to create verification session",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    } else if (verificationMethod === "complete") {
      // Manual completion - mark verification as verified
      verificationStatus = "verified";
      verificationSessionId = `manual_${crypto.randomUUID()}`;
    } else if (verificationMethod === "manual") {
      // For manual verification, mark as requires_input
      verificationStatus = "requires_input";
    }

    // Determine if verification is completed
    const isVerificationCompleted =
      verificationMethod === "skip" || verificationMethod === "complete";

    // Check if all previous steps are completed before marking onboarding as complete
    let isOnboardingComplete = false;

    if (isVerificationCompleted) {
      const user = await db
        .select({
          personal_info_completed: users.personal_info_completed,
          signature_completed: users.signature_completed,
          legal_consent_completed: users.legal_consent_completed,
        })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

      if (user.length > 0) {
        const userData = user[0];

        isOnboardingComplete = !!(
          userData.personal_info_completed &&
          userData.signature_completed &&
          userData.legal_consent_completed &&
          isVerificationCompleted
        );
      }
    }

    // Update user's verification information
    await db
      .update(users)
      .set({
        verification_session_id: verificationSessionId,
        verification_status: verificationStatus,
        verification_completed: isVerificationCompleted,
        verification_completed_at: isVerificationCompleted ? new Date() : null,
        onboarding_current_step: isOnboardingComplete
          ? "completed"
          : "verification",
        onboarding_status: isOnboardingComplete ? "completed" : "in_progress",
        onboarding_completed_at: isOnboardingComplete ? new Date() : null,
        updated_at: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      verificationSessionId,
      verificationStatus,
      verificationUrl,
      message:
        verificationMethod === "skip"
          ? "Verification skipped, onboarding completed"
          : verificationMethod === "stripe_identity"
            ? "Stripe Identity verification session created"
            : "Verification initiated successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
