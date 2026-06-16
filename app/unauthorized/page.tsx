"use client";

import Link from "next/link";

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
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-dark"
        >
          Back to Login
        </Link>
      </div>
    </main>
  );
}
