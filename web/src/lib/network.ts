import { useState, useEffect } from 'react';
import { flushOfflineSync } from './offlineSync';

// Global singleton network listener
type NetworkListener = (online: boolean) => void;
const listeners = new Set<NetworkListener>();

const SIMULATED_OFFLINE_KEY = 'ayusync_simulated_offline';

const getInitialOnlineState = (): boolean => {
  if (typeof window !== 'undefined') {
    const isSimulatedOffline = sessionStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
    if (isSimulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
  return true;
};

let currentOnlineState = getInitialOnlineState();

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    // Only auto-restore if not manually simulated offline in this tab
    if (sessionStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true') return;
    console.log('[Network] Internet connection restored. Triggering auto-sync...');
    currentOnlineState = true;
    listeners.forEach((l) => l(true));
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

export const isSimulatedOffline = (): boolean => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
};

export const setNetworkOfflineExplicit = (offline: boolean) => {
  currentOnlineState = !offline;
  if (typeof window !== 'undefined') {
    if (offline) {
      sessionStorage.setItem(SIMULATED_OFFLINE_KEY, 'true');
    } else {
      sessionStorage.removeItem(SIMULATED_OFFLINE_KEY);
    }
  }
  listeners.forEach((l) => l(!offline));

  if (!offline) {
    console.log('[Network] Switched to Online. Triggering immediate offline-sync flush...');
    flushOfflineSync().catch((err) => {
      console.warn('[Network] Auto-sync flush error:', err);
    });
  }
};

export const toggleSimulatedOffline = (): boolean => {
  const current = getIsOnline();
  const nextOffline = current; // if online, become offline
  setNetworkOfflineExplicit(nextOffline);
  return !nextOffline;
};

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(currentOnlineState);
  const [isSimulated, setIsSimulated] = useState<boolean>(isSimulatedOffline());

  useEffect(() => {
    const handler: NetworkListener = (status) => {
      setIsOnline(status);
      setIsSimulated(isSimulatedOffline());
    };
    listeners.add(handler);
    setIsOnline(currentOnlineState);
    setIsSimulated(isSimulatedOffline());
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    isSimulated,
    toggleOffline: toggleSimulatedOffline
  };
}

