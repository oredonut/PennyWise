// ============================================================
// Shared per-item validation + contract-field → DB-column mapping for
// transaction writes. Used by BOTH POST /api/transactions (single) and
// POST /api/transactions/bulk so the two can never drift apart.
//
// Contract field names (categoryId, name, type, occurredAt, amount) come from
// API_CONTRACT.md / the mobile client; the columns they map to are different.
// ============================================================

export type TransactionType = 'expense' | 'income'

// The mapped row, minus server-owned fields (user_id, source) which the calling
// route supplies — single = 'manual', bulk/OCR = 'screenshot'.
export type MappedTransaction = {
  category_id: string
  amount: string
  merchant_raw: string | null
  type: TransactionType
  occurred_at: string
}

export type ParsedTransaction =
  | { ok: true; row: MappedTransaction; categoryId: string; amount: number }
  | { ok: false; error: string }

// Shared SELECT list returned to the client after an insert.
export const TRANSACTION_SELECT =
  'id, category_id, amount, type, merchant_raw, note, source, occurred_at, created_at'

export function parseTransactionInput(raw: unknown): ParsedTransaction {
  const body = (raw ?? {}) as {
    categoryId?: unknown
    amount?: unknown
    name?: unknown
    type?: unknown
    occurredAt?: unknown
  }

  if (typeof body.categoryId !== 'string' || !body.categoryId) {
    return { ok: false, error: 'categoryId is required' }
  }
  if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount <= 0) {
    return { ok: false, error: 'amount must be a positive number' }
  }
  const type = (body.type ?? 'expense') as TransactionType
  if (type !== 'expense' && type !== 'income') {
    return { ok: false, error: "type must be 'expense' or 'income'" }
  }
  let occurredAt = new Date().toISOString()
  if (body.occurredAt != null) {
    const parsed = new Date(body.occurredAt as string)
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: 'occurredAt must be a valid ISO-8601 date' }
    }
    occurredAt = parsed.toISOString()
  }
  const name = typeof body.name === 'string' ? body.name.trim() : ''

  return {
    ok: true,
    categoryId: body.categoryId,
    amount: body.amount,
    row: {
      category_id: body.categoryId,
      amount: String(body.amount),
      merchant_raw: name || null,
      type,
      occurred_at: occurredAt,
    },
  }
}
