import Link from "next/link";

import { GoToDashboardButton } from "./GoToDashboardButton";

/**
 * Static markup only — no client auth reads during render.
 * Auth is hydrated from storage after paint; branching on it here caused
 * server/client HTML mismatch ("Go to homepage" vs "Go to my dashboard").
 *
 * The primary CTA resolves the active role inside its click handler instead,
 * so the rendered HTML stays identical on both sides.
 */
export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray7 px-6">
      <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
          Access Restricted
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-gray1">Unauthorized</h1>
        <p className="mt-4 text-sm text-gray2">
          Your account can sign in, but it does not have access to this dashboard
          route.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <GoToDashboardButton />

          <Link
            href="/"
            className="inline-flex rounded-full border border-[#DDE0E5] bg-white px-5 py-3 text-sm font-medium text-gray1 transition hover:bg-gray7"
          >
            Go to homepage
          </Link>

          <Link
            href="/login"
            className="text-sm font-medium text-gray2 underline-offset-4 transition hover:text-gray1 hover:underline"
          >
            Switch account
          </Link>
        </div>
      </div>
    </main>
  );
}
