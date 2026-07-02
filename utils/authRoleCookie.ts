"use client";

// Lightweight, non-httpOnly role cookie mirrored from the persisted auth
// session. It exists solely so Next.js middleware can enforce dashboard
// role boundaries server-side (before any HTML for the wrong role paints).
// The cookie is advisory for routing only — the backend still validates the
// Bearer token on every API call, so a spoofed cookie grants no data access.

export const AUTH_ROLE_COOKIE_KEY = "baiy_role";

const PERSISTENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const hasDocument = () => typeof document !== "undefined";

const isSecureContext = () =>
  typeof window !== "undefined" && window.location.protocol === "https:";

export const writeAuthRoleCookie = (
  role: string | null | undefined,
  persistent: boolean,
): void => {
  if (!hasDocument()) {
    return;
  }

  if (!role) {
    clearAuthRoleCookie();
    return;
  }

  const attributes = [
    `${AUTH_ROLE_COOKIE_KEY}=${encodeURIComponent(role)}`,
    "path=/",
    "SameSite=Lax",
  ];

  // Persistent ("Remember me") sessions get a max-age so the cookie survives a
  // browser restart. Session-only sessions omit it, making it a session cookie
  // that the browser drops on close — matching the sessionStorage backend.
  if (persistent) {
    attributes.push(`max-age=${PERSISTENT_MAX_AGE_SECONDS}`);
  }

  if (isSecureContext()) {
    attributes.push("Secure");
  }

  document.cookie = attributes.join("; ");
};

export const clearAuthRoleCookie = (): void => {
  if (!hasDocument()) {
    return;
  }

  const attributes = [
    `${AUTH_ROLE_COOKIE_KEY}=`,
    "path=/",
    "SameSite=Lax",
    "max-age=0",
  ];

  if (isSecureContext()) {
    attributes.push("Secure");
  }

  document.cookie = attributes.join("; ");
};
