// ============================================================
// OCR domain types — the normalized shape our parser works against,
// deliberately decoupled from any native OCR library's output. The
// adapter (adapter.ts) maps a vendor result into these; the parser
// (parser.ts) only ever sees these. That separation keeps the parser
// pure and unit-testable without a native module.
// ============================================================

/** An axis-aligned rectangle in image-pixel space. */
export type OcrBounding = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** A single recognized line of text and where it sits on the image. */
export type OcrLine = {
  text: string;
  bounding: OcrBounding;
};

/** A recognized block — usually a paragraph-ish cluster of lines. */
export type OcrBlock = {
  text: string;
  bounding: OcrBounding;
  lines: OcrLine[];
};

/** One "description … amount" row read off a receipt. */
export type ReceiptLineItem = {
  description: string;
  amount: number;
};

/** What the parser distills a receipt's blocks down to. */
export type ParseResult = {
  merchant: string | null;
  total: number | null;
  currency: string | null; // e.g. 'NGN' when a ₦/NGN hint is present
  date: string | null; // ISO yyyy-mm-dd when a date is detected
  lineItems: ReceiptLineItem[];
  rawText: string; // every block's text, joined — for debugging / fallback
};
