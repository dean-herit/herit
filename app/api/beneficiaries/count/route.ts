import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { beneficiaries, users } from "@/db/schema";
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

    // Get user ID from email
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Count beneficiaries for the current user
    const result = await db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.user_id, user.id));

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
