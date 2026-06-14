// ============================================================
// Shared types for the OCR transaction parser.
// Pure data shapes — no runtime, no native imports. The mobile
// app feeds OCR output (ML Kit / expo-ocr) into these shapes via
// a thin adapter, then calls parseOcrBlocks().
// ============================================================

export type OcrBounding = {
  top: number
  left: number
  width: number
  height: number
}

export type OcrLine = {
  text: string
  bounding: OcrBounding
}

export type OcrBlock = {
  text: string
  bounding: OcrBounding
  lines: OcrLine[]
}

export type DetectedApp =
  | 'opay'
  | 'palmpay'
  | 'kuda'
  | 'moniepoint'
  | 'gtbank'
  | 'access'
  | 'uba'
  | 'generic'

export type ExtractedTransaction = {
  amount: number // naira integer, always positive
  merchant: string | null
  date: string | null // ISO 8601 date string (YYYY-MM-DD)
  type: 'debit' | 'credit'
  confidence: 'high' | 'medium' | 'low'
  rawText: string // the block text it came from
}

export type ParseResult = {
  app: DetectedApp
  transactions: ExtractedTransaction[]
  debugBlocks: OcrBlock[] // pass-through for debug screen
}
