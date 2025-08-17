import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users, signatures } from "@/db/schema";
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
    const { name, signatureType, signatureData, font, className } = data;

    // Basic validation
    if (!name || !signatureType || !signatureData) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 },
      );
    }

    // Create a simple hash of the signature data
    const signatureHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(signatureData),
    );
    const hash = Array.from(new Uint8Array(signatureHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Save signature to database
    await db.insert(signatures).values({
      userId: session.user.id,
      name,
      signatureType,
      data: signatureData,
      hash,
      fontName: font || null,
      fontClassName: className || null,
      signatureMetadata: {
        createdAt: new Date().toISOString(),
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Update user's onboarding progress
    await db
      .update(users)
      .set({
        signatureCompleted: true,
        signatureCompletedAt: new Date(),
        onboardingCurrentStep: "legal_consent",
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Signature saved successfully",
    });
  } catch (error) {
    console.error("Signature save error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
