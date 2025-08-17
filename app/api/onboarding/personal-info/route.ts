import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users } from "@/db/schema";
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

    // Get user's personal information and completion status
    const user = await db
      .select({
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
        phone_number: users.phone_number,
        date_of_birth: users.date_of_birth,
        address_line_1: users.address_line_1,
        address_line_2: users.address_line_2,
        city: users.city,
        county: users.county,
        eircode: users.eircode,
        personal_info_completed: users.personal_info_completed,
        signature_completed: users.signature_completed,
        legal_consent_completed: users.legal_consent_completed,
        verification_completed: users.verification_completed,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = user[0];

    return NextResponse.json({
      success: true,
      personalInfo: {
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        phone_number: userData.phone_number || "",
        date_of_birth: userData.date_of_birth || "",
        address_line_1: userData.address_line_1 || "",
        address_line_2: userData.address_line_2 || "",
        city: userData.city || "",
        county: userData.county || "",
        eircode: userData.eircode || "",
      },
      completionStatus: {
        personal_info_completed: userData.personal_info_completed || false,
        signature_completed: userData.signature_completed || false,
        legal_consent_completed: userData.legal_consent_completed || false,
        verification_completed: userData.verification_completed || false,
      },
    });
  } catch (error) {
    console.error("Personal info fetch error:", error);

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
    const {
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      addressLine1,
      addressLine2,
      city,
      county,
      eircode,
    } = data;

    // Basic validation
    if (!firstName || !lastName || !phoneNumber || !dateOfBirth) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 },
      );
    }

    // Update user's personal information
    await db
      .update(users)
      .set({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        date_of_birth: dateOfBirth,
        address_line_1: addressLine1 || null,
        address_line_2: addressLine2 || null,
        city: city || null,
        county: county || null,
        eircode: eircode || null,
        personal_info_completed: true,
        personal_info_completed_at: new Date(),
        onboarding_current_step: "signature",
        updated_at: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Personal information saved successfully",
    });
  } catch (error) {
    console.error("Personal info save error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
