import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/db/db";
import { auditEvents } from "@/db/schema";
import { getSession } from "@/lib/auth";

interface AuditContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  email?: string;
}

interface AuditLogData {
  eventType: string;
  eventAction: string;
  resourceType?: string;
  resourceId?: string;
  eventData?: any;
  oldData?: any;
  newData?: any;
}

class AuditLogger {
  private static instance: AuditLogger;

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }

    return AuditLogger.instance;
  }

  async logEvent(context: AuditContext, data: AuditLogData): Promise<void> {
    try {
      // Set database context for triggers
      if (context.userId) {
        await db.execute(sql`SET app.current_user_id = ${context.userId}`);
      }
      if (context.sessionId) {
        await db.execute(
          sql`SET app.current_session_id = ${context.sessionId}`,
        );
      }

      await db.insert(auditEvents).values({
        user_id: context.userId,
        event_type: data.eventType,
        event_action: data.eventAction,
        resource_type: data.resourceType,
        resource_id: data.resourceId,
        event_data: data.eventData ? JSON.stringify(data.eventData) : null,
        old_data: data.oldData ? JSON.stringify(data.oldData) : null,
        new_data: data.newData ? JSON.stringify(data.newData) : null,
        ip_address: context.ipAddress,
        user_agent: context.userAgent || null,
        session_id: context.sessionId || null,
      });
    } catch (error) {
      // Log audit failures but don't break the main operation
      console.error("Audit logging failed:", error);
    }
  }

  async logApiRequest(
    request: NextRequest,
    response: NextResponse,
    context: AuditContext,
    responseData?: any,
  ): Promise<void> {
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    // Determine resource type and action from URL
    const pathParts = pathname.split("/").filter(Boolean);
    const resourceType = this.extractResourceType(pathParts);
    const resourceId = this.extractResourceId(pathParts);
    const action = this.mapHttpMethodToAction(method);

    // Get request body if available
    let requestData = null;

    try {
      if (["POST", "PUT", "PATCH"].includes(method)) {
        // Note: request.json() can only be called once, so this should be called
        // by the middleware before the actual handler
        const body = await request.text();

        if (body) {
          requestData = JSON.parse(body);
        }
      }
    } catch (error) {
      // Ignore parsing errors
    }

    await this.logEvent(context, {
      eventType: "api_request",
      eventAction: `${method.toLowerCase()}_${resourceType}`,
      resourceType: resourceType,
      resourceId: resourceId,
      eventData: {
        method,
        pathname,
        query: Object.fromEntries(url.searchParams.entries()),
        statusCode: response.status,
        requestData,
        responseData: response.status < 400 ? responseData : null,
      },
    });
  }

  public extractResourceType(pathParts: string[]): string {
    if (pathParts.includes("api")) {
      const apiIndex = pathParts.indexOf("api");

      return pathParts[apiIndex + 1] || "unknown";
    }

    return pathParts[0] || "unknown";
  }

  private extractResourceId(pathParts: string[]): string | undefined {
    // Look for UUID pattern or numeric ID
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const numericPattern = /^\d+$/;

    for (const part of pathParts) {
      if (uuidPattern.test(part) || numericPattern.test(part)) {
        return part;
      }
    }

    return undefined;
  }

  private mapHttpMethodToAction(method: string): string {
    const actionMap: Record<string, string> = {
      GET: "read",
      POST: "create",
      PUT: "update",
      PATCH: "update",
      DELETE: "delete",
    };

    return actionMap[method] || "unknown";
  }
}

// Middleware function for Next.js API routes
export async function auditMiddleware(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
): Promise<NextResponse> {
  const auditor = AuditLogger.getInstance();
  let context: AuditContext = {};

  try {
    // Extract context
    context.ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    context.userAgent = request.headers.get("user-agent") || "unknown";

    // Get session information
    try {
      const session = await getSession();

      if (session?.user) {
        context.email = session.user.email || undefined;
        context.sessionId = crypto.randomUUID(); // Generate session ID for tracking
        // You'd need to get user ID from email if not in session
        if (session.user.id) {
          context.userId = session.user.id;
        }
      }
    } catch (error) {
      // Session might not be available for all requests
    }

    // Execute the actual handler
    const response = await handler(request);

    // Log successful requests
    if (response.status < 400) {
      let responseData = null;

      try {
        const responseText = await response.clone().text();

        if (responseText) {
          responseData = JSON.parse(responseText);
        }
      } catch (error) {
        // Ignore parsing errors
      }

      await auditor.logApiRequest(request, response, context, responseData);
    } else {
      // Log error responses
      await auditor.logEvent(context, {
        eventType: "api_error",
        eventAction: `${request.method.toLowerCase()}_error`,
        resourceType: auditor.extractResourceType(
          request.url.split("/").filter(Boolean),
        ),
        eventData: {
          method: request.method,
          pathname: new URL(request.url).pathname,
          statusCode: response.status,
          error: "Request failed",
        },
      });
    }

    return response;
  } catch (error) {
    // Log system errors
    await auditor.logEvent(context, {
      eventType: "system_error",
      eventAction: "request_processing_error",
      eventData: {
        error: error instanceof Error ? error.message : "Unknown error",
        method: request.method,
        pathname: new URL(request.url).pathname,
      },
    });

    // Re-throw the error
    throw error;
  }
}

// Utility functions for manual logging
export const audit = {
  logUserAction: async (
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    data?: any,
    sessionId?: string,
  ) => {
    const auditor = AuditLogger.getInstance();

    await auditor.logEvent(
      { userId, sessionId },
      {
        eventType: "user_action",
        eventAction: action,
        resourceType,
        resourceId,
        eventData: data,
      },
    );
  },

  logDataChange: async (
    userId: string,
    action: "create" | "update" | "delete",
    resourceType: string,
    resourceId: string,
    oldData?: any,
    newData?: any,
    sessionId?: string,
  ) => {
    const auditor = AuditLogger.getInstance();

    await auditor.logEvent(
      { userId, sessionId },
      {
        eventType: "data_change",
        eventAction: action,
        resourceType,
        resourceId,
        oldData,
        newData,
      },
    );
  },

  logSecurityEvent: async (
    userId: string | null,
    event: string,
    details: any,
    ipAddress?: string,
    sessionId?: string,
  ) => {
    const auditor = AuditLogger.getInstance();

    await auditor.logEvent(
      { userId: userId || undefined, ipAddress, sessionId },
      {
        eventType: "security",
        eventAction: event,
        resourceType: "system",
        eventData: details,
      },
    );
  },
};

export default AuditLogger;
