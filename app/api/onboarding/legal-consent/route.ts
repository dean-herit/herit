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
    const { consents } = data

    // Basic validation
    if (!consents || typeof consents !== 'object') {
      return NextResponse.json(
        { error: 'Consents data required' },
        { status: 400 }
      )
    }

    // Check required consents
    const requiredConsents = ['termsOfService', 'privacyPolicy', 'legalAdvice']
    const missingConsents = requiredConsents.filter(consent => !consents[consent])
    
    if (missingConsents.length > 0) {
      return NextResponse.json(
        { error: `Required consents missing: ${missingConsents.join(', ')}` },
        { status: 400 }
      )
    }

    // Update user's legal consent information
    await db
      .update(users)
      .set({
        legalConsents: {
          ...consents,
          timestamp: new Date().toISOString(),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
        legalConsentCompleted: true,
        legalConsentCompletedAt: new Date(),
        onboardingCurrentStep: 'verification',
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({
      success: true,
      message: 'Legal consent saved successfully',
    })
  } catch (error) {
    console.error('Legal consent save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'