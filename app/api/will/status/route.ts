import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";

import { db } from "@/db/db";
import { wills, users } from "@/db/schema";
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

    // Get the most recent will for the current user
    const userWills = await db
      .select()
      .from(wills)
      .where(eq(wills.user_id, user.id))
      .orderBy(desc(wills.updated_at))
      .limit(1);

    if (userWills.length === 0) {
      return NextResponse.json({
        hasWill: false,
        status: null,
        will: null,
      });
    }

    const latestWill = userWills[0];

    return NextResponse.json({
      hasWill: true,
      status: latestWill.status || "draft",
      will: {
        id: latestWill.id,
        title: latestWill.title,
        status: latestWill.status,
        will_type: latestWill.will_type,
        legal_review_status: latestWill.legal_review_status,
        created_at: latestWill.created_at,
        updated_at: latestWill.updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch will status" },
      { status: 500 },
    );
  }
}
