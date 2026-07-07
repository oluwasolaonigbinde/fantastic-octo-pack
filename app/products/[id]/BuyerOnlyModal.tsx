"use client";

import Link from "next/link";
import { ShieldAlert, X } from "lucide-react";

import { UserRole } from "@/types/user";

interface BuyerOnlyModalProps {
  isOpen: boolean;
  /** The signed-in user's role, used to tailor the explanation. */
  role?: UserRole | string;
  onClose: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  [UserRole.DISTRIBUTOR]: "distributor",
  [UserRole.OEM]: "OEM",
  [UserRole.ENGINEER]: "service engineer",
  [UserRole.ADMIN]: "admin",
  [UserRole.AGENT]: "agent",
  [UserRole.SUPER_ADMIN]: "admin",
};

export default function BuyerOnlyModal({
  isOpen,
  role,
  onClose,
}: BuyerOnlyModalProps) {
  if (!isOpen) {
    return null;
  }

  const roleLabel = role ? ROLE_LABELS[role] ?? "non-buyer" : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="buyer-only-title"
        className="relative w-full max-w-[480px] overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#111827]"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center px-6 py-8 text-center sm:px-8">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#FEF3C7]">
            <ShieldAlert size={32} className="text-[#F59E0B]" />
          </div>

          <h2
            id="buyer-only-title"
            className="text-xl font-semibold text-[#111827]"
          >
            Buyer accounts only
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#4B5563]">
            Placing an order and making payment is available to buyer accounts
            only.
            {roleLabel
              ? ` Your account is registered as a ${roleLabel}, so you can browse products and message sellers, but you can't check out.`
              : " Sign in with a buyer account to purchase equipment."}
          </p>

          <div className="mt-6 flex w-full flex-col gap-3">
            <Link
              href="/register"
              onClick={onClose}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0669D9] text-sm font-medium text-white transition hover:bg-[#0553AE]"
            >
              Register a buyer account
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-[#DDE0E5] text-sm font-medium text-[#4B5563] transition hover:bg-[#F9FAFB]"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
