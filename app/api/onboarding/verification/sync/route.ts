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

    // Get user's current verification data
    const user = await db
      .select({
        verification_session_id: users.verification_session_id,
        verification_status: users.verification_status,
        verification_completed: users.verification_completed,
        personal_info_completed: users.personal_info_completed,
        signature_completed: users.signature_completed,
        legal_consent_completed: users.legal_consent_completed,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = user[0];
    let stripeStatus = null;
    let shouldUpdate = false;
    let updateData: any = {};

    // Check Stripe verification status if session exists
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

        // Check if Stripe shows verified but our DB doesn't
        if (
          stripeSession.status === "verified" &&
          !userData.verification_completed
        ) {
          console.log(
            "Syncing verification status: Stripe verified but DB incomplete",
          );
          shouldUpdate = true;

          // Check if all onboarding steps are complete
          const isOnboardingComplete = !!(
            userData.personal_info_completed &&
            userData.signature_completed &&
            userData.legal_consent_completed
          );

          updateData = {
            verification_status: "verified",
            verification_completed: true,
            verification_completed_at: new Date(),
            onboarding_current_step: isOnboardingComplete
              ? "completed"
              : "verification",
            onboarding_status: isOnboardingComplete
              ? "completed"
              : "in_progress",
            onboarding_completed_at: isOnboardingComplete ? new Date() : null,
            updated_at: new Date(),
          };
        }
      } catch (error) {
        console.error("Error fetching Stripe verification session:", error);

        return NextResponse.json(
          { error: "Failed to sync with Stripe" },
          { status: 500 },
        );
      }
    }

    // Update database if needed
    if (shouldUpdate) {
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, session.user.id));

      return NextResponse.json({
        success: true,
        synced: true,
        message: "Verification status synced successfully",
        verification: {
          sessionId: userData.verification_session_id,
          status: "verified",
          completed: true,
          completedAt: updateData.verification_completed_at,
          stripeStatus,
        },
      });
    }

    // No sync needed
    return NextResponse.json({
      success: true,
      synced: false,
      message: "Verification status already in sync",
      verification: {
        sessionId: userData.verification_session_id,
        status: userData.verification_status,
        completed: userData.verification_completed,
        stripeStatus,
      },
    });
  } catch (error) {
    console.error("Verification sync error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
