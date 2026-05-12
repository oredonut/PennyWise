import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

interface ExtractedTransaction {
  amount: number
  merchant: string
  date: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return err('Expected multipart/form-data', 'invalid_body', 400)
    }

    const file = form.get('image')
    if (!(file instanceof File)) return err('image file is required', 'invalid_input', 400)

    const buffer = await file.arrayBuffer()
    const imageBase64 = Buffer.from(buffer).toString('base64')
    const mediaType = file.type || 'image/jpeg'

    const { data, error: fnError } = await supabase.functions.invoke<ExtractedTransaction[]>(
      'process-screenshot',
      { body: { imageBase64, mediaType } },
    )

    if (fnError) return err(fnError.message, 'edge_fn_error', 502)
    return ok(data)
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
