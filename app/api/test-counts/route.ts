/**
 * API Route for AST-based Test Counting
 * Server-side endpoint to scan test files and return real counts
 */

import { NextResponse } from "next/server";

import { TestCounter } from "@/lib/test-counter";

export const maxDuration = 60; // Allow up to 60 seconds for scanning

/**
 * GET /api/test-counts
 * Returns real test counts from AST scanning
 */
export async function GET() {
  try {
    console.log("🔍 Starting AST-based test scan...");
    const startTime = Date.now();

    const testCounts = await TestCounter.scanAllTests();

    const scanDuration = Date.now() - startTime;

    console.log(`✅ Test scan completed in ${scanDuration}ms`);
    console.log(TestCounter.formatTestCountSummary(testCounts));

    return NextResponse.json({
      success: true,
      data: testCounts,
    });
  } catch (error) {
    console.error("❌ Test counting failed:", error);

    // Throw actual error - no fallback data
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test counting failed",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * HEAD /api/test-counts
 * Health check endpoint
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
