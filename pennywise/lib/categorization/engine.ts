import { MERCHANT_CATEGORIES } from '@/lib/constants'
import { applyUserMerchantMap } from './merchant-map'

// Type-only import: erased at compile time, so this module gains no
// runtime dependency on next/headers and the unit tests stay pure.
type DbClient = Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>

export function categorize(merchantName: string): string {
  const lower = merchantName.toLowerCase()
  for (const [category, keywords] of Object.entries(MERCHANT_CATEGORIES)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category
    }
  }
  return 'misc'
}

/**
 * User-aware categorization: the user's trained merchant_map wins over the
 * built-in keyword list. Returns the mapped category_id when a trained
 * keyword matches, otherwise falls back to the keyword-list bucket.
 */
export async function categorizeForUser(
  merchantName: string,
  userId: string,
  supabase: DbClient
): Promise<string> {
  const { data } = await supabase
    .from('merchant_map')
    .select('merchant_keyword, category_id')
    .eq('user_id', userId)

  return applyUserMerchantMap(merchantName, data ?? []) ?? categorize(merchantName)
}
