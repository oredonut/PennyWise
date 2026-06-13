// ============================================================
// Shared, pure formatting helpers for API route view-models.
// No DB access, no side effects. Used by dashboard + insights to
// produce the exact shapes mobile/API_CONTRACT.md expects.
// ============================================================

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// getUTCDay(): 0 = Sunday … 6 = Saturday
const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// Monday-first week, one letter per slot (Mon→Sun): M T W T F S S
const WEEK_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function monthName(monthIndex: number): string {
  return MONTH_NAMES[((monthIndex % 12) + 12) % 12]
}

export function dayAbbrUTC(d: Date): string {
  return DAY_ABBR[d.getUTCDay()]
}

export function capitalizeFirst(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)
}

/** "₦1,600" — naira with thousands separators, no decimals. */
export function formatNaira(n: number): string {
  return `₦${numberWithCommas(n)}`
}

/** "1,600" — number with thousands separators, no ₦, no decimals. */
export function numberWithCommas(n: number): string {
  const safe = Number.isFinite(n) ? Math.round(n) : 0
  return safe.toLocaleString('en-NG')
}

// Keyword → emoji. First substring match (case-insensitive) wins; order matters.
const EMOJI_MAP: ReadonlyArray<readonly [string, string]> = [
  ['food', '🍛'], ['feeding', '🍛'],
  ['transport', '🚌'],
  ['data', '📱'], ['airtime', '📱'],
  ['leisure', '🎲'], ['hangout', '🎲'], ['fun', '🎲'],
  ['groceries', '🛒'],
  ['rent', '🏠'],
  ['savings', '💰'],
  ['subscription', '📺'],
  ['school', '📚'],
  ['misc', '⚙️'], ['other', '⚙️'],
]

export function categoryEmoji(name: string | null | undefined): string {
  const n = (name ?? '').toLowerCase()
  for (const [keyword, emoji] of EMOJI_MAP) {
    if (n.includes(keyword)) return emoji
  }
  return '💳'
}

const INCOME_KEYWORDS = ['income', 'salary', 'allowance', 'savings']

/** Inferred from category name until a real `type` column exists (see MIGRATION_NOTES.md). */
export function transactionType(categoryName: string | null | undefined): 'expense' | 'income' {
  const n = (categoryName ?? '').toLowerCase()
  return INCOME_KEYWORDS.some((k) => n.includes(k)) ? 'income' : 'expense'
}

/** First name from metadata full_name, else capitalised email prefix, else "there". */
export function firstNameFrom(fullName: string | null | undefined, email: string | null | undefined): string {
  const fn = (fullName ?? '').trim()
  if (fn) return capitalizeFirst(fn.split(/\s+/)[0])
  const prefix = (email ?? '').split('@')[0] ?? ''
  return prefix ? capitalizeFirst(prefix) : 'there'
}

/** Relative time + nothing else: "5m ago" / "2h ago" / "Yesterday" / "14 Jun". */
export function relativeTime(createdAtIso: string, now: Date = new Date()): string {
  const created = new Date(createdAtIso)
  const diffMs = now.getTime() - created.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return `${Math.max(diffMin, 0)}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const startToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const startCreated = Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), created.getUTCDate())
  const dayDiff = Math.round((startToday - startCreated) / 86_400_000)
  if (dayDiff === 1) return 'Yesterday'
  return `${created.getUTCDate()} ${MONTH_ABBR[created.getUTCMonth()]}`
}

export type WeekDay = { date: Date; key: string; letter: string; isToday: boolean }

/** The 7 days of the current week (Mon→Sun) with day letters and today flag. */
export function currentWeekDays(now: Date = new Date()): WeekDay[] {
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const offsetFromMonday = (todayStart.getUTCDay() + 6) % 7 // 0 when today is Monday
  const monday = new Date(todayStart)
  monday.setUTCDate(monday.getUTCDate() - offsetFromMonday)

  const days: WeekDay[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setUTCDate(monday.getUTCDate() + i)
    days.push({
      date,
      key: date.toISOString().slice(0, 10),
      letter: WEEK_LETTERS[i],
      isToday: date.getTime() === todayStart.getTime(),
    })
  }
  return days
}
