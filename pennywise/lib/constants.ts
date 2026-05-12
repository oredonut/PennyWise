export const DEFAULT_BUDGET_RATIOS = {
  food: 0.35,
  transport: 0.2,
  data: 0.15,
  leisure: 0.2,
  misc: 0.1,
} as const

/** Keyword → bucket map from `prd.md` (Auto-Categorization). Unmatched merchants → `misc` in code. */
export const MERCHANT_CATEGORIES: Record<string, string[]> = {
  food: [
    'shoprite',
    'chicken republic',
    'dominos',
    'mr biggs',
    'tantalizers',
    'eatery',
    'restaurant',
    'shawarma',
    'bukka',
  ],
  transport: ['uber', 'bolt', 'danfo', 'lagbus', 'terminal', 'park'],
  data: ['mtn', 'airtel', 'glo', '9mobile', 'spectranet'],
  leisure: ['cinema', 'netflix', 'spotify', 'games', 'sport'],
}

export const BUDGET_WARNING_THRESHOLD = 0.85

export const SCORE_THRESHOLDS = {
  green: 60,
  amber: 30,
} as const

export const SNACK_EQUIVALENTS = {
  food: 'shawarma',
  transport: 'danfo ride',
  data: 'data bundle',
  leisure: 'cinema ticket',
  misc: 'pure water',
} as const
