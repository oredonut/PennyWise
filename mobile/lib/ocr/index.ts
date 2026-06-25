// ============================================================
// OCR public surface.
//
//   • Pure path  — parseOcrBlocks / adaptMlkitResult / types are plain JS,
//     importable in Jest with no native module.
//   • Native path — extractFromImage runs real on-device OCR; it lazily
//     loads react-native-mlkit-ocr so the rest of this module still imports
//     cleanly in environments without the native binary.
// ============================================================

import { adaptMlkitResult } from './adapter';
import { parseOcrBlocks } from './parser';
import type { ParseResult } from './types';

export * from './types';
export { adaptMlkitResult } from './adapter';
export { parseOcrBlocks } from './parser';

/**
 * Run on-device OCR over an image and parse it into a ParseResult.
 * Throws if the native OCR module isn't present (e.g. Expo Go / web / Jest).
 */
export async function extractFromImage(imageUri: string): Promise<ParseResult> {
  // Dynamic import so the module tree-shakes in environments without native
  // modules — the parser above stays importable even when this would fail.
  const MlkitOcr = await import('react-native-mlkit-ocr').catch(() => null);

  // TEMP DEBUG: is the native OCR module loadable on this run?
  console.log('[ocr] MlkitOcr import →', MlkitOcr === null ? 'NULL (catch)' : 'resolved', {
    hasDefault: !!MlkitOcr && !!(MlkitOcr as any).default,
    hasDetect: !!MlkitOcr && typeof (MlkitOcr as any).default?.detectFromUri === 'function',
  });

  if (!MlkitOcr) {
    throw new Error('OCR module not available');
  }

  const raw = await MlkitOcr.default.detectFromUri(imageUri);
  const blocks = adaptMlkitResult(raw);
  return parseOcrBlocks(blocks);
}
