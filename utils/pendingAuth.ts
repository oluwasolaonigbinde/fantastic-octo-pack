"use client";

import type {
  PendingAuthIntent,
  AuthFlowStep,
  PendingRegistrationContext,
  PendingResetContext,
} from "@/types/auth";

export const PENDING_REGISTRATION_STORAGE_KEY =
  "baiy.auth.pending-registration";
export const PENDING_RESET_STORAGE_KEY = "baiy.auth.pending-reset";
export const PENDING_AUTH_INTENT_STORAGE_KEY = "baiy.auth.pending-intent";

const hasWindow = () => typeof window !== "undefined";

const readSessionValue = <T>(key: string): T | null => {
  if (!hasWindow()) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
};

const writeSessionValue = <T>(key: string, value: T | null): void => {
  if (!hasWindow()) {
    return;
  }

  if (!value) {
    window.sessionStorage.removeItem(key);
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
};

export const readPendingRegistrationContext =
  (): PendingRegistrationContext | null =>
    readSessionValue<PendingRegistrationContext>(
      PENDING_REGISTRATION_STORAGE_KEY,
    );

export const writePendingRegistrationContext = (
  value: PendingRegistrationContext | null,
): void => {
  writeSessionValue(PENDING_REGISTRATION_STORAGE_KEY, value);
};

export const clearPendingRegistrationContext = (): void => {
  writePendingRegistrationContext(null);
};

export const readPendingAuthIntent = (): PendingAuthIntent | null =>
  readSessionValue<PendingAuthIntent>(PENDING_AUTH_INTENT_STORAGE_KEY);

export const writePendingAuthIntent = (
  value: PendingAuthIntent | null,
): void => {
  writeSessionValue(PENDING_AUTH_INTENT_STORAGE_KEY, value);
};

export const clearPendingAuthIntent = (): void => {
  writePendingAuthIntent(null);
};

const isSafeWebsiteBackPath = (
  value: string | null | undefined,
): value is string => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return false;
  }

  return ![
    "/login",
    "/register",
    "/forgot-password",
    "/verify-otp",
    "/reset-password",
    "/verify-email",
    "/select-role",
    "/complete-signup",
    "/create-password",
  ].some((path) => value === path || value.startsWith(`${path}?`));
};

export const resolveAuthWebsiteBackPath = (): string => {
  const pendingIntent = readPendingAuthIntent();

  if (
    pendingIntent &&
    "sourcePath" in pendingIntent &&
    isSafeWebsiteBackPath(pendingIntent.sourcePath)
  ) {
    return pendingIntent.sourcePath;
  }

  if (hasWindow()) {
    const redirectPath = new URLSearchParams(window.location.search).get(
      "redirect",
    );

    if (isSafeWebsiteBackPath(redirectPath)) {
      return redirectPath;
    }
  }

  return "/";
};

export const readPendingResetContext = (): PendingResetContext | null =>
  readSessionValue<PendingResetContext>(PENDING_RESET_STORAGE_KEY);

export const writePendingResetContext = (
  value: PendingResetContext | null,
): void => {
  writeSessionValue(PENDING_RESET_STORAGE_KEY, value);
};

export const clearPendingResetContext = (): void => {
  writePendingResetContext(null);
};

export const clearAuthFlowContext = (): void => {
  clearPendingAuthIntent();
  clearPendingRegistrationContext();
  clearPendingResetContext();
};

export const mapAuthStepToPath = (step: AuthFlowStep | "register"): string => {
  switch (step) {
    case "verify_email":
      return "/verify-email";
    case "complete_signup":
      return "/complete-signup";
    case "select_role":
      return "/select-role";
    case "create_password":
      return "/create-password";
    case "login":
      return "/login";
    default:
      return "/register";
  }
};
