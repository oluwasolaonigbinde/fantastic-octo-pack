"use client";

import { useAppSelector } from "@/hooks/useAppSelector";
import { readAuthRoleCookie } from "@/utils/authRoleCookie";

/**
 * Resolves the *active* session's role at click time and hard-navigates to that
 * role's dashboard (BAI-61).
 *
 * Two reasons this is not a `<Link href="/dashboard">`:
 *
 * 1. `/dashboard` is role-resolved by middleware, and Next's client router
 *    cache can still hold the previous account's resolution (e.g.
 *    `/dashboard/admin`) after a role switch — clicking it replayed that cached
 *    redirect and bounced straight back here, an inescapable loop.
 * 2. A full document navigation drops that cache entirely and re-runs
 *    middleware against the current `baiy_role` cookie.
 *
 * The label is static so server and client render identical HTML; the role is
 * only read inside the click handler, after hydration.
 */
export function GoToDashboardButton() {
  const role = useAppSelector((state) => state.auth.data?.role);

  const handleClick = () => {
    const activeRole = role || readAuthRoleCookie();

    window.location.assign(activeRole ? `/dashboard/${activeRole}` : "/dashboard");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-dark"
    >
      Go to my dashboard
    </button>
  );
}
