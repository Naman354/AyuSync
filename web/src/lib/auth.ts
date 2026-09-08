export const AUTH_TOKEN_KEY = 'ayusync_token';
export const AUTH_USER_KEY = 'ayusync_user';

export interface AuthUser {
  id?: string;
  name?: string;
  phone?: string;
  role: 'DOCTOR' | 'WORKER' | 'PATIENT' | string;
  facilityId?: string;
  facilityName?: string;
  patientId?: string;
  workerId?: string;
  [key: string]: any;
}

// ── One-time legacy migration for the active tab ──────────────────────────────
// If this tab doesn't have a session in sessionStorage yet, check if there is an
// existing legacy session in localStorage from previous single-tab usage.
// Copy it to sessionStorage, then remove it from localStorage so that subsequent
// tabs opened for demo purposes have their own clean, independent sessions.
if (typeof window !== 'undefined') {
  try {
    const sessionToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!sessionToken) {
      const legacyToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (legacyToken) {
        sessionStorage.setItem(AUTH_TOKEN_KEY, legacyToken);
        const legacyUser = localStorage.getItem(AUTH_USER_KEY);
        if (legacyUser) {
          sessionStorage.setItem(AUTH_USER_KEY, legacyUser);
        }
        // Clean up localStorage so new tabs are not bound to this tab's identity
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }
  } catch (err) {
    console.warn('[Auth] Session migration warning:', err);
  }
}

/**
 * Returns the authentication token for the current tab's session.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Returns the logged-in user for the current tab's session.
 */
export function getAuthUser(): any {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Sets the authentication session for the current tab only.
 */
export function setAuthSession(token: string, user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('ayusync:auth_change', { detail: { token, user } }));
  } catch (err) {
    console.error('[Auth] Failed to set session in sessionStorage:', err);
  }
}

/**
 * Updates partial fields on the current tab's user object.
 */
export function updateAuthUser(partialUser: Partial<AuthUser>): AuthUser {
  const current = getAuthUser() || { role: 'DOCTOR' };
  const updated = { ...current, ...partialUser };
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('ayusync:auth_change', { detail: { user: updated } }));
    } catch (err) {
      console.error('[Auth] Failed to update user in sessionStorage:', err);
    }
  }
  return updated;
}

/**
 * Clears the authentication session for the current tab only.
 */
export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    window.dispatchEvent(new CustomEvent('ayusync:auth_change', { detail: { token: null, user: null } }));
  } catch (err) {
    console.error('[Auth] Failed to clear session in sessionStorage:', err);
  }
}
