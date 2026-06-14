import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ok = <T>(data: T) => NextResponse.json({ data })
const err = (error: string, code: string, status: number) =>
  NextResponse.json({ error, code }, { status })

type UpsertBody = {
  merchant_keyword?: unknown
  category_id?: unknown
}

// GET — every merchant_map row for the user, with the category name joined in.
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    const [mapResult, categoriesResult] = await Promise.all([
      supabase
        .from('merchant_map')
        .select('id, merchant_keyword, category_id')
        .eq('user_id', user.id),
      supabase.from('categories').select('id, name').eq('user_id', user.id),
    ])

    if (mapResult.error) return err(mapResult.error.message, 'db_error', 500)
    if (categoriesResult.error) return err(categoriesResult.error.message, 'db_error', 500)

    // Join in JS (merchant_map has no typed FK relationship to categories).
    const nameById = new Map<string, string>()
    for (const category of categoriesResult.data ?? []) {
      nameById.set(category.id, category.name)
    }

    const mappings = (mapResult.data ?? []).map((row) => ({
      id: row.id,
      merchant_keyword: row.merchant_keyword,
      category_id: row.category_id,
      category_name: nameById.get(row.category_id) ?? null,
    }))

    return ok({ mappings })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}

// POST — train a merchant → category override. Upsert keyed on
// (user_id, merchant_keyword): updates the category if the keyword already
// exists, inserts otherwise.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return err('Unauthorized', 'unauthorized', 401)

    let body: UpsertBody
    try {
      body = (await request.json()) as UpsertBody
    } catch {
      return err('Invalid JSON body', 'invalid_body', 400)
    }

    // Normalize the keyword to lowercase so the unique key dedups reliably.
    const merchantKeyword =
      typeof body.merchant_keyword === 'string' ? body.merchant_keyword.trim().toLowerCase() : ''
    const categoryId = typeof body.category_id === 'string' ? body.category_id.trim() : ''

    if (!merchantKeyword || !categoryId) {
      return err('merchant_keyword and category_id are required', 'invalid_input', 400)
    }

    const { error: upsertError } = await supabase
      .from('merchant_map')
      .upsert(
        { user_id: user.id, merchant_keyword: merchantKeyword, category_id: categoryId },
        { onConflict: 'user_id,merchant_keyword' }
      )

    if (upsertError) return err(upsertError.message, 'db_error', 500)

    return ok({ ok: true })
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Internal error', 'internal', 500)
  }
}
