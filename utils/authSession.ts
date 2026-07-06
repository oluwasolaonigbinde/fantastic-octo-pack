"use client";

import type { UserData } from "@/types/user";
import { initialAuthState } from "@/store/slices/auth-slice";

export const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";
// Persistence preference. When present in sessionStorage the session is
// tab-scoped ("Remember me" unchecked) and is dropped when the browser closes.
// Otherwise the session persists in localStorage across restarts (default).
export const AUTH_PERSISTENCE_KEY = "baiy.auth.persistence";
// Cross-tab logout signal. Always written to localStorage (even for
// session-scoped sessions) so a `storage` event fires in every other tab.
export const AUTH_LOGOUT_PING_KEY = "baiy.auth.logout";

const hasWindow = () => typeof window !== "undefined";

const isPersistableAuthUser = (value: unknown): value is UserData => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<UserData>;

  return (
    Boolean(user.isEmailVerified) &&
    typeof user.email === "string" &&
    typeof user.role === "string" &&
    typeof user.tokens?.accessToken === "string" &&
    user.tokens.accessToken.length > 0 &&
    typeof user.tokens?.refreshToken === "string" &&
    user.tokens.refreshToken.length > 0
  );
};

// Returns true when the session should persist across browser restarts
// (localStorage), false when it is tab-scoped (sessionStorage). Defaults to
// persistent for backward compatibility with sessions saved before this flag.
export const isPersistentSession = (): boolean => {
  if (!hasWindow()) {
    return true;
  }

  return window.sessionStorage.getItem(AUTH_PERSISTENCE_KEY) !== "session";
};

const primaryStorage = (): Storage =>
  isPersistentSession() ? window.localStorage : window.sessionStorage;

const secondaryStorage = (): Storage =>
  isPersistentSession() ? window.sessionStorage : window.localStorage;

// Records the "Remember me" choice. Must be called before the session is
// written (e.g. right after a successful login) so the session lands in the
// correct storage backend.
export const setAuthPersistence = (remember: boolean): void => {
  if (!hasWindow()) {
    return;
  }

  if (remember) {
    window.sessionStorage.removeItem(AUTH_PERSISTENCE_KEY);
  } else {
    window.sessionStorage.setItem(AUTH_PERSISTENCE_KEY, "session");
  }
};

const parseAuthUser = (rawValue: string | null): UserData | null => {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    return isPersistableAuthUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const readAuthSessionUser = (): UserData | null => {
  if (!hasWindow()) {
    return null;
  }

  return (
    parseAuthUser(primaryStorage().getItem(AUTH_SESSION_STORAGE_KEY)) ??
    parseAuthUser(secondaryStorage().getItem(AUTH_SESSION_STORAGE_KEY))
  );
};

export const writeAuthSessionUser = (user: UserData | null): void => {
  if (!hasWindow()) {
    return;
  }

  if (!isPersistableAuthUser(user)) {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }

  // Keep the session in a single backend to avoid stale duplicates when the
  // persistence preference changes between logins.
  secondaryStorage().removeItem(AUTH_SESSION_STORAGE_KEY);
  primaryStorage().setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(user));
};

export const clearAuthSessionUser = (): void => {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_PERSISTENCE_KEY);
};

// Notifies other open tabs that this session has been logged out.
export const broadcastLogout = (): void => {
  if (!hasWindow()) {
    return;
  }

  try {
    window.localStorage.setItem(AUTH_LOGOUT_PING_KEY, Date.now().toString());
  } catch {
    // Best-effort: local session teardown still happens in the calling tab.
  }
};

export const buildAuthSessionPreloadedState = () => {
  const user = readAuthSessionUser();

  if (!user) {
    return undefined;
  }

  return {
    auth: {
      ...initialAuthState,
      data: user,
    },
  };
};
