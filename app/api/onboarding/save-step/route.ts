import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { getSession } from "@/app/lib/auth";
import { audit } from "@/app/lib/audit-middleware";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { step, data } = body;

    if (typeof step !== "number" || step < 0 || step > 3) {
      return NextResponse.json(
        { error: "Invalid step number. Must be 0-3" },
        { status: 400 },
      );
    }

    const userId = session.user.id;
    const updateData: any = {
      updated_at: new Date(),
    };

    // Handle step-specific data persistence and completion tracking
    switch (step) {
      case 0: // Personal Info Step
        if (data) {
          Object.assign(updateData, {
            first_name: data.first_name || null,
            last_name: data.last_name || null,
            phone_number: data.phone_number || null,
            date_of_birth: data.date_of_birth || null,
            address_line_1: data.address_line_1 || null,
            address_line_2: data.address_line_2 || null,
            city: data.city || null,
            county: data.county || null,
            eircode: data.eircode || null,
            profile_photo_url: data.profile_photo_url || null,
            personal_info_completed: true,
            personal_info_completed_at: new Date(),
            onboarding_current_step: "signature",
          });
        }
        break;

      case 1: // Signature Step
        updateData.signature_completed = true;
        updateData.signature_completed_at = new Date();
        updateData.onboarding_current_step = "legal_consent";
        break;

      case 2: // Legal Consent Step
        updateData.legal_consent_completed = true;
        updateData.legal_consent_completed_at = new Date();
        updateData.onboarding_current_step = "verification";
        break;

      case 3: // Verification Step
        updateData.verification_completed = true;
        updateData.verification_completed_at = new Date();
        updateData.onboarding_current_step = "completed";
        break;

      default:
        return NextResponse.json({ error: "Invalid step" }, { status: 400 });
    }

    // Update user record
    await db.update(users).set(updateData).where(eq(users.id, userId));

    // Log the step completion for audit trail
    await audit.logUserAction(
      userId,
      "onboarding_step_completed",
      "onboarding",
      userId,
      { step, completedAt: new Date() },
    );

    console.log(`Onboarding step ${step} completed for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Step ${step} completed successfully`,
      step,
      nextStep: step < 3 ? step + 1 : "complete",
    });
  } catch (error) {
    console.error("Save step error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
