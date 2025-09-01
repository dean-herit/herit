import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { getSession } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get user's legal consent data
    const user = await db
      .select({
        legal_consents: users.legal_consents,
        legal_consent_completed: users.legal_consent_completed,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const userData = user[0];
    const legalConsents = userData?.legal_consents || {};

    return NextResponse.json({
      success: true,
      consents: legalConsents,
      isCompleted: userData?.legal_consent_completed || false,
    });
  } catch (error) {
    console.error("Legal consent fetch error:", error);

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
    const { consents } = data;

    // Basic validation
    if (!consents || typeof consents !== "object") {
      return NextResponse.json(
        { error: "Consents data required" },
        { status: 400 },
      );
    }

    // Check required consents (these should match the LegalConsentStep component)
    const requiredConsents = [
      "terms_of_service",
      "privacy_policy",
      "legal_disclaimer",
      "data_processing",
      "electronic_signature",
    ];
    const missingConsents = requiredConsents.filter(
      (consent) => !consents[consent],
    );

    if (missingConsents.length > 0) {
      return NextResponse.json(
        { error: `Required consents missing: ${missingConsents.join(", ")}` },
        { status: 400 },
      );
    }

    // Update user's legal consent information
    await db
      .update(users)
      .set({
        legal_consents: {
          ...consents,
          timestamp: new Date().toISOString(),
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
        legal_consent_completed: true,
        legal_consent_completed_at: new Date(),
        onboarding_current_step: "verification",
        updated_at: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Legal consent saved successfully",
    });
  } catch (error) {
    console.error("Legal consent save error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
