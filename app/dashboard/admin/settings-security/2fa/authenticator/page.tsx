"use client";
import Link from "next/link";
import { ArrowRight, Copy, X } from "lucide-react";

import { Button } from "@/components/base";

export default function AdminSettingsAuthenticatorPage() {
  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-[500px] overflow-hidden bg-white text-gray1 shadow-xl">
      <header className="flex h-16 items-start justify-between px-10 pt-10">
        <h1 className="w-[366px] text-xl font-semibold leading-8">
          Setup 2FA with authenticator app
        </h1>
        <Link
          href="/dashboard/admin/settings-security"
          aria-label="Close authenticator setup"
          className="mt-1 flex size-6 items-center justify-center"
        >
          <X size={24} />
        </Link>
      </header>

      <main className="relative h-[736px] px-10">
        <p className="mt-[60px] text-center text-sm leading-5">
          Scan the QR code below using your authenticator app
        </p>

        <div className="mt-5 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/admin-2fa-qr-figma.png"
            alt="Authenticator QR code"
            width={200}
            height={200}
            className="h-[200px] w-[200px]"
          />
        </div>

        <p className="mt-4 text-center text-sm leading-5">OR</p>
        <p className="mx-auto mt-7 w-[420px] text-center text-sm leading-5">
          Manually enter the code below in the space provided on your authenticator app
        </p>

        <div className="mt-9 flex items-center gap-4">
          <div className="flex h-16 w-[290px] items-center justify-center rounded-xl border border-[#FE6E00] bg-[#FFF7F0] p-5 font-['Prompt'] text-sm leading-6">
            LK57 - 2BH3 - J962 - HAXX - 02LA
          </div>
          <button
            type="button"
            className="flex h-16 w-[114px] items-center justify-center gap-2 rounded-[14px] border border-primary bg-[#EAF9FF] text-lg leading-8 text-[#03265C]"
          >
            <Copy size={24} />
            Copy
          </button>
        </div>

        <div className="mt-12 border-t border-gray5 pt-10">
          <Button
            title="Proceed"
            iconRight={<ArrowRight size={24} />}
            className="h-14 w-full rounded-xl text-lg"
            type="button"
          />
        </div>
      </main>
    </div>
  );
}
