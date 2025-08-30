import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { audit } from "@/lib/audit-middleware";
import { onboardingPersonalInfoSchema } from "@/types/shared-personal-info";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const sessionId = crypto.randomUUID();

  // Extract context for audit logging
  const ipAddress =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      // Log unauthorized access attempt
      await audit.logSecurityEvent(
        null,
        "unauthorized_personal_info_access",
        {
          processing_duration_ms: Date.now() - startTime,
          ip_address: ipAddress,
          attempted_resource: "onboarding_personal_info",
        },
        ipAddress,
        sessionId,
      );

      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get user's personal information and completion status with OAuth source tracking
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (user.length === 0) {
      // Log missing user error
      await audit.logSecurityEvent(
        session.user.id,
        "user_not_found_personal_info",
        {
          user_id: session.user.id,
          processing_duration_ms: Date.now() - startTime,
          ip_address: ipAddress,
        },
        ipAddress,
        sessionId,
      );

      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = user[0];

    // Enhanced response with OAuth source tracking
    const responseData = {
      success: true,
      personalInfo: {
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        phone_number: userData.phone_number || "",
        date_of_birth: userData.date_of_birth || "",
        pps_number: userData.pps_number || "",
        address_line_1: userData.address_line_1 || "",
        address_line_2: userData.address_line_2 || "",
        city: userData.city || "",
        county: userData.county || "",
        eircode: userData.eircode || "",
      },
      completionStatus: {
        personal_info_completed: userData.personal_info_completed || false,
        signature_completed: userData.signature_completed || false,
        legal_consent_completed: userData.legal_consent_completed || false,
        verification_completed: userData.verification_completed || false,
      },
      // New: OAuth source tracking for pre-population
      dataSource: {
        from_oauth: !!(
          userData.first_name &&
          userData.last_name &&
          userData.auth_provider === "google"
        ),
        provider: userData.auth_provider || null,
        last_updated: userData.updated_at,
        has_profile_photo: !!userData.profile_photo_url,
      },
    };

    // Log successful data retrieval with source information
    await audit.logUserAction(
      session.user.id,
      "personal_info_retrieved",
      "onboarding_data",
      session.user.id,
      {
        has_oauth_data: responseData.dataSource.from_oauth,
        provider: responseData.dataSource.provider,
        fields_available: Object.keys(responseData.personalInfo).filter(
          (key) => (responseData.personalInfo as any)[key] !== "",
        ),
        pre_population_ready: responseData.dataSource.from_oauth,
        processing_duration_ms: Date.now() - startTime,
        session_id: sessionId,
      },
      sessionId,
    );

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Personal info fetch error:", error);

    // Enhanced error logging
    await audit.logSecurityEvent(
      null,
      "personal_info_retrieval_failure",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        processing_duration_ms: Date.now() - startTime,
        ip_address: ipAddress,
      },
      ipAddress,
      sessionId,
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const sessionId = crypto.randomUUID();

  // Extract context for audit logging
  const ipAddress =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      // Log unauthorized save attempt
      await audit.logSecurityEvent(
        null,
        "unauthorized_personal_info_save",
        {
          processing_duration_ms: Date.now() - startTime,
          ip_address: ipAddress,
          user_agent: userAgent,
          attempted_resource: "onboarding_personal_info_save",
        },
        ipAddress,
        sessionId,
      );

      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const data = await request.json();

    console.log("Received data:", data);

    const {
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      ppsNumber,
      addressLine1,
      addressLine2,
      city,
      county,
      eircode,
    } = data;

    // Get current user data for security check and audit trail
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    console.log("Current user query result:", currentUser);

    if (!currentUser) {
      await audit.logSecurityEvent(
        session.user.id,
        "user_not_found_personal_info_save",
        {
          user_id: session.user.id,
          processing_duration_ms: Date.now() - startTime,
          ip_address: ipAddress,
        },
        ipAddress,
        sessionId,
      );

      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Security Check: Prevent OAuth email tampering
    const requestEmail = data.email; // Email from form submission
    const sessionEmail = session.user.email; // Email from authenticated session

    // Check if user is from OAuth and attempting to change email
    if (
      currentUser.auth_provider === "google" &&
      requestEmail &&
      requestEmail !== sessionEmail
    ) {
      // Log potential OAuth email tampering attempt
      await audit.logSecurityEvent(
        session.user.id,
        "oauth_email_tampering_attempt",
        {
          provider: currentUser.auth_provider,
          original_email_hash: Buffer.from(sessionEmail)
            .toString("base64")
            .slice(0, 10),
          attempted_email_hash: Buffer.from(requestEmail)
            .toString("base64")
            .slice(0, 10),
          session_id: sessionId,
          tampering_severity: "high",
          action_taken: "request_rejected",
        },
        ipAddress,
        sessionId,
      );

      return NextResponse.json(
        {
          error: "Email modification not allowed",
          details:
            "OAuth-verified email addresses cannot be changed for security reasons",
        },
        { status: 403 },
      );
    }

    // Enhanced validation using Zod schema
    const validationData = {
      name: `${firstName} ${lastName}`.trim(),
      email: sessionEmail, // Always use session email for OAuth users, form email for others
      phone: phoneNumber,
      date_of_birth: dateOfBirth,
      pps_number: ppsNumber || "",
      address_line_1: addressLine1,
      address_line_2: addressLine2 || "",
      city: city,
      county: county,
      eircode: eircode,
      country: "Ireland", // Always Ireland for Irish compliance
    };

    console.log("Validation data:", validationData);

    let validation;

    try {
      validation = onboardingPersonalInfoSchema.safeParse(validationData);
      console.log("Validation result:", validation);
    } catch (error) {
      console.error("Validation schema error:", error);
      throw error;
    }

    if (!validation.success) {
      // Log validation failure with details
      await audit.logUserAction(
        session.user.id,
        "personal_info_validation_failed",
        "onboarding_data",
        session.user.id,
        {
          validation_errors: validation.error.issues.map((err: any) => ({
            field: err.path.join("."),
            message: err.message,
            received_value: "[REDACTED]", // Don't log actual PII
          })),
          processing_duration_ms: Date.now() - startTime,
          session_id: sessionId,
        },
        sessionId,
      );

      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues.map((err: any) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }

    const oldData = {
      first_name: currentUser.first_name,
      last_name: currentUser.last_name,
      phone_number: currentUser.phone_number,
      date_of_birth: currentUser.date_of_birth,
      pps_number: currentUser.pps_number,
      address_line_1: currentUser.address_line_1,
      address_line_2: currentUser.address_line_2,
      city: currentUser.city,
      county: currentUser.county,
      eircode: currentUser.eircode,
      personal_info_completed: currentUser.personal_info_completed,
    };

    console.log("Old data:", oldData);

    const newData = {
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      date_of_birth: dateOfBirth,
      pps_number: ppsNumber || null,
      address_line_1: addressLine1 || null,
      address_line_2: addressLine2 || null,
      city: city || null,
      county: county || null,
      eircode: eircode || null,
      personal_info_completed: true,
    };

    console.log("New data:", newData);

    // Update user's personal information
    await db
      .update(users)
      .set({
        ...newData,
        personal_info_completed_at: new Date(),
        onboarding_current_step: "signature",
        updated_at: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // Log successful personal info save with data change tracking
    await audit.logDataChange(
      session.user.id,
      "update",
      "user_personal_info",
      session.user.id,
      oldData,
      newData,
      sessionId,
    );

    // Log completion of personal info step
    await audit.logUserAction(
      session.user.id,
      "personal_info_step_completed",
      "onboarding_progress",
      session.user.id,
      {
        completed_step: "personal_info",
        next_step: "signature",
        from_oauth_prepopulation: currentUser.auth_provider === "google",
        fields_changed: (() => {
          try {
            console.log("About to compare fields - oldData:", oldData);
            console.log("About to compare fields - newData:", newData);

            return (Object.keys(newData) as (keyof typeof newData)[]).filter(
              (key) => oldData[key] !== newData[key],
            );
          } catch (error) {
            console.error("Error in fields comparison:", error);

            return [];
          }
        })(),
        irish_compliance_validated: true,
        processing_duration_ms: Date.now() - startTime,
        session_id: sessionId,
      },
      sessionId,
    );

    return NextResponse.json({
      success: true,
      message: "Personal information saved successfully",
    });
  } catch (error) {
    console.error("Personal info save error:", error);

    // Enhanced error logging
    await audit.logSecurityEvent(
      null,
      "personal_info_save_failure",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        processing_duration_ms: Date.now() - startTime,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
      ipAddress,
      sessionId,
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
