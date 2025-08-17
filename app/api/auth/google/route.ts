import { NextRequest, NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/auth";
import { env } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    // Clear any existing auth session before starting OAuth flow
    // This ensures a clean OAuth flow without interference from existing sessions
    await clearAuthCookies();

    // Use validated environment variables
    const googleClientId = env.GOOGLE_CLIENT_ID?.trim();
    // Get the correct redirect URI based on environment
    const baseUrl =
      env.NODE_ENV === "production"
        ? "https://herit.vercel.app"
        : "http://localhost:3000";
    const redirectUri = (
      env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/auth/google/callback`
    ).trim();

    if (!googleClientId) {
      return NextResponse.json(
        { error: "Google OAuth is not configured" },
        { status: 500 },
      );
    }

    // Generate state parameter for security
    const state = crypto.randomUUID();

    // Store state in a cookie for verification
    const response = NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/auth?` +
        `client_id=${encodeURIComponent(googleClientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent("openid email profile")}&` +
        `state=${encodeURIComponent(state)}&` +
        `prompt=consent&` +
        `access_type=offline`,
    );

    // Set state cookie
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Google OAuth initiation error:", error);

    return NextResponse.json(
      { error: "Failed to initiate Google OAuth" },
      { status: 500 },
    );
  }
}
