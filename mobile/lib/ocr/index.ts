// ============================================================
// Public API for the OCR transaction parser. Feed OCR blocks
// in, get a structured ParseResult out. The single entry point
// the rest of the app should import.
// ============================================================

import { detectApp } from './detector'
import { parseGeneric } from './parsers/generic'
import { parseOpay } from './parsers/opay'
import { parsePalmpay } from './parsers/palmpay'
import { parseKuda } from './parsers/kuda'
import { parseMoniepoint } from './parsers/moniepoint'
import type { DetectedApp, ExtractedTransaction, OcrBlock, ParseResult } from './types'

type Parser = (blocks: OcrBlock[]) => ExtractedTransaction[]

export function parseOcrBlocks(blocks: OcrBlock[]): ParseResult {
  const app = detectApp(blocks)
  const parsers: Record<DetectedApp, Parser> = {
    opay: parseOpay,
    palmpay: parsePalmpay,
    kuda: parseKuda,
    moniepoint: parseMoniepoint,
    gtbank: parseGeneric,
    access: parseGeneric,
    uba: parseGeneric,
    generic: parseGeneric,
  }
  const transactions = parsers[app](blocks)
  return { app, transactions, debugBlocks: blocks }
}

export type { OcrBlock, ExtractedTransaction, ParseResult, DetectedApp } from './types'
