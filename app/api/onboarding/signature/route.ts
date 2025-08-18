import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users, signatures } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get user's most recent signature
    const userSignatures = await db
      .select()
      .from(signatures)
      .where(eq(signatures.user_id, session.user.id))
      .orderBy(signatures.created_at)
      .limit(1);

    if (userSignatures.length === 0) {
      return NextResponse.json({
        success: true,
        signature: null,
      });
    }

    const signature = userSignatures[0];

    return NextResponse.json({
      success: true,
      signature: {
        id: signature.id,
        name: signature.name,
        type: signature.signature_type,
        data: signature.data,
        // Ensure font information is always provided for template signatures
        font:
          signature.font_name ||
          (signature.signature_type === "template" ? "cursive" : null),
        className:
          signature.font_class_name ||
          (signature.signature_type === "template" ? "font-cursive" : null),
        createdAt: signature.created_at?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Signature fetch error:", error);

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
    const { name, signatureType, signatureData, font, className } = data;

    // Basic validation
    if (!name || !signatureType || !signatureData) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 },
      );
    }

    // Ensure template signatures have font information for immutability
    if (signatureType === "template" && (!font || !className)) {
      return NextResponse.json(
        { error: "Template signatures require font information" },
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
    const [savedSignature] = await db
      .insert(signatures)
      .values({
        user_id: session.user.id,
        name,
        signature_type: signatureType,
        data: signatureData,
        hash,
        font_name: font || null,
        font_class_name: className || null,
        signature_metadata: {
          createdAt: new Date().toISOString(),
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      })
      .returning();

    // Update user's onboarding progress
    await db
      .update(users)
      .set({
        signature_completed: true,
        signature_completed_at: new Date(),
        onboarding_current_step: "legal_consent",
        updated_at: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Signature saved successfully",
      signature: {
        id: savedSignature.id,
        name: savedSignature.name,
        type: savedSignature.signature_type,
        data: savedSignature.data,
        font: savedSignature.font_name,
        className: savedSignature.font_class_name,
        createdAt: savedSignature.created_at?.toISOString(),
      },
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
