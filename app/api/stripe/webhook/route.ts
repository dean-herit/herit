import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { stripe, StripeIdentityService } from "@/lib/stripe";

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
      console.error("Webhook signature verification failed:", error);

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
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);

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
    const isCompleted = status === "verified";
    const verificationStatus =
      status === "verified"
        ? "verified"
        : status === "requires_input"
          ? "requires_input"
          : status === "canceled"
            ? "canceled"
            : status;

    // Update user verification status in database
    await db
      .update(users)
      .set({
        verification_status: verificationStatus,
        verification_completed: isCompleted,
        verification_completed_at: isCompleted ? new Date() : null,
        onboarding_current_step: isCompleted ? "completed" : "verification",
        onboarding_status: isCompleted ? "completed" : "in_progress",
        onboarding_completed_at: isCompleted ? new Date() : null,
        updated_at: new Date(),
      })
      .where(eq(users.id, userId));

    console.log(
      `Updated verification status for user ${userId}: ${verificationStatus}`,
    );
  } catch (error) {
    console.error("Error handling verification session event:", error);
    throw error;
  }
}

export const dynamic = "force-dynamic";
