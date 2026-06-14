// ============================================================
// Offline transaction queue.
//
// When a transaction can't be POSTed because the device is offline,
// we stash its payload in AsyncStorage and replay it once connectivity
// returns (see lib/netInfo.ts → useNetworkSync).
//
// Every mutation emits 'pennywise:queueChanged' on the DeviceEventEmitter
// bus so UI (the FAB badge) can re-read the pending count reactively —
// mirroring the existing 'transactionAdded' pattern used across screens.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { apiPost, ApiError } from '../hooks/useApi';

const QUEUE_KEY = '@pennywise_offline_queue';

/** Emitted whenever the queue is persisted; carries the new length. */
export const QUEUE_CHANGED_EVENT = 'pennywise:queueChanged';

export type QueuedTransaction = {
  id: string; // local id for dedup
  payload: {
    name: string;
    amount: number;
    type: string;
    categoryId: string;
    occurredAt: string;
  };
  queuedAt: string; // ISO timestamp
};

// No uuid dependency in this project — a timestamp + random suffix is
// collision-safe enough for a single-device dedup key.
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Persist the queue and notify listeners of the new length. */
async function save(queue: QueuedTransaction[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  DeviceEventEmitter.emit(QUEUE_CHANGED_EVENT, queue.length);
}

export async function getQueue(): Promise<QueuedTransaction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedTransaction[]) : [];
  } catch {
    // Corrupt/unparseable storage → treat as empty rather than crash.
    return [];
  }
}

export async function enqueue(payload: QueuedTransaction['payload']): Promise<void> {
  const queue = await getQueue();
  queue.push({ id: genId(), payload, queuedAt: new Date().toISOString() });
  await save(queue);
}

export async function clearQueue(): Promise<void> {
  await save([]);
}

/**
 * Replay every queued transaction. Items that POST successfully are
 * dropped; items that fail are kept for the next attempt. Returns the
 * tally so callers can decide whether to surface a toast.
 */
export async function flush(
  onProgress?: (done: number, total: number) => void
): Promise<{ synced: number; failed: number }> {
  const queue = await getQueue();
  const total = queue.length;
  if (total === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: QueuedTransaction[] = [];

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    try {
      await apiPost('/api/transactions', item.payload);
      synced++;
    } catch {
      failed++;
      remaining.push(item);
    }
    onProgress?.(i + 1, total);
  }

  await save(remaining);
  return { synced, failed };
}

/**
 * True when an error means "the request never reached the server"
 * (i.e. offline) — as opposed to the server responding with an error.
 * `apiPost` throws an `ApiError` only after a real HTTP response, so any
 * other thrown error (a `fetch` TypeError) is treated as a network drop.
 */
export function isNetworkError(e: unknown): boolean {
  if (e instanceof ApiError) return false; // server answered → not offline
  if (e instanceof TypeError) return true; // fetch() rejected → offline
  const msg = e instanceof Error ? e.message.toLowerCase() : '';
  return msg.includes('network') || msg.includes('fetch');
}
