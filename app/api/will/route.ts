import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { wills } from "@/db/schema";
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

    // Check if user has any wills
    const userWills = await db
      .select({
        id: wills.id,
        title: wills.title,
        status: wills.status,
        version: wills.version,
        created_at: wills.created_at,
        finalized_at: wills.finalized_at,
      })
      .from(wills)
      .where(eq(wills.user_email, session.user.email))
      .orderBy(wills.created_at);

    if (userWills.length === 0) {
      return NextResponse.json({ error: "No will found" }, { status: 404 });
    }

    // Return the most recent will
    const mostRecentWill = userWills[userWills.length - 1];

    return NextResponse.json({
      success: true,
      data: {
        will: mostRecentWill,
        totalWills: userWills.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
