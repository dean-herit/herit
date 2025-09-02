/**
 * Route Analyzer - Detects available HTTP handlers in API routes
 * Used to ensure tests only call handlers that actually exist
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface RouteHandlers {
  GET?: boolean;
  POST?: boolean;
  PUT?: boolean;
  DELETE?: boolean;
  PATCH?: boolean;
}

export interface RouteInfo {
  path: string;
  handlers: RouteHandlers;
  requiresAuth?: boolean;
  hasParams?: boolean;
  paramNames?: string[];
}

/**
 * Analyze a route file to detect available HTTP handlers
 */
export function analyzeRouteFile(routePath: string): RouteHandlers {
  try {
    const content = readFileSync(routePath, 'utf-8');
    
    const handlers: RouteHandlers = {};
    
    // Look for exported handler functions
    if (content.includes('export const GET') || content.includes('export async function GET')) {
      handlers.GET = true;
    }
    if (content.includes('export const POST') || content.includes('export async function POST')) {
      handlers.POST = true;
    }
    if (content.includes('export const PUT') || content.includes('export async function PUT')) {
      handlers.PUT = true;
    }
    if (content.includes('export const DELETE') || content.includes('export async function DELETE')) {
      handlers.DELETE = true;
    }
    if (content.includes('export const PATCH') || content.includes('export async function PATCH')) {
      handlers.PATCH = true;
    }
    
    return handlers;
  } catch (error) {
    console.warn(`Could not analyze route file ${routePath}:`, error);
    return {};
  }
}

/**
 * Detect if a route requires authentication by checking for auth imports/usage
 */
export function routeRequiresAuth(routePath: string): boolean {
  try {
    const content = readFileSync(routePath, 'utf-8');
    return content.includes('getSession') || 
           content.includes('requireAuth') || 
           content.includes('auth') ||
           content.includes('session');
  } catch (error) {
    return false;
  }
}

/**
 * Detect if route uses dynamic parameters like [id]
 */
export function routeHasParams(routePath: string): { hasParams: boolean; paramNames: string[] } {
  const paramNames: string[] = [];
  const segments = routePath.split('/');
  
  for (const segment of segments) {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      paramNames.push(segment.slice(1, -1));
    }
  }
  
  return {
    hasParams: paramNames.length > 0,
    paramNames
  };
}

/**
 * Get comprehensive route information
 */
export function getRouteInfo(routePath: string): RouteInfo {
  const handlers = analyzeRouteFile(routePath);
  const requiresAuth = routeRequiresAuth(routePath);
  const { hasParams, paramNames } = routeHasParams(routePath);
  
  return {
    path: routePath,
    handlers,
    requiresAuth,
    hasParams,
    paramNames
  };
}

/**
 * Cache for route analysis results
 */
const routeAnalysisCache = new Map<string, RouteInfo>();

/**
 * Get cached route info or analyze if not cached
 */
export function getCachedRouteInfo(routePath: string): RouteInfo {
  if (routeAnalysisCache.has(routePath)) {
    return routeAnalysisCache.get(routePath)!;
  }
  
  const info = getRouteInfo(routePath);
  routeAnalysisCache.set(routePath, info);
  return info;
}

/**
 * Helper to convert route path to actual file path
 */
export function getRouteFilePath(apiPath: string): string {
  // Convert /api/auth/login to app/api/auth/login/route.ts
  return join(process.cwd(), 'app', apiPath, 'route.ts');
}

/**
 * Analyze all common API route patterns
 */
export const commonRoutes = [
  '/api/auth/login',
  '/api/auth/register', 
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/google',
  '/api/auth/github',
  '/api/users/profile',
  '/api/assets',
  '/api/assets/[id]',
  '/api/beneficiaries',
  '/api/beneficiaries/[id]',
  '/api/beneficiaries/photo',
  '/api/beneficiaries/count',
  '/api/documents',
  '/api/documents/[id]',
  '/api/documents/upload',
  '/api/onboarding/personal-info',
  '/api/onboarding/signature',
  '/api/onboarding/legal-consent',
  '/api/onboarding/consent-signature',
  '/api/onboarding/verification',
  '/api/will',
  '/api/health',
  '/api/debug-user',
  '/api/debug/verification',
  '/api/rules/validate-allocation',
  '/api/rules/[id]',
  '/api/stripe/webhook',
  '/api/stripe/identity/session',
] as const;