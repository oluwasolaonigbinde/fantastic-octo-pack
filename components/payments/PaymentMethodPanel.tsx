"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Landmark, Lock, ShieldCheck } from "lucide-react";

import {
  ORDER_PAYMENT_METHODS,
  type PaymentMethodId,
  type PaymentMethodOption,
} from "./paymentMethods";

interface PaymentMethodPanelProps {
  selected: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
  /** Rendered under the wallet rail, e.g. "Balance: ₦120,000.00". */
  walletBalanceLabel?: string;
  /** Alerts (insufficient balance, gateway errors) rendered below the rails. */
  children?: ReactNode;
}

/** Brand mark shown on the right of each rail. */
function MethodBrand({ id }: { id: PaymentMethodId }) {
  if (id === "wallet") {
    return (
      <div className="flex shrink-0 items-center gap-2 opacity-60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/payments-baiy-trade-assurance.svg"
          alt=""
          className="h-[26.25px] w-[27.5px]"
        />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase leading-[10px] tracking-[-0.5px] text-[#111827]">
            BAIY
          </span>
          <span className="text-[8px] uppercase leading-[8px] text-[#111827]">
            Trade Assurance
          </span>
        </div>
      </div>
    );
  }

  if (id === "paystack") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/icons/payments-paystack.svg"
        alt="Paystack"
        className="h-[14px] w-[80px] shrink-0"
      />
    );
  }

  if (id === "flutterwave") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/icons/payments-flutterwave.svg"
        alt="Flutterwave"
        className="h-[13px] w-[80px] shrink-0"
      />
    );
  }

  return <Landmark size={25} strokeWidth={1.6} className="shrink-0 text-[#111827]" />;
}

function MethodRail({
  option,
  isSelected,
  onSelect,
  walletBalanceLabel,
}: {
  option: PaymentMethodOption;
  isSelected: boolean;
  onSelect: () => void;
  walletBalanceLabel?: string;
}) {
  const disabled = option.method === null;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      disabled={disabled}
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-5 text-left transition-colors sm:p-6 ${
        isSelected
          ? "border-2 border-[#002B5C] bg-[#EFF4FF] shadow-[0px_0px_0px_2px_#ffffff,0px_0px_0px_4px_#0051D5]"
          : "border-[#C4C6D0] bg-[#F8F9FF]"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <span className="flex min-w-0 items-center gap-4">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
            isSelected
              ? "border-2 border-[#002B5C] p-1.5"
              : "border border-[#C4C6D0]"
          }`}
        >
          {isSelected ? (
            <span className="size-full rounded-full bg-[#002B5C]" />
          ) : null}
        </span>

        <span className="flex min-w-0 flex-col">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-base font-medium leading-7 text-[#111827]">
              {option.title}
            </span>
            {option.recommended ? (
              <span className="rounded px-2 py-0.5 text-[10px] font-bold leading-[18px] text-[#00A874] bg-[#00A874]/10">
                RECOMMENDED
              </span>
            ) : null}
          </span>
          <span className="text-sm leading-5 text-[#43474F]">
            {option.description}
          </span>
          {option.id === "wallet" && walletBalanceLabel ? (
            <span className="text-xs leading-5 text-[#4B5563]">
              {walletBalanceLabel}
            </span>
          ) : null}
          {disabled ? (
            <span className="text-xs leading-5 text-[#9CA3AF]">Coming soon</span>
          ) : null}
        </span>
      </span>

      <MethodBrand id={option.id} />
    </button>
  );
}

/**
 * Left column of the payment screen: header, the payment-method rails, the
 * protection notice and the terms line. Shared by the public checkout page and
 * the buyer order payment view.
 */
export function PaymentMethodPanel({
  selected,
  onSelect,
  walletBalanceLabel,
  children,
}: PaymentMethodPanelProps) {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold leading-10 text-[#001736]">
          Payment
        </h1>
        <p className="flex items-center gap-2 text-base font-medium leading-7 text-[#13A83B]">
          <ShieldCheck size={16} className="shrink-0" />
          All payments are secure and encrypted
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium leading-7 text-[#111827]">
          Select a payment method
        </h2>
        <p className="text-sm leading-5 text-[#4B5563]">
          Choose your preferred way to pay for this order
        </p>
      </div>

      <div className="flex flex-col gap-4" role="radiogroup" aria-label="Payment method">
        {ORDER_PAYMENT_METHODS.map((option) => (
          <MethodRail
            key={option.id}
            option={option}
            isSelected={selected === option.id}
            onSelect={() => onSelect(option.id)}
            walletBalanceLabel={walletBalanceLabel}
          />
        ))}
      </div>

      {children}

      <div className="flex items-start gap-4 rounded-xl border border-[#C4C6D0] bg-[#EFF4FF] p-5 sm:p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#C4C6D0] bg-white">
          <ShieldCheck size={18} className="text-[#0669D9]" />
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-medium leading-7 text-[#0669D9]">
            Your payment is protected
          </h3>
          <p className="max-w-[558px] text-xs font-medium leading-5 text-[#4B5563]">
            All transactions are secured with 256-bit SSL encryption and our Trade
            Assurance keeps your funds safe until your order is delivered and
            confirmed.
          </p>
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-2 text-xs font-semibold leading-5 text-[#43474F]">
        <Lock size={12} className="shrink-0" />
        By proceeding, you agree to our
        <Link href="/policies" className="text-[#0051D5]">
          Terms &amp; Conditions
        </Link>
        and
        <Link href="/policies" className="text-[#0051D5]">
          Privacy Policy
        </Link>
      </p>
    </section>
  );
}

export default PaymentMethodPanel;
