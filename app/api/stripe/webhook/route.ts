import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { stripe, StripeIdentityService } from "@/app/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No Stripe signature found" },
        { status: 400 },
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");

      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      // Webhook signature verification failed

      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "identity.verification_session.verified":
      case "identity.verification_session.requires_input":
      case "identity.verification_session.canceled":
        await handleVerificationSessionEvent(event);
        break;
      default:
      // Unhandled event type
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // Webhook error

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleVerificationSessionEvent(event: Stripe.Event) {
  try {
    const result = await StripeIdentityService.processWebhookEvent(event);

    if (!result) {
      console.log("No processing needed for this event");

      return;
    }

    const { userId, status, verificationData } = result;

    // Determine completion status
    const isVerificationCompleted = status === "verified";
    // Map Stripe status to our enum values
    const verificationStatus:
      | "not_started"
      | "pending"
      | "requires_input"
      | "processing"
      | "verified"
      | "failed" =
      status === "verified"
        ? "verified"
        : status === "requires_input"
          ? "requires_input"
          : status === "canceled"
            ? "failed"
            : status === "processing"
              ? "processing"
              : "pending";

    // First, get the user's current onboarding status
    const user = await db
      .select({
        personal_info_completed: users.personal_info_completed,
        signature_completed: users.signature_completed,
        legal_consent_completed: users.legal_consent_completed,
        verification_completed: users.verification_completed,
        onboarding_status: users.onboarding_status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      console.error(`User ${userId} not found during webhook processing`);

      return;
    }

    const userData = user[0];

    // Check if ALL onboarding steps are complete (including verification)
    const isOnboardingComplete = !!(
      userData.personal_info_completed &&
      userData.signature_completed &&
      userData.legal_consent_completed &&
      isVerificationCompleted
    );

    console.log("Webhook: Onboarding completion check", {
      userId,
      personal_info: userData.personal_info_completed,
      signature: userData.signature_completed,
      legal_consent: userData.legal_consent_completed,
      verification: isVerificationCompleted,
      isOnboardingComplete,
      currentStatus: userData.onboarding_status,
    });

    // Update user verification status and potentially onboarding status
    const updateData: any = {
      verification_status: verificationStatus,
      verification_completed: isVerificationCompleted,
      verification_completed_at: isVerificationCompleted ? new Date() : null,
      updated_at: new Date(),
    };

    // Only mark onboarding as complete if ALL steps are done
    if (isOnboardingComplete) {
      updateData.onboarding_status = "completed";
      updateData.onboarding_current_step = "completed";
      updateData.onboarding_completed_at = new Date();
      console.log(`Marking onboarding as complete for user ${userId}`);
    } else {
      // Keep current step as verification if not all steps are complete
      updateData.onboarding_current_step = "verification";
      updateData.onboarding_status = "in_progress";
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));

    console.log(
      `Updated user ${userId} verification status to ${verificationStatus}`,
      {
        isVerificationCompleted,
        isOnboardingComplete,
      },
    );
  } catch (error) {
    console.error("Error handling verification session event:", error);
    throw error;
  }
}

export const dynamic = "force-dynamic";
