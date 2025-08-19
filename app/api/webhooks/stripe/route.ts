import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { stripe } from "@/lib/stripe";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("No Stripe signature found in headers");

      return NextResponse.json(
        { error: "No signature found" },
        { status: 400 },
      );
    }

    if (!endpointSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");

      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (error) {
      console.error("Stripe webhook signature verification failed:", error);

      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`Received Stripe webhook: ${event.type}`, {
      eventId: event.id,
      created: new Date(event.created * 1000).toISOString(),
    });

    // Handle identity verification events
    if (
      event.type === "identity.verification_session.verified" ||
      event.type === "identity.verification_session.requires_input" ||
      event.type === "identity.verification_session.canceled"
    ) {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const userId = session.metadata?.user_id;

      if (!userId) {
        console.error("No user_id found in verification session metadata", {
          sessionId: session.id,
          metadata: session.metadata,
        });

        return NextResponse.json(
          { error: "No user ID in metadata" },
          { status: 400 },
        );
      }

      console.log(`Processing identity verification for user ${userId}`, {
        sessionId: session.id,
        status: session.status,
        eventType: event.type,
      });

      // Determine verification status based on event type
      let verificationStatus: string;
      let isCompleted: boolean;

      switch (event.type) {
        case "identity.verification_session.verified":
          verificationStatus = "verified";
          isCompleted = true;
          break;
        case "identity.verification_session.requires_input":
          verificationStatus = "requires_input";
          isCompleted = false;
          break;
        case "identity.verification_session.canceled":
          verificationStatus = "canceled";
          isCompleted = false;
          break;
        default:
          verificationStatus = session.status;
          isCompleted = session.status === "verified";
      }

      // Check if all onboarding steps are completed
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
        console.error(`User ${userId} not found in database`);

        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const userData = user[0];
      const isOnboardingComplete =
        userData.personal_info_completed &&
        userData.signature_completed &&
        userData.legal_consent_completed &&
        isCompleted;

      console.log("Onboarding completion check", {
        userId,
        personal_info_completed: userData.personal_info_completed,
        signature_completed: userData.signature_completed,
        legal_consent_completed: userData.legal_consent_completed,
        verification_completed: isCompleted,
        isOnboardingComplete,
        currentStatus: userData.onboarding_status,
      });

      // Update user's verification status
      const updateData: any = {
        verification_status: verificationStatus,
        verification_completed: isCompleted,
        verification_completed_at: isCompleted ? new Date() : null,
        updated_at: new Date(),
      };

      // Update onboarding status if all steps are complete
      if (isOnboardingComplete && userData.onboarding_status !== "completed") {
        updateData.onboarding_status = "completed";
        updateData.onboarding_current_step = "completed";
        updateData.onboarding_completed_at = new Date();

        console.log(`Marking onboarding as completed for user ${userId}`);
      }

      await db.update(users).set(updateData).where(eq(users.id, userId));

      console.log(
        `Updated user ${userId} verification status to ${verificationStatus}`,
        {
          isCompleted,
          isOnboardingComplete,
          sessionId: session.id,
        },
      );

      return NextResponse.json({
        success: true,
        processed: true,
        userId,
        verificationStatus,
        isCompleted,
        isOnboardingComplete,
      });
    }

    // Handle other webhook events if needed
    console.log(`Unhandled webhook event type: ${event.type}`);

    return NextResponse.json({
      success: true,
      processed: false,
      message: "Event type not handled",
    });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
