import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/webp']

interface OcrBody {
  image?: unknown
  media_type?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: OcrBody
    try {
      body = (await request.json()) as OcrBody
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    const image = typeof body.image === 'string' ? body.image : ''
    if (!image) return err('image must be a non-empty base64 string', 'invalid_input', 400)

    const mediaType = typeof body.media_type === 'string' ? body.media_type : ''
    if (!ALLOWED_MEDIA.includes(mediaType)) {
      return err(`media_type must be one of ${ALLOWED_MEDIA.join(', ')}`, 'invalid_input', 400)
    }

    // STUB — replace with real expo-ocr + parser in Phase 4.
    // Returns fixed mock extractions so the mobile OCR screen can be built and
    // tested end-to-end before the on-device OCR pipeline exists.
    const today = new Date().toISOString().slice(0, 10)
    return ok({
      transactions: [
        { amount: 2400, merchant: 'Chicken Republic', date: today },
        { amount: 850, merchant: 'Bolt', date: today },
      ],
      app_detected: 'generic',
    })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
