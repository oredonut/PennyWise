// TODO(timezone): switch these UTC month boundaries to Africa/Lagos once the
// backend stores user-local business dates consistently.

export interface UtcMonthRange {
  startIso: string
  endIso: string
  daysElapsed: number
  daysInMonth: number
  todayIsoDate: string
}

export function getUtcMonthRange(reference = new Date()): UtcMonthRange {
  const year = reference.getUTCFullYear()
  const month = reference.getUTCMonth()
  const day = reference.getUTCDate()

  const start = new Date(Date.UTC(year, month, 1))
  const end = new Date(Date.UTC(year, month + 1, 1))
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    daysElapsed: Math.min(Math.max(day, 1), daysInMonth),
    daysInMonth,
    todayIsoDate: reference.toISOString().slice(0, 10),
  }
}

export function getUtcDateKey(reference = new Date()): string {
  return reference.toISOString().slice(0, 10)
}

export function addUtcDays(reference: Date, days: number): Date {
  const shifted = new Date(reference)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted
}

export function getMonthKey(reference = new Date()): string {
  return `${reference.getUTCFullYear()}-${String(reference.getUTCMonth() + 1).padStart(2, '0')}`
}
