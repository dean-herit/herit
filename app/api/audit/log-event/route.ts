import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { auditEvents } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { event_type, event_action, resource_type, event_data } = await request.json();
    
    // Get session for user context (optional for client-side logging)
    let userId = null;
    try {
      const session = await getSession();
      if (session?.isAuthenticated) {
        userId = session.user.id;
      }
    } catch {
      // Session not required for client-side performance logging
    }

    // Extract context
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Log the event
    await db.insert(auditEvents).values({
      user_id: userId,
      event_type,
      event_action,
      resource_type,
      event_data: event_data || {},
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Audit logging error:", error);
    // Don't fail the main request if audit logging fails
    return NextResponse.json({ success: false, error: "Audit logging failed" }, { status: 200 });
  }
}

export const dynamic = "force-dynamic";