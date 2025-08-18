import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users, signatureUsage } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  console.log("=== CONSENT SIGNATURE API HIT ===");
  try {
    const session = await getSession();

    console.log("Session check:", {
      isAuthenticated: session.isAuthenticated,
      userId: session.isAuthenticated ? session.user.id : null,
    });

    if (!session.isAuthenticated) {
      console.log("Authentication failed - no valid session");

      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const data = await request.json();
    const { consentId, signatureId, signatureData } = data;

    // Basic validation
    if (!consentId || !signatureId) {
      return NextResponse.json(
        { error: "Consent ID and signature ID are required" },
        { status: 400 },
      );
    }

    // Record the signature usage for this specific consent
    await db.insert(signatureUsage).values({
      signature_id: signatureId,
      user_id: session.user.id,
      document_type: "legal_consent",
      document_id: consentId,
      usage_metadata: {
        consentType: consentId,
        timestamp: new Date().toISOString(),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Get current user's legal consents
    const user = await db
      .select({ legal_consents: users.legal_consents })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const currentConsents = user[0]?.legal_consents || {};

    // Update the specific consent with signature info including full signature snapshot
    const updatedConsents = {
      ...currentConsents,
      [consentId]: {
        agreed: true,
        signatureId,
        // Store complete signature snapshot for immutability
        signatureSnapshot: signatureData || null,
        timestamp: new Date().toISOString(),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    };

    // Update user's legal consent information
    await db
      .update(users)
      .set({
        legal_consents: updatedConsents,
        updated_at: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Consent signature saved successfully",
      consentId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Consent signature save error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
