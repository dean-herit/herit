import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/db/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: {
      status: "connected" | "disconnected" | "error";
      latency?: number;
      error?: string;
    };
    authentication: {
      status: "operational" | "error";
      hasSecrets: boolean;
    };
    oauth?: {
      google: boolean;
      github: boolean;
    };
  };
  uptime: number;
}

// Track app start time for uptime calculation
const appStartTime = Date.now();

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    environment: env.NODE_ENV,
    services: {
      database: { status: "disconnected" },
      authentication: {
        status: "operational",
        hasSecrets: false,
      },
    },
    uptime: Date.now() - appStartTime,
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    const result = await db.execute(sql`SELECT 1 as health`);
    const dbLatency = Date.now() - dbStart;

    health.services.database = {
      status: "connected",
      latency: dbLatency,
    };
  } catch (error) {
    health.status = "degraded";
    health.services.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown database error",
    };
    logger.error("Health check: Database connection failed", error);
  }

  // Check authentication configuration
  health.services.authentication.hasSecrets = !!(
    env.SESSION_SECRET && env.SESSION_SECRET.length >= 32
  );

  if (!health.services.authentication.hasSecrets) {
    health.status = "degraded";
    health.services.authentication.status = "error";
  }

  // Check OAuth configuration (optional services)
  if (env.GOOGLE_CLIENT_ID || env.GITHUB_CLIENT_ID) {
    health.services.oauth = {
      google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      github: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
    };
  }

  // Determine overall health status
  if (
    health.services.database.status === "error" &&
    health.services.authentication.status === "error"
  ) {
    health.status = "unhealthy";
  }

  // Log health check
  const duration = Date.now() - startTime;

  logger.info("Health check completed", {
    status: health.status,
    duration: `${duration}ms`,
    database: health.services.database.status,
  });

  // Return appropriate status code based on health
  const statusCode =
    health.status === "healthy"
      ? 200
      : health.status === "degraded"
        ? 200
        : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Health-Status": health.status,
    },
  });
}

// Also support HEAD requests for simple monitoring
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}
