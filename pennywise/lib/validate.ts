// ============================================================
// Shared input validators for API route bodies. Each returns the
// cleaned value on success or null on failure, so callers can do:
//   const name = validate.string(body.name, 100)
//   if (name === null) return err(...)
// ============================================================

export const validate = {
  string: (v: unknown, max = 500): string | null => {
    if (typeof v !== 'string') return null
    const t = v.trim()
    return t.length > 0 && t.length <= max ? t : null
  },
  number: (v: unknown, min = 0, max = 10_000_000): number | null => {
    const n = Number(v)
    return isFinite(n) && n >= min && n <= max ? n : null
  },
  enum: <T extends string>(v: unknown, values: T[]): T | null => {
    return values.includes(v as T) ? (v as T) : null
  },
}
