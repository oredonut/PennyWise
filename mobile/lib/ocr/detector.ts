// ============================================================
// App detection: which Nigerian payment app produced the
// screenshot, based on brand signatures in the OCR text.
// ============================================================

import type { DetectedApp, OcrBlock } from './types'

export function detectApp(blocks: OcrBlock[]): DetectedApp {
  // Pad with spaces so single-token signatures like ' uba ' still match
  // when the token sits at the very start or end of the joined text.
  const text = ` ${blocks.map((b) => b.text).join(' ').toLowerCase()} `

  if (text.includes('opay') || text.includes('o-pay') || text.includes('opay.com')) return 'opay'
  if (text.includes('palmpay') || text.includes('palm pay')) return 'palmpay'
  if (text.includes('kuda')) return 'kuda'
  if (text.includes('moniepoint') || text.includes('monie point')) return 'moniepoint'
  if (text.includes('gtbank') || text.includes('guaranty trust') || text.includes('gtco')) return 'gtbank'
  if (text.includes('access bank') || text.includes('accessbank')) return 'access'
  if (text.includes('united bank') || text.includes(' uba ')) return 'uba'
  return 'generic'
}
