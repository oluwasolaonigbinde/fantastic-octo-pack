"use client";

import type { UserData } from "@/types/user";
import { initialAuthState } from "@/store/slices/auth-slice";

export const LOCAL_ROLE_AUTH_STORAGE_KEY = "baiy.localRoleAuth.user";
export const LOCAL_ROLE_AUTH_ENABLED_STORAGE_KEY =
  "baiy.localRoleAuth.enabled";

const LOCAL_ROLE_AUTH_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
]);
const LOCAL_ROLE_AUTH_ROLES = new Set([
  "buyer",
  "distributor",
  "oem",
  "admin",
  "engineer",
  "agent",
]);

const isNonProductionBuild = () => process.env.NODE_ENV !== "production";

const hasWindow = () => typeof window !== "undefined";

const isSafeLocalRoleAuthHost = () =>
  hasWindow() && LOCAL_ROLE_AUTH_HOSTS.has(window.location.hostname);

const canUseStorage = () => isSafeLocalRoleAuthHost();

const hasManualLocalRoleAuthOptIn = () =>
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_ROLE_AUTH === "1";

const isLocalRoleAuthEnabled = () =>
  canUseStorage() &&
  isNonProductionBuild() &&
  hasManualLocalRoleAuthOptIn();

const isValidLocalRoleAuthUser = (value: unknown): value is UserData => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<UserData>;

  return (
    typeof user.email === "string" &&
    typeof user.role === "string" &&
    LOCAL_ROLE_AUTH_ROLES.has(user.role) &&
    typeof user.tokens?.accessToken === "string" &&
    user.tokens.accessToken.length > 0 &&
    typeof user.tokens?.refreshToken === "string" &&
    user.tokens.refreshToken.length > 0
  );
};

const parseUser = (value: string | null): UserData | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return isValidLocalRoleAuthUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const clearLocalRoleAuthState = (): void => {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem(LOCAL_ROLE_AUTH_STORAGE_KEY);
  localStorage.removeItem(LOCAL_ROLE_AUTH_ENABLED_STORAGE_KEY);
};

export const readLocalRoleAuthUser = (): UserData | null => {
  if (!isLocalRoleAuthEnabled()) {
    return null;
  }

  const user = parseUser(localStorage.getItem(LOCAL_ROLE_AUTH_STORAGE_KEY));

  if (!user) {
    clearLocalRoleAuthState();
  }

  return user;
};

export const resolvePersistableLocalRoleAuthUser = (
  user: UserData | null,
): UserData | null => {
  if (!user) {
    return null;
  }

  if (user.tokens?.accessToken) {
    return user;
  }

  const stored = readLocalRoleAuthUser();

  if (stored?.email === user.email && stored.tokens?.accessToken) {
    return {
      ...user,
      tokens: stored.tokens,
    };
  }

  return user;
};

export const writeLocalRoleAuthUser = (user: UserData | null): void => {
  if (!canUseStorage()) {
    return;
  }

  if (!user) {
    clearLocalRoleAuthState();
    return;
  }

  if (!isLocalRoleAuthEnabled()) {
    clearLocalRoleAuthState();
    return;
  }

  const persistableUser = resolvePersistableLocalRoleAuthUser(user);

  if (!isValidLocalRoleAuthUser(persistableUser)) {
    clearLocalRoleAuthState();
    return;
  }

  localStorage.setItem(
    LOCAL_ROLE_AUTH_STORAGE_KEY,
    JSON.stringify(persistableUser),
  );
};

export const buildLocalRoleAuthPreloadedState = () => {
  if (!canUseStorage()) {
    return undefined;
  }

  if (!isLocalRoleAuthEnabled()) {
    clearLocalRoleAuthState();
    return undefined;
  }

  const user = readLocalRoleAuthUser();

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

export const isLocalRoleAuthRuntimeEnabled = () => isLocalRoleAuthEnabled();
