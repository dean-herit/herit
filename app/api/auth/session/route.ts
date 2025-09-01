import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        {
          user: null,
          error: session.error || null,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        user: session.user,
        error: null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Session check error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
