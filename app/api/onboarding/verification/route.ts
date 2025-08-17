import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";

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
    const { verificationMethod, verificationData } = data;

    // Basic validation
    if (!verificationMethod) {
      return NextResponse.json(
        { error: "Verification method required" },
        { status: 400 },
      );
    }

    let verificationSessionId = null;
    let verificationStatus = "pending";

    // Handle different verification methods
    if (verificationMethod === "stripe_identity") {
      // For Stripe Identity, we would create a verification session
      // For now, we'll simulate this
      verificationSessionId = `sim_${crypto.randomUUID()}`;
      verificationStatus = "requires_input";
    } else if (verificationMethod === "manual") {
      // For manual verification, mark as pending review
      verificationStatus = "pending_review";
    }

    // Update user's verification information
    await db
      .update(users)
      .set({
        verificationSessionId,
        verificationStatus,
        verificationCompleted: verificationMethod === "skip", // Only mark complete if skipped for now
        verificationCompletedAt:
          verificationMethod === "skip" ? new Date() : null,
        onboardingCurrentStep:
          verificationMethod === "skip" ? "completed" : "verification",
        onboardingStatus:
          verificationMethod === "skip" ? "completed" : "in_progress",
        onboardingCompletedAt:
          verificationMethod === "skip" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      verificationSessionId,
      verificationStatus,
      message:
        verificationMethod === "skip"
          ? "Verification skipped, onboarding completed"
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
