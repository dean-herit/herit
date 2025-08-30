import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

async function createTestUserHandler(request: NextRequest) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test user creation not allowed in production" },
      { status: 403 },
    );
  }

  try {
    const {
      email = "claude.assistant@example.com",
      password = "DemoPassword123!",
    } = await request.json().catch(() => ({}));

    // Check if test user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: "Test user already exists",
        user: {
          id: existingUser.id,
          email: existingUser.email,
          firstName: existingUser.first_name,
          lastName: existingUser.last_name,
          onboardingStatus: existingUser.onboarding_status,
          onboardingCurrentStep: existingUser.onboarding_current_step,
        },
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create test user with specific credentials expected by MCP server
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name: "Claude",
        last_name: "Assistant",
        onboarding_status: "in_progress",
        onboarding_current_step: "signature", // Put them in signature step so they can test drawing
        personal_info_completed: true, // Complete personal info so they can access signature step
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Test user created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        onboardingStatus: newUser.onboarding_status,
        onboardingCurrentStep: newUser.onboarding_current_step,
      },
    });
  } catch (error) {
    console.error("Test user creation error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = createTestUserHandler;
export const GET = createTestUserHandler; // Allow GET for easy testing

export const dynamic = "force-dynamic";
