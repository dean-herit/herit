import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { setAuthCookies } from "@/lib/auth";

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  verified_email: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Check for OAuth errors
    if (error) {
      console.error("Google OAuth error:", error);

      return NextResponse.redirect(
        new URL("/login?error=oauth_error", request.url),
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/login?error=missing_code", request.url),
      );
    }

    // Verify state parameter
    const storedState = request.cookies.get("oauth_state")?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_state", request.url),
      );
    }

    // Exchange code for tokens (trim to prevent newline issues)
    const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    // Get the correct redirect URI based on environment
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? "https://herit.vercel.app"
        : "http://localhost:3000";
    const redirectUri = (
      process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/auth/google/callback`
    ).trim();

    if (!googleClientId || !googleClientSecret) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_config", request.url),
      );
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());

      return NextResponse.redirect(
        new URL("/login?error=token_exchange", request.url),
      );
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    );

    if (!userResponse.ok) {
      console.error("User info fetch failed:", await userResponse.text());

      return NextResponse.redirect(
        new URL("/login?error=user_info", request.url),
      );
    }

    const googleUser: GoogleUser = await userResponse.json();

    try {
      // Check if user exists in database
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, googleUser.email))
        .limit(1);

      let userId: string;
      let needsOnboarding = false;

      if (existingUser) {
        // User exists - update auth provider info if needed
        userId = existingUser.id;

        // Prepare update fields - only update if not already set
        const updateFields: any = {
          updated_at: new Date(),
        };

        // Update auth provider if not set
        if (
          !existingUser.auth_provider ||
          existingUser.auth_provider !== "google"
        ) {
          updateFields.auth_provider = "google";
          updateFields.auth_provider_id = googleUser.id;
        }

        // Update profile photo if not set
        if (!existingUser.profile_photo_url && googleUser.picture) {
          updateFields.profile_photo_url = googleUser.picture;
        }

        // Update first/last name if not set
        if (!existingUser.first_name && googleUser.given_name) {
          updateFields.first_name = googleUser.given_name;
        }
        if (!existingUser.last_name && googleUser.family_name) {
          updateFields.last_name = googleUser.family_name;
        }

        // Only update if there are fields to update
        if (Object.keys(updateFields).length > 1) {
          // > 1 because updatedAt is always there
          await db
            .update(users)
            .set(updateFields)
            .where(eq(users.id, existingUser.id));
        }

        // Check if onboarding is complete
        needsOnboarding = !(
          existingUser.personal_info_completed &&
          existingUser.signature_completed &&
          existingUser.legal_consent_completed &&
          existingUser.verification_completed &&
          existingUser.onboarding_completed_at
        );
      } else {
        // Create new user with all available Google data
        const [newUser] = await db
          .insert(users)
          .values({
            email: googleUser.email,
            first_name: googleUser.given_name || null,
            last_name: googleUser.family_name || null,
            profile_photo_url: googleUser.picture || null,
            auth_provider: "google",
            auth_provider_id: googleUser.id,
            onboarding_status: "not_started",
            onboarding_current_step: "personal_info",
          })
          .returning();

        userId = newUser.id;
        needsOnboarding = true;
      }

      // Set authentication cookies using our JWT system
      await setAuthCookies(userId, googleUser.email);

      // Determine redirect URL
      const redirectUrl = needsOnboarding ? "/onboarding" : "/dashboard";

      // Create response and clear state cookie
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));

      response.cookies.delete("oauth_state");

      return response;
    } catch (dbError) {
      console.error("Database error during OAuth:", dbError);

      // Fallback: create temporary session without database (for development)
      // Generate a proper UUID instead of using string concatenation
      const userId = crypto.randomUUID();

      await setAuthCookies(userId, googleUser.email);

      const response = NextResponse.redirect(
        new URL("/onboarding", request.url),
      );

      response.cookies.delete("oauth_state");

      return response;
    }
  } catch (error) {
    console.error("Google OAuth callback error:", error);

    return NextResponse.redirect(
      new URL("/login?error=callback_error", request.url),
    );
  }
}
