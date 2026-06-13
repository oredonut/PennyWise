// ============================================================
// PennyWise — Currency formatting (single source of truth)
//
// Money is ALWAYS handled as a number internally. Never store or
// pass pre-formatted strings. Format only at the render boundary
// using these helpers so the ₦ symbol, thousands separators, and
// rounding stay consistent across every screen.
// ============================================================

const NAIRA = '₦';

/**
 * Format a numeric naira amount, e.g. 14248 -> "₦14,248".
 * Non-finite input degrades to "₦0" rather than crashing the UI.
 */
export function formatNaira(amount: number): string {
  if (!Number.isFinite(amount)) return `${NAIRA}0`;
  return `${NAIRA}${Math.round(amount).toLocaleString('en-NG')}`;
}

/**
 * Signed amount for transaction rows, e.g. income 5000 -> "+₦5,000",
 * expense 2400 -> "-₦2,400". Always uses the absolute value for display.
 */
export function formatNairaSigned(amount: number, type: 'income' | 'expense'): string {
  const sign = type === 'income' ? '+' : '-';
  return `${sign}${formatNaira(Math.abs(amount))}`;
}
