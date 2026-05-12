import { MERCHANT_CATEGORIES } from '@/lib/constants'

export function categorize(merchantName: string): string {
  const lower = merchantName.toLowerCase()
  for (const [category, keywords] of Object.entries(MERCHANT_CATEGORIES)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category
    }
  }
  return 'misc'
}
