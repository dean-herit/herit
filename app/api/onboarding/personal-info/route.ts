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
