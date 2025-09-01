import { NextRequest, NextResponse } from "next/server";

import { clearAuthCookies } from "@/app/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Clear authentication cookies
    await clearAuthCookies();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
