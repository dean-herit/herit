import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const {
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      addressLine1,
      addressLine2,
      city,
      county,
      eircode,
    } = data

    // Basic validation
    if (!firstName || !lastName || !phoneNumber || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      )
    }

    // Update user's personal information
    await db
      .update(users)
      .set({
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        county: county || null,
        eircode: eircode || null,
        personalInfoCompleted: true,
        personalInfoCompletedAt: new Date(),
        onboardingCurrentStep: 'signature',
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({
      success: true,
      message: 'Personal information saved successfully',
    })
  } catch (error) {
    console.error('Personal info save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'