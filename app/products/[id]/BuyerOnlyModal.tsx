"use client";

import { ShieldAlert, X } from "lucide-react";

import { UserRole } from "@/types/user";

export type BuyerOnlyIntent = "order" | "chat";

interface BuyerOnlyModalProps {
  isOpen: boolean;
  /** The signed-in user's role, or undefined for a guest (not signed in). */
  role?: UserRole | string;
  /** Which action the visitor was attempting, so the copy can be specific. */
  intent: BuyerOnlyIntent;
  onClose: () => void;
  /** Navigate to sign in, preserving the action so it can resume after auth. */
  onSignIn: () => void;
  /** Navigate to buyer registration, preserving the action so it can resume after auth. */
  onRegister: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  [UserRole.DISTRIBUTOR]: "distributor",
  [UserRole.OEM]: "OEM",
  [UserRole.ENGINEER]: "service engineer",
  [UserRole.ADMIN]: "admin",
  [UserRole.AGENT]: "agent",
  [UserRole.SUPER_ADMIN]: "admin",
};

const INTENT_COPY: Record<BuyerOnlyIntent, { verb: string; noun: string }> = {
  order: { verb: "place an order and make payment", noun: "purchase equipment" },
  chat: { verb: "chat with a seller", noun: "message sellers" },
};

export default function BuyerOnlyModal({
  isOpen,
  role,
  intent,
  onClose,
  onSignIn,
  onRegister,
}: BuyerOnlyModalProps) {
  if (!isOpen) {
    return null;
  }

  const isGuest = !role;
  const roleLabel = role ? ROLE_LABELS[role] ?? "non-buyer" : undefined;
  const { verb, noun } = INTENT_COPY[intent];

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
            {isGuest
              ? `You need to sign in or create a buyer account to ${verb}.`
              : `${
                  verb.charAt(0).toUpperCase() + verb.slice(1)
                } is available to buyer accounts only. Your account is registered as a ${roleLabel}, so you can browse products and ${noun}, but you can't do that here.`}
          </p>

          <div className="mt-6 flex w-full flex-col gap-3">
            {isGuest && (
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0669D9] text-sm font-medium text-white transition hover:bg-[#0553AE]"
              >
                Sign in
              </button>
            )}

            {isGuest && (
              <button
                type="button"
                onClick={onRegister}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-[#DDE0E5] text-sm font-medium text-[#4B5563] transition hover:bg-[#F9FAFB]"
              >
                Create a buyer account
              </button>
            )}

            {!isGuest && (
              <button
                type="button"
                onClick={onRegister}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0669D9] text-sm font-medium text-white transition hover:bg-[#0553AE]"
              >
                Register a buyer account
              </button>
            )}

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
