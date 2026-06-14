// ============================================================
// Client-side mirror of the backend auto-categorization (see
// pennywise/lib/constants.ts + pennywise/lib/categorization/engine.ts).
// Kept in sync by hand so the OCR confirm screen can pre-categorize
// instantly without a round-trip. The backend remains the source of
// truth — it re-categorizes on write.
// ============================================================

/** Keyword → bucket map from prd.md (Auto-Categorization). */
export const MERCHANT_CATEGORIES: Record<string, string[]> = {
  food: [
    'shoprite', 'chicken republic', 'dominos', 'mr biggs', 'tantalizers',
    'eatery', 'restaurant', 'shawarma', 'bukka',
  ],
  transport: ['uber', 'bolt', 'danfo', 'lagbus', 'terminal', 'park'],
  data: ['mtn', 'airtel', 'glo', '9mobile', 'spectranet'],
  leisure: ['cinema', 'netflix', 'spotify', 'games', 'sport'],
};

/** Bucket a merchant name falls into; unmatched → 'misc' (mirrors engine.ts). */
export function categorize(merchantName: string): string {
  const lower = merchantName.toLowerCase();
  for (const [category, keywords] of Object.entries(MERCHANT_CATEGORIES)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return 'misc';
}
