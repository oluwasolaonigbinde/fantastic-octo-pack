"use client";

import { ArrowRight, X } from "lucide-react";

import type { TopUpReturnStatus } from "@/hooks/useWalletTopup";

const formatNaira = (naira: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);

export type TopUpPanelProps = {
  amount: string;
  amountError: string;
  isSubmitting: boolean;
  topupError: string;
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function TopUpPanel({
  amount,
  amountError,
  isSubmitting,
  topupError,
  onAmountChange,
  onClose,
  onSubmit,
}: TopUpPanelProps) {
  const numericAmount = Number(amount.replace(/[^\d]/g, ""));
  const formattedTotal = numericAmount ? formatNaira(numericAmount) : "₦0";

  return (
    <div>
      <div className="flex h-[90px] items-center justify-between border-b border-[#E6ECF2] px-5 md:px-8">
        <h2 className="text-base font-medium text-[#111827] md:text-xl">
          Top up your wallet
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close top up"
          className="text-[#111827]"
        >
          <X size={24} />
        </button>
      </div>

      <div className="px-5 pt-6 md:px-8">
        <p className="text-xs leading-[18px] text-[#111827] md:text-base md:leading-6">
          Easily top up your wallet balance. You will be redirected to Paystack
          to complete the payment.
        </p>

        <div className="mt-10 space-y-5 md:mt-9">
          <label className="block">
            <span className="mb-2 block text-base text-[#111827]">
              Amount to top up (₦)
            </span>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="Enter amount (min. ₦100)"
              className={`h-[60px] w-full rounded-xl border px-4 text-base text-[#6B7280] outline-none ${
                amountError ? "border-[#E33C13]" : "border-[#DDE0E5]"
              }`}
            />
            {amountError && (
              <p className="mt-1.5 text-sm text-[#E33C13]">{amountError}</p>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-base text-[#111827]">Total (₦)</span>
            <input
              readOnly
              value={formattedTotal}
              className="h-[60px] w-full rounded-xl border border-[#DDE0E5] bg-[#F3F4F6] px-4 text-base text-[#6B7280] outline-none"
            />
          </label>
        </div>

        {topupError && (
          <p className="mt-4 rounded-lg border border-[#E33C13] bg-[#FFF5F3] px-4 py-3 text-sm text-[#E33C13]">
            {topupError}
          </p>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="mt-9 flex h-[60px] w-full items-center justify-center gap-3 rounded-lg bg-[#0669D9] text-lg text-white disabled:opacity-60 md:mt-9"
        >
          {isSubmitting ? (
            "Redirecting to Paystack…"
          ) : (
            <>
              Top up now
              <ArrowRight size={24} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/** Slide-over top-up drawer. Render with the props returned from useWalletTopup. */
export function TopUpDrawer({
  open,
  panelProps,
}: {
  open: boolean;
  panelProps: TopUpPanelProps;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <button
        type="button"
        aria-label="Close top up overlay"
        onClick={panelProps.onClose}
        className="hidden flex-1 md:block"
      />
      <aside className="h-full w-full overflow-y-auto bg-white md:w-[500px]">
        <TopUpPanel {...panelProps} />
      </aside>
    </div>
  );
}

/** Success / cancelled banner shown when returning from Paystack. */
export function TopUpReturnBanner({
  status,
  onDismiss,
}: {
  status: TopUpReturnStatus;
  onDismiss: () => void;
}) {
  if (status === "success") {
    return (
      <div className="mb-4 flex items-center justify-between rounded-lg border border-[#13A83B] bg-[#F0FFF4] px-4 py-3 text-sm text-[#13A83B]">
        <span>Top-up successful! Your wallet balance has been updated.</span>
        <button type="button" onClick={onDismiss} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="mb-4 flex items-center justify-between rounded-lg border border-[#F5A400] bg-[#FFFBEB] px-4 py-3 text-sm text-[#F5A400]">
        <span>Payment was cancelled. No funds were deducted.</span>
        <button type="button" onClick={onDismiss} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    );
  }

  return null;
}
