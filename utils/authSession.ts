"use client";

import type { UserData } from "@/types/user";
import { initialAuthState } from "@/store/slices/auth-slice";

export const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";

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

export const readAuthSessionUser = (): UserData | null => {
  if (!hasWindow()) {
    return null;
  }

  const rawValue = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);

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

export const writeAuthSessionUser = (user: UserData | null): void => {
  if (!hasWindow()) {
    return;
  }

  if (!isPersistableAuthUser(user)) {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(user));
};

export const clearAuthSessionUser = (): void => {
  if (!hasWindow()) {
    return;
  }

  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
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
