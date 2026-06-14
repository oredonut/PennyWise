// ============================================================
// Lightweight toast bus. `showToast` can be called from anywhere
// (even outside React, e.g. inside an async submit handler); the
// <ToastHost> mounted at the app root renders the message.
//
// Built on DeviceEventEmitter — the same cross-component channel the
// app already uses for 'transactionAdded' — so no toast dependency is
// pulled in and it works identically on iOS and Android.
// ============================================================

import { DeviceEventEmitter } from 'react-native';

export const TOAST_EVENT = 'pennywise:toast';

export function showToast(message: string): void {
  DeviceEventEmitter.emit(TOAST_EVENT, message);
}
