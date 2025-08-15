import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword, setAuthCookies } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, given_name, family_name } = await request.json()
    
    // Basic validation
    if (!email || !password || !given_name || !family_name) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        firstName: given_name,
        lastName: family_name,
        onboardingStatus: 'not_started',
        onboardingCurrentStep: 'personal_info',
      })
      .returning()

    // Set authentication cookies
    await setAuthCookies(newUser.id, newUser.email)

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        onboardingStatus: newUser.onboardingStatus,
        onboardingCurrentStep: newUser.onboardingCurrentStep,
        onboarding_completed: false,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'