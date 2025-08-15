import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
// Note: argon2 is imported conditionally to avoid Vercel serverless issues
import { redirect } from 'next/navigation'
import { db } from '@/db/db'
import { users, refreshTokens, type User } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// JWT Configuration
const ACCESS_TOKEN_EXPIRES_IN = '15m' // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '30d' // 30 days

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'fallback-dev-secret-32-characters'
)

const REFRESH_SECRET = new TextEncoder().encode(
  process.env.REFRESH_SECRET || process.env.SESSION_SECRET || 'fallback-dev-refresh-32-chars'
)

// JWT Token Types
interface AccessTokenPayload {
  userId: string
  email: string
  sessionVersion: number
  type: 'access'
}

interface RefreshTokenPayload {
  userId: string
  family: string
  jti: string
  type: 'refresh'
}

// Auth User Interface
export interface AuthUser {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  onboardingStatus?: string | null
  onboardingCurrentStep?: string | null
  onboarding_completed?: boolean
}

// Session Interface
export interface Session {
  user: AuthUser
  isAuthenticated: true
}

export interface NoSession {
  user: null
  isAuthenticated: false
}

export type SessionResult = Session | NoSession

/**
 * Hash password using Argon2
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const argon2 = await import('argon2')
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    })
  } catch (error) {
    console.error('Password hashing error:', error)
    throw new Error('Password hashing failed')
  }
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const argon2 = await import('argon2')
    return await argon2.verify(hash, password)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * Sign Access Token (15 minutes)
 */
export async function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): Promise<string> {
  try {
    return await new SignJWT({ ...payload, type: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
      .sign(JWT_SECRET)
  } catch (error) {
    console.error('Token signing error:', error)
    throw new Error('Token signing failed')
  }
}

/**
 * Sign Refresh Token (30 days)
 */
export async function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): Promise<string> {
  try {
    return await new SignJWT({ ...payload, type: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
      .sign(REFRESH_SECRET)
  } catch (error) {
    console.error('Refresh token signing error:', error)
    throw new Error('Refresh token signing failed')
  }
}

/**
 * Verify Access Token
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    if (payload.type === 'access') {
      return payload as unknown as AccessTokenPayload
    }
    
    return null
  } catch (error) {
    // Don't log expired token errors as they're expected
    if (error instanceof Error && !error.message.includes('expired')) {
      console.error('Access token verification error:', error)
    }
    return null
  }
}

/**
 * Verify Refresh Token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET)
    
    if (payload.type === 'refresh') {
      return payload as unknown as RefreshTokenPayload
    }
    
    return null
  } catch (error) {
    // Don't log expired token errors as they're expected
    if (error instanceof Error && !error.message.includes('expired')) {
      console.error('Refresh token verification error:', error)
    }
    return null
  }
}

/**
 * Generate secure random token family ID
 */
export function generateTokenFamily(): string {
  return crypto.randomUUID()
}

/**
 * Generate secure random JTI
 */
export function generateJTI(): string {
  return crypto.randomUUID()
}

/**
 * Hash refresh token for database storage
 */
export async function hashRefreshToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Set JWT cookies (access + refresh)
 */
export async function setAuthCookies(userId: string, email: string): Promise<void> {
  const sessionVersion = Date.now() // Simple session versioning
  const family = generateTokenFamily()
  const jti = generateJTI()
  
  // Create tokens
  const accessToken = await signAccessToken({
    userId,
    email,
    sessionVersion,
  })
  
  const refreshToken = await signRefreshToken({
    userId,
    family,
    jti,
  })
  
  // Try to store refresh token in database, with fallback
  try {
    const refreshTokenHash = await hashRefreshToken(refreshToken)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now
    
    await db.insert(refreshTokens).values({
      userId,
      tokenHash: refreshTokenHash,
      family,
      expiresAt,
    })
  } catch (dbError) {
    console.warn('Database error in setAuthCookies, continuing with cookies only:', dbError)
  }
  
  // Set HTTP-only cookies
  const cookieStore = cookies()
  
  cookieStore.set('herit_access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  })
  
  cookieStore.set('herit_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  })
}

/**
 * Clear auth cookies
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = cookies()
  
  cookieStore.delete('herit_access_token')
  cookieStore.delete('herit_refresh_token')
}

/**
 * Get session from cookies (Server Components/Actions)
 */
export async function getSession(): Promise<SessionResult> {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('herit_access_token')?.value
    
    if (!accessToken) {
      return { user: null, isAuthenticated: false }
    }
    
    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return { user: null, isAuthenticated: false }
    }
    
    // Try to get user from database, with fallback for development
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1)
      
      if (user) {
        // Determine onboarding completion based on all required steps
        const onboarding_completed = !!(
          user.personalInfoCompleted &&
          user.signatureCompleted &&
          user.legalConsentCompleted &&
          user.verificationCompleted &&
          user.onboardingCompletedAt
        )
        
        return {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            onboardingStatus: user.onboardingStatus,
            onboardingCurrentStep: user.onboardingCurrentStep,
            onboarding_completed,
          },
          isAuthenticated: true,
        }
      }
    } catch (dbError) {
      console.warn('Database error in getSession, using fallback:', dbError)
    }
    
    // Fallback: return user data from JWT payload for OAuth users or development
    // For OAuth users, extract the provider from the userId prefix
    const isOAuthUser = payload.userId.includes('_')
    
    return {
      user: {
        id: payload.userId,
        email: payload.email,
        firstName: null,
        lastName: null,
        onboardingStatus: 'not_started', // Always not_started for new OAuth users
        onboardingCurrentStep: 'personal_info',
        onboarding_completed: false,
      },
      isAuthenticated: true,
    }
  } catch (error) {
    console.error('Session error:', error)
    return { user: null, isAuthenticated: false }
  }
}

/**
 * Require authentication (redirect if not authenticated)
 */
export async function requireAuth(): Promise<AuthUser> {
  const session = await getSession()
  
  if (!session.isAuthenticated) {
    redirect('/login')
  }
  
  return session.user
}

/**
 * Refresh token rotation
 */
export async function refreshTokenRotation(currentRefreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
  user: AuthUser
} | null> {
  try {
    // Verify current refresh token
    const payload = await verifyRefreshToken(currentRefreshToken)
    if (!payload) {
      return null
    }
    
    // Hash the token for database lookup
    const tokenHash = await hashRefreshToken(currentRefreshToken)
    
    // Find and validate refresh token in database
    const [storedToken] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          eq(refreshTokens.family, payload.family),
          eq(refreshTokens.revoked, false)
        )
      )
      .limit(1)
    
    if (!storedToken || storedToken.expiresAt < new Date()) {
      return null
    }
    
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1)
    
    if (!user) {
      return null
    }
    
    // Revoke old refresh token
    await db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.id, storedToken.id))
    
    // Generate new tokens
    const sessionVersion = Date.now()
    const newJti = generateJTI()
    
    const newAccessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      sessionVersion,
    })
    
    const newRefreshToken = await signRefreshToken({
      userId: user.id,
      family: payload.family, // Keep same family
      jti: newJti,
    })
    
    // Store new refresh token
    const newRefreshTokenHash = await hashRefreshToken(newRefreshToken)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: newRefreshTokenHash,
      family: payload.family,
      expiresAt,
    })
    
    // Determine onboarding completion
    const onboarding_completed = !!(
      user.personalInfoCompleted &&
      user.signatureCompleted &&
      user.legalConsentCompleted &&
      user.verificationCompleted &&
      user.onboardingCompletedAt
    )
    
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        onboardingStatus: user.onboardingStatus,
        onboardingCurrentStep: user.onboardingCurrentStep,
        onboarding_completed,
      },
    }
  } catch (error) {
    console.error('Token rotation error:', error)
    return null
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
      .where(eq(refreshTokens.family, family))
  } catch (error) {
    console.error('Token revocation error:', error)
    throw new Error('Token revocation failed')
  }
}