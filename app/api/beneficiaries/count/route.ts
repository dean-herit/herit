import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { beneficiaries } from "@/db/schema";
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

    // Count beneficiaries for the current user
    const result = await db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.user_email, session.user.email));

    return NextResponse.json({
      count: result.length,
      beneficiaries: result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch beneficiary count" },
      { status: 500 },
    );
  }
}
