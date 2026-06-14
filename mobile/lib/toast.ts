// ============================================================
// Back-compat shim. The canonical toast lives in src/components/Toast.tsx
// (imperative, typed, single viewport). Existing callers import
// `showToast` from here; it forwards to Toast.show as an 'info' toast.
// ============================================================

import { Toast } from '../src/components/Toast';

export function showToast(message: string): void {
  Toast.show(message, 'info');
}
