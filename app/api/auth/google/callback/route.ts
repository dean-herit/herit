import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { setAuthCookies } from "@/app/lib/auth";
import { audit } from "@/app/lib/audit-middleware";
import { processGoogleProfilePhoto } from "@/app/lib/photo-utils";

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
  const startTime = Date.now();
  const sessionId = crypto.randomUUID(); // Generate session correlation ID

  // Extract context for audit logging
  const ipAddress =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Check for OAuth errors
    if (error) {
      console.error("Google OAuth error:", error);

      // Log OAuth error for security monitoring
      await audit.logSecurityEvent(
        null as any,
        "google_oauth_error",
        {
          error: error,
          processing_duration_ms: Date.now() - startTime,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
        ipAddress,
        sessionId,
      );

      return NextResponse.redirect(
        new URL("/login?error=oauth_error", request.url),
      );
    }

    if (!code) {
      // Log missing authorization code
      await audit.logSecurityEvent(
        null as any,
        "oauth_missing_code",
        {
          processing_duration_ms: Date.now() - startTime,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
        ipAddress,
        sessionId,
      );

      return NextResponse.redirect(
        new URL("/login?error=missing_code", request.url),
      );
    }

    // Verify state parameter
    const storedState = request.cookies.get("oauth_state")?.value;

    if (!storedState || storedState !== state) {
      // Log potential CSRF attempt
      await audit.logSecurityEvent(
        null as any,
        "oauth_state_validation_failed",
        {
          provided_state: state,
          state_mismatch: storedState !== state,
          processing_duration_ms: Date.now() - startTime,
          ip_address: ipAddress,
          user_agent: userAgent,
          potential_csrf_attempt: true,
        },
        ipAddress,
        sessionId,
      );

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
      // Log OAuth configuration error
      await audit.logSecurityEvent(
        null,
        "oauth_config_error",
        {
          missing_client_id: !googleClientId,
          missing_client_secret: !googleClientSecret,
          processing_duration_ms: Date.now() - startTime,
          ip_address: ipAddress,
        },
        ipAddress,
        sessionId,
      );

      return NextResponse.redirect(
        new URL("/login?error=oauth_config", request.url),
      );
    }

    // Log token exchange attempt (without sensitive data)
    await audit.logUserAction(
      "anonymous",
      "oauth_token_exchange_initiated",
      "authentication",
      "",
      {
        provider: "google",
        redirect_uri: redirectUri,
        processing_duration_ms: Date.now() - startTime,
        session_id: sessionId,
      },
      sessionId,
    );

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

      // Log token exchange failure
      await audit.logSecurityEvent(
        null,
        "oauth_token_exchange_failed",
        {
          provider: "google",
          status_code: tokenResponse.status,
          processing_duration_ms: Date.now() - startTime,
          ip_address: ipAddress,
        },
        ipAddress,
        sessionId,
      );

      return NextResponse.redirect(
        new URL("/login?error=token_exchange", request.url),
      );
    }

    const tokens = await tokenResponse.json();

    // Log successful token exchange (without token values)
    await audit.logUserAction(
      "anonymous",
      "oauth_token_exchange_success",
      "authentication",
      "",
      {
        provider: "google",
        token_type: tokens.token_type || "Bearer",
        scope: tokens.scope || "profile email",
        processing_duration_ms: Date.now() - startTime,
        session_id: sessionId,
      },
      sessionId,
    );

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

      // Log user info fetch failure
      await audit.logSecurityEvent(
        null,
        "oauth_user_info_fetch_failed",
        {
          provider: "google",
          status_code: userResponse.status,
          processing_duration_ms: Date.now() - startTime,
          ip_address: ipAddress,
        },
        ipAddress,
        sessionId,
      );

      return NextResponse.redirect(
        new URL("/login?error=user_info", request.url),
      );
    }

    const googleUser: GoogleUser = await userResponse.json();

    // Log successful user info retrieval (without PII)
    await audit.logUserAction(
      "anonymous",
      "oauth_user_info_retrieved",
      "authentication",
      "",
      {
        provider: "google",
        email_verified: googleUser.verified_email,
        has_profile_data: {
          first_name: !!googleUser.given_name,
          last_name: !!googleUser.family_name,
          email: !!googleUser.email,
          profile_photo: !!googleUser.picture,
        },
        processing_duration_ms: Date.now() - startTime,
        session_id: sessionId,
      },
      sessionId,
    );

    try {
      // Check if user exists in database
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, googleUser.email))
        .limit(1);

      let userId: string;
      let needsOnboarding = false;
      let userType: "existing" | "new" = "existing";

      if (existingUser) {
        // User exists - update auth provider info if needed
        userId = existingUser.id;

        // Prepare update fields - only update if not already set
        const updateFields: any = {
          updated_at: new Date(),
        };

        const oldData = {
          auth_provider: existingUser.auth_provider,
          profile_photo_url: existingUser.profile_photo_url,
          first_name: existingUser.first_name,
          last_name: existingUser.last_name,
        };

        // Update auth provider if not set
        if (
          !existingUser.auth_provider ||
          existingUser.auth_provider !== "google"
        ) {
          updateFields.auth_provider = "google";
          updateFields.auth_provider_id = googleUser.id;
        }

        // Update profile photo if not set - download and store non-placeholder photos
        if (!existingUser.profile_photo_url && googleUser.picture) {
          const processedPhotoUrl = await processGoogleProfilePhoto(
            googleUser.picture,
            existingUser.id,
            existingUser.email,
          );

          if (processedPhotoUrl) {
            updateFields.profile_photo_url = processedPhotoUrl;
          }
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

          // Log data change for existing user OAuth pre-population
          await audit.logDataChange(
            userId,
            "update",
            "user_profile",
            userId,
            oldData,
            {
              auth_provider:
                updateFields.auth_provider || oldData.auth_provider,
              profile_photo_url:
                updateFields.profile_photo_url || oldData.profile_photo_url,
              first_name: updateFields.first_name || oldData.first_name,
              last_name: updateFields.last_name || oldData.last_name,
            },
            sessionId,
          );
        }

        // Check if onboarding is complete
        needsOnboarding = !(
          existingUser.personal_info_completed &&
          existingUser.signature_completed &&
          existingUser.legal_consent_completed &&
          existingUser.verification_completed &&
          existingUser.onboarding_completed_at
        );

        // Log existing user OAuth login
        await audit.logUserAction(
          userId,
          "oauth_existing_user_login",
          "authentication",
          userId,
          {
            provider: "google",
            user_updated: Object.keys(updateFields).length > 1,
            fields_updated: Object.keys(updateFields).filter(
              (key) => key !== "updated_at",
            ),
            needs_onboarding: needsOnboarding,
            onboarding_status: existingUser.onboarding_status,
            processing_duration_ms: Date.now() - startTime,
            session_id: sessionId,
          },
          sessionId,
        );
      } else {
        userType = "new";

        // Create new user first to get the ID
        const [newUser] = await db
          .insert(users)
          .values({
            email: googleUser.email,
            first_name: googleUser.given_name || null,
            last_name: googleUser.family_name || null,
            profile_photo_url: null, // Will be updated below if photo exists
            auth_provider: "google",
            auth_provider_id: googleUser.id,
            onboarding_status: "not_started",
            onboarding_current_step: "personal_info",
          })
          .returning();

        userId = newUser.id;
        needsOnboarding = true;

        // Now process and update the Google profile photo if it exists
        if (googleUser.picture) {
          const processedPhotoUrl = await processGoogleProfilePhoto(
            googleUser.picture,
            newUser.id,
            googleUser.email,
          );

          // Update user with processed photo URL if we got a valid photo
          if (processedPhotoUrl) {
            await db
              .update(users)
              .set({ profile_photo_url: processedPhotoUrl })
              .where(eq(users.id, newUser.id));
          }
        }

        // Log new user creation with OAuth pre-population data
        await audit.logDataChange(
          userId,
          "create",
          "user_profile",
          userId,
          null, // No old data for new user
          {
            email: googleUser.email,
            first_name: googleUser.given_name || null,
            last_name: googleUser.family_name || null,
            profile_photo_url: googleUser.picture || null,
            auth_provider: "google",
            onboarding_status: "not_started",
          },
          sessionId,
        );

        // Log GDPR compliance for new user OAuth data processing
        await audit.logUserAction(
          userId,
          "gdpr_compliance_oauth_processing",
          "data_protection",
          userId,
          {
            consent_type: "oauth_profile_prepopulation",
            provider: "google",
            data_categories: ["name", "email", "profile_photo"],
            legal_basis: "consent",
            retention_period: "account_lifetime_plus_7_years",
            processing_purpose: "estate_planning_onboarding",
            user_consent_timestamp: new Date().toISOString(),
            audit_trail_enabled: true,
          },
          sessionId,
        );

        // Log new user OAuth registration
        await audit.logUserAction(
          userId,
          "oauth_new_user_registration",
          "authentication",
          userId,
          {
            provider: "google",
            prepopulation_data: {
              first_name: !!googleUser.given_name,
              last_name: !!googleUser.family_name,
              email: !!googleUser.email,
              profile_photo: !!googleUser.picture,
            },
            email_verified: googleUser.verified_email,
            processing_duration_ms: Date.now() - startTime,
            session_id: sessionId,
          },
          sessionId,
        );
      }

      // Set authentication cookies using our JWT system
      await setAuthCookies(userId, googleUser.email);

      // Determine redirect URL
      const redirectUrl = needsOnboarding ? "/onboarding" : "/dashboard";

      // Log successful OAuth callback completion
      await audit.logUserAction(
        userId,
        "google_oauth_callback_complete",
        "authentication",
        userId,
        {
          provider: "google",
          user_type: userType,
          redirect_destination: redirectUrl,
          needs_onboarding: needsOnboarding,
          prepopulation_ready: !!(
            googleUser.given_name ||
            googleUser.family_name ||
            googleUser.email
          ),
          total_processing_duration_ms: Date.now() - startTime,
          session_id: sessionId,
        },
        sessionId,
      );

      // Create response and clear state cookie
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));

      response.cookies.delete("oauth_state");

      return response;
    } catch (dbError) {
      console.error("Database error during OAuth:", dbError);

      // Log database error for monitoring
      await audit.logSecurityEvent(
        null,
        "oauth_database_error",
        {
          provider: "google",
          error:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
          processing_duration_ms: Date.now() - startTime,
          ip_address: ipAddress,
        },
        ipAddress,
        sessionId,
      );

      // DO NOT create a fake session - this causes issues downstream
      // Instead, redirect to login with an error message
      return NextResponse.redirect(
        new URL(
          "/login?error=database_error&message=Unable+to+complete+sign+in",
          request.url,
        ),
      );
    }
  } catch (error) {
    console.error("Google OAuth callback error:", error);

    // Log system error for monitoring
    await audit.logSecurityEvent(
      null,
      "oauth_callback_system_error",
      {
        provider: "google",
        error: error instanceof Error ? error.message : "Unknown system error",
        processing_duration_ms: Date.now() - startTime,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
      ipAddress,
      sessionId,
    );

    return NextResponse.redirect(
      new URL("/login?error=callback_error", request.url),
    );
  }
}
