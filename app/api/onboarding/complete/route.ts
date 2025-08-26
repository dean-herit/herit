import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { StripeIdentityService } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get current user completion status including verification session ID
    const user = await db
      .select({
        personal_info_completed: users.personal_info_completed,
        signature_completed: users.signature_completed,
        legal_consent_completed: users.legal_consent_completed,
        verification_completed: users.verification_completed,
        verification_session_id: users.verification_session_id,
        verification_status: users.verification_status,
        onboarding_completed_at: users.onboarding_completed_at,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let userData = user[0];

    // First, try to sync with Stripe if there's a verification session and it's not completed
    if (
      userData.verification_session_id &&
      userData.verification_session_id.startsWith("vs_") &&
      !userData.verification_completed
    ) {
      try {
        console.log(
          "Attempting to sync verification status before completion check",
        );
        const stripeSession =
          await StripeIdentityService.getVerificationSession(
            userData.verification_session_id,
          );

        // If Stripe shows verified but our DB doesn't, update it
        if (
          stripeSession.status === "verified" &&
          !userData.verification_completed
        ) {
          console.log("Syncing verification status: Stripe shows verified");

          await db
            .update(users)
            .set({
              verification_status: "verified",
              verification_completed: true,
              verification_completed_at: new Date(),
              updated_at: new Date(),
            })
            .where(eq(users.id, session.user.id));

          // Update our local userData to reflect the change
          userData.verification_completed = true;
          userData.verification_status = "verified";
        }
      } catch (error) {
        console.error("Error syncing with Stripe:", error);
        // Continue anyway - maybe the webhook already processed it
      }
    }

    // Check if all steps are completed
    const allStepsCompleted = !!(
      userData.personal_info_completed &&
      userData.signature_completed &&
      userData.legal_consent_completed &&
      userData.verification_completed
    );

    console.log("Onboarding completion check:", {
      personal_info_completed: userData.personal_info_completed,
      signature_completed: userData.signature_completed,
      legal_consent_completed: userData.legal_consent_completed,
      verification_completed: userData.verification_completed,
      allStepsCompleted,
      alreadyCompleted: !!userData.onboarding_completed_at,
    });

    if (!allStepsCompleted) {
      return NextResponse.json(
        {
          error: "Not all onboarding steps completed",
          completionStatus: {
            personal_info_completed: userData.personal_info_completed,
            signature_completed: userData.signature_completed,
            legal_consent_completed: userData.legal_consent_completed,
            verification_completed: userData.verification_completed,
          },
        },
        { status: 400 },
      );
    }

    // Mark onboarding as completed if not already
    if (!userData.onboarding_completed_at) {
      await db
        .update(users)
        .set({
          onboarding_status: "completed",
          onboarding_current_step: "completed",
          onboarding_completed_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(users.id, session.user.id));

      console.log(`Marked onboarding complete for user ${session.user.id}`);
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
      redirectTo: "/dashboard",
    });
  } catch (error) {
    console.error("Onboarding completion error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
