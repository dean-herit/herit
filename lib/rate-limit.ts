import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  limit: number // Maximum requests allowed in the interval
}

interface RateLimitStore {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// In production, consider using Redis or similar
const rateLimitStore = new Map<string, RateLimitStore>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  const entries = Array.from(rateLimitStore.entries())
  for (const [key, value] of entries) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export function getRateLimitKey(request: NextRequest, prefix: string = 'rl'): string {
  // Get IP from headers (considering proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  
  return `${prefix}:${ip}`
}

export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = { interval: 60000, limit: 10 } // Default: 10 requests per minute
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = getRateLimitKey(request)
  const now = Date.now()
  
  const current = rateLimitStore.get(key)
  
  if (!current || current.resetTime < now) {
    // Create new entry
    const resetTime = now + config.interval
    rateLimitStore.set(key, { count: 1, resetTime })
    return { success: true, remaining: config.limit - 1, reset: resetTime }
  }
  
  if (current.count >= config.limit) {
    // Rate limit exceeded
    return { success: false, remaining: 0, reset: current.resetTime }
  }
  
  // Increment count
  current.count++
  rateLimitStore.set(key, current)
  
  return { 
    success: true, 
    remaining: config.limit - current.count, 
    reset: current.resetTime 
  }
}

export function createRateLimitResponse(
  message: string = 'Too many requests',
  reset: number
): NextResponse {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000)
  
  return NextResponse.json(
    { error: message },
    { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': retryAfter.toString()
      }
    }
  )
}

// Higher-order function to wrap API routes with rate limiting
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { success, remaining, reset } = await rateLimit(request, config)
    
    if (!success) {
      return createRateLimitResponse('Too many requests. Please try again later.', reset)
    }
    
    const response = await handler(request)
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', (config?.limit || 10).toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', reset.toString())
    
    return response
  }
}