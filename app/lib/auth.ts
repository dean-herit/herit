import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
// Note: argon2 is imported conditionally to avoid Vercel serverless issues
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";

import { db } from "@/db/db";
import { users, refreshTokens, type User } from "@/db/schema";
import { env } from "@/app/lib/env";

// JWT Configuration
const ACCESS_TOKEN_EXPIRES_IN = "24h"; // 24 hours (increased from 15m)
const REFRESH_TOKEN_EXPIRES_IN = "30d"; // 30 days

const JWT_SECRET = new TextEncoder().encode(env.SESSION_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(
  env.REFRESH_SECRET || env.SESSION_SECRET,
);

// JWT Token Types
interface AccessTokenPayload {
  userId: string;
  email: string;
  sessionVersion: number;
  type: "access";
}

interface RefreshTokenPayload {
  userId: string;
  family: string;
  jti: string;
  type: "refresh";
}

// Auth User Type - derived from database schema
export type AuthUser = User;

// Session Interface
export interface Session {
  user: AuthUser;
  isAuthenticated: true;
}

export interface NoSession {
  user: null;
  isAuthenticated: false;
  error?:
    | "token_invalid"
    | "token_expired"
    | "token_missing"
    | "user_not_found";
}

export type SessionResult = Session | NoSession;

/**
 * Hash password using Argon2
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const argon2 = await import("argon2");

    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  } catch (error) {
    console.error("Password hashing error:", error);
    throw new Error(
      `AUTH_HASH_ERROR: Password hashing failed - ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    const argon2 = await import("argon2");

    return await argon2.verify(hash, password);
  } catch (error) {
    console.error("Password verification error:", error);

    return false;
  }
}

/**
 * Sign Access Token (15 minutes)
 */
export async function signAccessToken(
  payload: Omit<AccessTokenPayload, "type">,
): Promise<string> {
  try {
    return await new SignJWT({ ...payload, type: "access" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
      .sign(JWT_SECRET);
  } catch (error) {
    console.error("Token signing error:", error);
    throw new Error(
      `AUTH_TOKEN_ERROR: JWT access token signing failed - ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Sign Refresh Token (30 days)
 */
export async function signRefreshToken(
  payload: Omit<RefreshTokenPayload, "type">,
): Promise<string> {
  try {
    return await new SignJWT({ ...payload, type: "refresh" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
      .sign(REFRESH_SECRET);
  } catch (error) {
    console.error("Refresh token signing error:", error);
    throw new Error("Refresh token signing failed");
  }
}

/**
 * Verify Access Token
 */
export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type === "access") {
      return payload as unknown as AccessTokenPayload;
    }

    return null;
  } catch (error) {
    // Don't log expired token errors as they're expected
    if (error instanceof Error && !error.message.includes("expired")) {
      console.error("Access token verification error:", error);
    }

    return null;
  }
}

/**
 * Verify Refresh Token
 */
export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);

    if (payload.type === "refresh") {
      return payload as unknown as RefreshTokenPayload;
    }

    return null;
  } catch (error) {
    // Don't log expired token errors as they're expected
    if (error instanceof Error && !error.message.includes("expired")) {
      console.error("Refresh token verification error:", error);
    }

    return null;
  }
}

/**
 * Generate secure random token family ID
 */
export function generateTokenFamily(): string {
  return crypto.randomUUID();
}

/**
 * Generate secure random JTI
 */
export function generateJTI(): string {
  return crypto.randomUUID();
}

/**
 * Hash refresh token for database storage
 */
export async function hashRefreshToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Set JWT cookies (access + refresh)
 */
export async function setAuthCookies(
  userId: string,
  email: string,
): Promise<void> {
  const sessionVersion = Date.now(); // Simple session versioning
  const family = generateTokenFamily();
  const jti = generateJTI();

  // Create tokens
  const accessToken = await signAccessToken({
    userId,
    email,
    sessionVersion,
  });

  const refreshToken = await signRefreshToken({
    userId,
    family,
    jti,
  });

  // Try to store refresh token in database, with fallback
  try {
    const refreshTokenHash = await hashRefreshToken(refreshToken);
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    await db.insert(refreshTokens).values({
      user_id: userId,
      token_hash: refreshTokenHash,
      family,
      expires_at: expiresAt,
    });
  } catch (dbError) {
    console.warn(
      "Database error in setAuthCookies, continuing with cookies only:",
      dbError,
    );
  }

  // Set HTTP-only cookies
  const cookieStore = await cookies();

  cookieStore.set("herit_access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
    path: "/",
  });

  cookieStore.set("herit_refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });
}

/**
 * Clear auth cookies and revoke refresh tokens
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  // Get the current refresh token to identify the user before clearing
  const refreshToken = cookieStore.get("herit_refresh_token")?.value;

  // Clear HTTP cookies first
  cookieStore.delete("herit_access_token");
  cookieStore.delete("herit_refresh_token");

  // If we have a refresh token, revoke all refresh tokens for this user
  if (refreshToken) {
    try {
      // Verify the refresh token to get the user ID
      const { payload } = await jwtVerify(refreshToken, REFRESH_SECRET);
      const refreshPayload = payload as unknown as RefreshTokenPayload;

      // Revoke all refresh tokens for this user in the database
      await db
        .update(refreshTokens)
        .set({
          revoked: true,
          revoked_at: new Date(),
        })
        .where(eq(refreshTokens.user_id, refreshPayload.userId));
    } catch (dbError) {
      // Log the error but don't fail logout - cookies are already cleared
      console.error(
        "Failed to revoke refresh tokens from database during logout:",
        dbError,
      );
      // In development, this might fail due to database issues, but logout should still work
    }
  }
}

/**
 * Get session from cookies (Server Components/Actions)
 */
export async function getSession(): Promise<SessionResult> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("herit_access_token")?.value;

    if (!accessToken) {
      return { user: null, isAuthenticated: false, error: "token_missing" };
    }

    const payload = await verifyAccessToken(accessToken);

    if (!payload) {
      // Check if token exists but is invalid (corrupted/malformed)
      try {
        // Attempt to decode without verification to detect malformed tokens
        const parts = accessToken.split(".");

        if (parts.length !== 3) {
          return { user: null, isAuthenticated: false, error: "token_invalid" };
        }

        // If we can split but verification failed, it's likely expired or invalid signature
        return { user: null, isAuthenticated: false, error: "token_expired" };
      } catch {
        return { user: null, isAuthenticated: false, error: "token_invalid" };
      }
    }

    // Try to get user from database, with fallback for development
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      if (user) {
        // No need to compute onboarding_completed - it's already computed in the database!
        return {
          user: user, // Direct return of database user - types already match!
          isAuthenticated: true,
        };
      }

      // User token is valid but user not found in database
      return { user: null, isAuthenticated: false, error: "user_not_found" };
    } catch (dbError) {
      console.error("Database error in getSession:", dbError);
    }

    // Fallback: create minimal user object for OAuth users
    // This should rarely happen now that we use database as source of truth
    const fallbackUser: AuthUser = {
      id: payload.userId,
      email: payload.email,
      password_hash: null,
      first_name: null,
      last_name: null,
      phone_number: null,
      date_of_birth: null,
      pps_number: null,
      profile_photo_url: null,
      address_line_1: null,
      address_line_2: null,
      city: null,
      county: null,
      eircode: null,
      onboarding_status: "not_started",
      onboarding_current_step: "personal_info",
      onboarding_completed_at: null,
      personal_info_completed: false,
      personal_info_completed_at: null,
      signature_completed: false,
      signature_completed_at: null,
      legal_consent_completed: false,
      legal_consent_completed_at: null,
      legal_consents: null,
      verification_completed: false,
      verification_completed_at: null,
      verification_session_id: null,
      verification_status: null,
      onboarding_completed: false, // Will be false since all steps are false
      auth_provider: null,
      auth_provider_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    return {
      user: fallbackUser,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error("Session error:", error);

    return { user: null, isAuthenticated: false };
  }
}

/**
 * Require authentication (redirect if not authenticated)
 */
export async function requireAuth(): Promise<AuthUser> {
  const session = await getSession();

  if (!session.isAuthenticated) {
    redirect("/login");
  }

  return session.user;
}

/**
 * Refresh token rotation
 */
export async function refreshTokenRotation(
  currentRefreshToken: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
} | null> {
  try {
    // Verify current refresh token
    const payload = await verifyRefreshToken(currentRefreshToken);

    if (!payload) {
      return null;
    }

    // Hash the token for database lookup
    const tokenHash = await hashRefreshToken(currentRefreshToken);

    // Find and validate refresh token in database
    const [storedToken] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token_hash, tokenHash),
          eq(refreshTokens.family, payload.family),
          eq(refreshTokens.revoked, false),
        ),
      )
      .limit(1);

    if (!storedToken || storedToken.expires_at < new Date()) {
      return null;
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      return null;
    }

    // Revoke old refresh token
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.id, storedToken.id));

    // Generate new tokens
    const sessionVersion = Date.now();
    const newJti = generateJTI();

    const newAccessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      sessionVersion,
    });

    const newRefreshToken = await signRefreshToken({
      userId: user.id,
      family: payload.family, // Keep same family
      jti: newJti,
    });

    // Store new refresh token
    const newRefreshTokenHash = await hashRefreshToken(newRefreshToken);
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.insert(refreshTokens).values({
      user_id: user.id,
      token_hash: newRefreshTokenHash,
      family: payload.family,
      expires_at: expiresAt,
    });

    // No need to compute onboarding_completed - it's already computed in the database!
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: user, // Direct return of database user - types already match!
    };
  } catch (error) {
    console.error("Token rotation error:", error);

    return null;
  }
}

/**
 * Revoke refresh token family (logout all sessions)
 */
export async function revokeRefreshTokenFamily(family: string): Promise<void> {
  try {
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.family, family));
  } catch (error) {
    console.error("Token revocation error:", error);
    throw new Error("Token revocation failed");
  }
}
