import { useState, useEffect } from 'react';
import { flushOfflineSync } from './offlineSync';

// Global singleton network listener
type NetworkListener = (online: boolean) => void;
const listeners = new Set<NetworkListener>();

let currentOnlineState = typeof navigator !== 'undefined' ? navigator.onLine : true;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Network] Internet connection restored. Triggering auto-sync...');
    currentOnlineState = true;
    listeners.forEach((l) => l(true));
    // Trigger automatic background flush when back online
    flushOfflineSync().catch((err) => {
      console.warn('[Network] Auto-sync flush error:', err);
    });
  });

  window.addEventListener('offline', () => {
    console.warn('[Network] Internet connection lost. Entering offline mode...');
    currentOnlineState = false;
    listeners.forEach((l) => l(false));
  });
}

export const getIsOnline = (): boolean => currentOnlineState;

export const setNetworkOfflineExplicit = (offline: boolean) => {
  currentOnlineState = !offline;
  listeners.forEach((l) => l(!offline));
};

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(currentOnlineState);

  useEffect(() => {
    const handler: NetworkListener = (status) => setIsOnline(status);
    listeners.add(handler);
    setIsOnline(currentOnlineState);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
}
