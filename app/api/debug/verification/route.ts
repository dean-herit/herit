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

    // Get comprehensive user verification data
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        // Personal info
        first_name: users.first_name,
        last_name: users.last_name,
        // Onboarding status
        onboarding_status: users.onboarding_status,
        onboarding_current_step: users.onboarding_current_step,
        onboarding_completed_at: users.onboarding_completed_at,
        // Step completions
        personal_info_completed: users.personal_info_completed,
        personal_info_completed_at: users.personal_info_completed_at,
        signature_completed: users.signature_completed,
        signature_completed_at: users.signature_completed_at,
        legal_consent_completed: users.legal_consent_completed,
        legal_consent_completed_at: users.legal_consent_completed_at,
        // Verification
        verification_completed: users.verification_completed,
        verification_completed_at: users.verification_completed_at,
        verification_session_id: users.verification_session_id,
        verification_status: users.verification_status,
        // Timestamps
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = user[0];

    // Get Stripe session details if available
    let stripeDetails = null;

    if (
      userData.verification_session_id &&
      userData.verification_session_id.startsWith("vs_")
    ) {
      try {
        const stripeSession =
          await StripeIdentityService.getVerificationSession(
            userData.verification_session_id,
          );

        stripeDetails = {
          id: stripeSession.id,
          object: stripeSession.object,
          created: new Date(stripeSession.created * 1000).toISOString(),
          status: stripeSession.status,
          type: stripeSession.type,
          url: stripeSession.url,
          client_secret: stripeSession.client_secret ? "***REDACTED***" : null,
          last_error: stripeSession.last_error,
          metadata: stripeSession.metadata,
          options: stripeSession.options,
          redaction: stripeSession.redaction,
          verified_outputs: stripeSession.verified_outputs,
        };
      } catch (error) {
        stripeDetails = {
          error: "Failed to fetch Stripe session",
          message: error instanceof Error ? error.message : "Unknown error",
          sessionId: userData.verification_session_id,
        };
      }
    }

    // Environment info
    const environmentInfo = {
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL || "Not set",
      vercelUrl: process.env.VERCEL_URL || "Not set",
      stripeKeyExists: !!process.env.STRIPE_SECRET_KEY,
      webhookSecretExists: !!process.env.STRIPE_WEBHOOK_SECRET,
      timestamp: new Date().toISOString(),
    };

    // Calculate completion status
    const completionAnalysis = {
      personalInfoComplete: userData.personal_info_completed,
      signatureComplete: userData.signature_completed,
      legalConsentComplete: userData.legal_consent_completed,
      verificationComplete: userData.verification_completed,
      allStepsComplete:
        userData.personal_info_completed &&
        userData.signature_completed &&
        userData.legal_consent_completed &&
        userData.verification_completed,
      onboardingStatus: userData.onboarding_status,
      currentStep: userData.onboarding_current_step,
      shouldBeComplete:
        userData.personal_info_completed &&
        userData.signature_completed &&
        userData.legal_consent_completed &&
        userData.verification_completed,
      statusMismatch:
        userData.personal_info_completed &&
        userData.signature_completed &&
        userData.legal_consent_completed &&
        userData.verification_completed &&
        userData.onboarding_status !== "completed",
    };

    return NextResponse.json({
      success: true,
      user: userData,
      stripeDetails,
      environmentInfo,
      completionAnalysis,
      debugInfo: {
        userAgent: request.headers.get("user-agent"),
        timestamp: new Date().toISOString(),
        sessionInfo: {
          isAuthenticated: session.isAuthenticated,
          userId: session.user?.id,
          userEmail: session.user?.email,
        },
      },
    });
  } catch (error) {
    console.error("Debug verification endpoint error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
