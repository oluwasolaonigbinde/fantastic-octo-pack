"use client";
import Link from "next/link";
import { ArrowRight, Copy, X } from "lucide-react";

import { Button } from "@/components/base";

export default function AdminSettingsAuthenticatorPage() {
  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-[500px] overflow-hidden bg-white text-gray1 shadow-xl">
      <header className="flex min-h-16 items-start justify-between gap-4 px-6 pt-10 sm:px-10">
        <h1 className="max-w-[366px] text-xl font-semibold leading-8">
          Setup 2FA with authenticator app
        </h1>
        <Link
          href="/dashboard/admin/settings-security"
          aria-label="Close authenticator setup"
          className="mt-1 flex size-6 shrink-0 items-center justify-center"
        >
          <X size={24} />
        </Link>
      </header>

      <main className="relative h-[calc(100vh-4rem)] overflow-y-auto px-6 pb-10 sm:px-10">
        <p className="mt-[60px] text-center text-sm leading-5">
          Scan the QR code below using your authenticator app
        </p>

        <div className="mt-5 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/admin-2fa-qr.svg"
            alt="Authenticator QR code"
            width={200}
            height={200}
            className="h-[200px] w-[200px]"
          />
        </div>

        <p className="mt-4 text-center text-sm leading-5">OR</p>
        <p className="mx-auto mt-7 max-w-[420px] text-center text-sm leading-5">
          Manually enter the code below in the space provided on your authenticator app
        </p>

        <div className="mt-9 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-full items-center justify-center rounded-xl border border-[#FE6E00] bg-[#FFF7F0] p-5 font-['Prompt'] text-sm leading-6 sm:h-16 sm:w-[290px]">
            LK57 - 2BH3 - J962 - HAXX - 02LA
          </div>
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-primary bg-[#EAF9FF] text-lg leading-8 text-[#03265C] sm:h-16 sm:w-[114px]"
          >
            <Copy size={24} />
            Copy
          </button>
        </div>

        <div className="mt-12 border-t border-gray5 pt-10">
          <Button
            title="Proceed"
            iconRight={<ArrowRight size={24} />}
            className="h-12 sm:h-14 w-full rounded-xl text-lg"
            type="button"
          />
        </div>
      </main>
    </div>
  );
}
