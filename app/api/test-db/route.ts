import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/db/db";

export async function GET() {
  try {
    // Test basic database connectivity
    const result = await db.execute(sql`SELECT 1 as test`);

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      result: result[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database connection test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
