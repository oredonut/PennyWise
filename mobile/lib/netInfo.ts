// ============================================================
// Connectivity watcher. Mounted once at the app root, it drains the
// offline transaction queue whenever the device (re)gains a connection
// and reports how many synced via a toast.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

import { flush } from './offlineQueue';
import { showToast } from './toast';

export function useNetworkSync(): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState(true);

  // `null` until the first NetInfo event. Tracking the previous state
  // lets us flush on the offline→online transition. It also flushes on
  // the very first event (prev === null), which drains any queue left
  // over from a previous session at launch.
  const wasConnected = useRef<boolean | null>(null);
  const flushing = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected === true;
      setIsConnected(connected);

      const justCameOnline = connected && wasConnected.current !== true;
      wasConnected.current = connected;

      if (!justCameOnline || flushing.current) return;

      flushing.current = true;
      flush()
        .then(({ synced }) => {
          if (synced > 0) {
            showToast(`${synced} transaction${synced === 1 ? '' : 's'} synced`);
          }
        })
        .catch(() => {
          // Best-effort — failures stay queued for the next reconnection.
        })
        .finally(() => {
          flushing.current = false;
        });
    });

    return () => unsubscribe();
  }, []);

  return { isConnected };
}
