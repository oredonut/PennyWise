import { type NextRequest, NextResponse } from 'next/server'
import { applyRateLimit } from '@/lib/withRateLimit'

const ok = <T>(data: T) => NextResponse.json({ data })

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 'standard')
  if (limited) return limited

  return ok({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
