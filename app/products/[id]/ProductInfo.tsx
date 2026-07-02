"use client";

import { CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";

interface ProductInfoProps {
  title: string;
  availabilityLabel: string;
  price: number;
  isSellerVerified?: boolean;
  isOemVerified?: boolean;
  onSendInquiry?: () => void;
  onOrderNow?: () => void;
  onMessageSeller?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(value || 0)
    .replace(/^NGN\s?/, "\u20A6");
}

export default function ProductInfo({
  title,
  availabilityLabel,
  price,
  isSellerVerified = false,
  isOemVerified = false,
  onSendInquiry,
  onOrderNow,
  onMessageSeller,
}: ProductInfoProps) {
  return (
    <div className="flex min-h-full w-full min-w-0 flex-col gap-0 md:h-[440px]">
      <div>
        <h1 className="w-full text-2xl font-medium leading-8 text-black md:text-[28px] md:leading-9">
          {title}
        </h1>

        <div className="mt-6 md:mt-8">
          <span className="sr-only">{availabilityLabel}</span>

          <p className="text-3xl font-bold leading-10 text-[#111827] md:text-[38px] md:leading-[48px]">
            {formatCurrency(price)}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <VerificationPill
              label="Verified Seller"
              isVisible={isSellerVerified}
            />
            <VerificationPill label="OEM Verified" isVisible={isOemVerified} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:mt-4 md:flex md:items-center md:gap-3">
        <button
          type="button"
          onClick={onOrderNow}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[#FE6E00] px-4 text-sm font-medium text-white transition hover:bg-[#E86300] md:h-11 md:w-[150px] md:text-base"
        >
          Order Now
        </button>

        <button
          type="button"
          onClick={onMessageSeller}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0669D9] px-4 text-sm font-medium text-[#E2F1FF] transition hover:bg-[#0553AE] md:h-11 md:w-[185px] md:text-base"
        >
          <span className="whitespace-nowrap">Chat with Seller</span>
          <MessageCircle className="hidden size-5 md:block" strokeWidth={1.8} />
        </button>

        <button
          type="button"
          onClick={onSendInquiry}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[#EAF9FF] px-4 text-sm font-medium text-[#111827] transition hover:bg-[#DDF5FF] md:h-11 md:w-[190px] md:text-base"
        >
          Send Inquiry
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-4 md:mt-8">
        <div className="flex items-center gap-3 text-base font-semibold text-[#4B5563] md:text-lg">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#F59E0B]">
            <ShieldCheck size={18} />
          </span>
          Protected by Baiy Trade Assurance
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#4B5563] md:pl-2 md:text-sm">
          <AssuranceItem label="Escrow Protection" />
          <AssuranceItem label="Resolution" />
          <AssuranceItem label="Verified Suppliers" />
        </div>

        <p className="mt-4 text-sm leading-6 text-[#4B5563]">
          Your payment stays protected until delivery is confirmed. Suppliers
          are only paid after you approve the order, Baiy support is available
          for refunds, and delivery issues.
        </p>
      </div>
    </div>
  );
}

function VerificationPill({
  label,
  isVisible,
}: {
  label: string;
  isVisible: boolean;
}) {
  if (!isVisible) {
    return null;
  }

  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[rgba(107,114,128,0.06)] px-3 text-sm font-semibold text-[#13A83B] md:h-9 md:min-w-[150px] md:justify-center">
      <CheckCircle2 size={18} />
      {label}
    </span>
  );
}

function AssuranceItem({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <ShieldCheck size={18} className="text-[#7CB7F3]" />
      {label}
    </span>
  );
}
