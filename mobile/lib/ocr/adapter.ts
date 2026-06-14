// ============================================================
// Vendor adapter: maps react-native-mlkit-ocr output into our normalized
// OcrBlock[]. ML Kit reports geometry as cornerPoints (four {x,y} corners);
// our parser wants an axis-aligned OcrBounding (top/left/width/height), so
// we take the min/max of the corners to build the enclosing rectangle.
// ============================================================

import { OcrBlock, OcrBounding, OcrLine } from './types';

function cornersToBounding(corners: Array<{ x: number; y: number }>): OcrBounding {
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}

export function adaptMlkitResult(raw: any[]): OcrBlock[] {
  return raw.flatMap((result) =>
    (result.blocks ?? [result]).map((block: any) => ({
      text: block.text ?? block.resultText ?? '',
      bounding: cornersToBounding(
        block.cornerPoints ??
          block.frame ?? [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
          ]
      ),
      lines: (block.lines ?? []).map((line: any) => ({
        text: line.text ?? '',
        bounding: cornersToBounding(line.cornerPoints ?? []),
      })),
    }))
  );
}
