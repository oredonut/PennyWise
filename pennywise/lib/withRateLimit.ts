import { NextRequest, NextResponse } from 'next/server'
import { standardLimiter, ocrLimiter, authLimiter } from './rateLimit'

export function applyRateLimit(
  request: NextRequest,
  type: 'standard' | 'ocr' | 'auth' = 'standard'
): NextResponse | null {
  const ip =
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'

  const limiter = type === 'ocr' ? ocrLimiter : type === 'auth' ? authLimiter : standardLimiter

  const result = limiter(ip)
  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', code: 'rate_limited' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) },
      }
    )
  }
  return null
}
