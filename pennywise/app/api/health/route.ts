import { NextResponse } from 'next/server'

const ok = <T>(data: T) => NextResponse.json({ data })

export async function GET() {
  return ok({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
