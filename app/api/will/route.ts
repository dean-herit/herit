import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

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
      .where(eq(wills.user_id, user.id))
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { title, willType, content } = body;

    // Get user ID from email
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create a new will
    const [newWill] = await db
      .insert(wills)
      .values({
        user_id: user.id,
        title: title || "My Will",
        status: "draft",
        will_type: willType || "simple",
        content: content,
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning({
        id: wills.id,
        title: wills.title,
        status: wills.status,
        version: wills.version,
        created_at: wills.created_at,
      });

    return NextResponse.json({
      success: true,
      data: { will: newWill },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
