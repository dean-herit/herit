import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { StripeIdentityService } from "@/lib/stripe";

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
      } catch (error) {
        console.error("Error fetching Stripe verification session:", error);
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
  } catch (error) {
    console.error("Verification fetch error:", error);

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
    let verificationStatus = "pending";
    let verificationUrl = null;

    // Handle different verification methods
    if (verificationMethod === "stripe_identity") {
      try {
        // Create real Stripe Identity verification session
        const stripeSession =
          await StripeIdentityService.createVerificationSession(
            session.user.id,
            returnUrl ||
              `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/onboarding?step=3&verification=complete`,
            {
              metadata: {
                user_email: session.user.email,
                created_via: "onboarding",
              },
            },
          );

        verificationSessionId = stripeSession.id;
        verificationStatus = stripeSession.status;
        verificationUrl = stripeSession.url;
      } catch (error) {
        console.error("Stripe verification session creation failed:", error);

        return NextResponse.json(
          { error: "Failed to create verification session" },
          { status: 500 },
        );
      }
    } else if (verificationMethod === "complete") {
      // Manual completion - mark verification as complete
      verificationStatus = "completed";
      verificationSessionId = `manual_${crypto.randomUUID()}`;
    } else if (verificationMethod === "manual") {
      // For manual verification, mark as pending review
      verificationStatus = "pending_review";
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

        console.log("Completion check:", {
          personal_info_completed: userData.personal_info_completed,
          signature_completed: userData.signature_completed,
          legal_consent_completed: userData.legal_consent_completed,
          isVerificationCompleted,
          isOnboardingComplete,
        });
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
  } catch (error) {
    console.error("Verification save error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
