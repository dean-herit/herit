import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users } from "@/db/schema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter required" },
        { status: 400 },
      );
    }

    // Get user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "User not found",
        email,
      });
    }

    // Return safe user data (excluding sensitive fields)
    const safeUserData = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      date_of_birth: user.date_of_birth,
      address_line_1: user.address_line_1,
      address_line_2: user.address_line_2,
      city: user.city,
      county: user.county,
      eircode: user.eircode,
      onboarding_status: user.onboarding_status,
      onboarding_current_step: user.onboarding_current_step,
      personal_info_completed: user.personal_info_completed,
      personal_info_completed_at: user.personal_info_completed_at,
      signature_completed: user.signature_completed,
      signature_completed_at: user.signature_completed_at,
      legal_consent_completed: user.legal_consent_completed,
      legal_consent_completed_at: user.legal_consent_completed_at,
      verification_completed: user.verification_completed,
      verification_completed_at: user.verification_completed_at,
      auth_provider: user.auth_provider,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return NextResponse.json({
      success: true,
      user: safeUserData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug user query failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Database query failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
