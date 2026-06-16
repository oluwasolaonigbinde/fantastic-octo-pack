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
    <div className="flex min-h-full w-full min-w-0 flex-col gap-0 md:h-[582px]">
      <div>
        <h1 className="w-full text-[32px] font-medium leading-[38px] text-black md:text-[40px] md:leading-[48px]">
          {title}
        </h1>

        <div className="mt-8 md:mt-[54px]">
          <span className="sr-only">
            {availabilityLabel}
          </span>

          <p className="text-[40px] font-bold leading-[58px] text-[#111827] md:text-[52px] md:leading-[62px]">
            {formatCurrency(price)}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 md:gap-5">
            <VerificationPill
              label="Verified Seller"
              isVisible={isSellerVerified}
            />
            <VerificationPill label="OEM Verified" isVisible={isOemVerified} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 md:mt-5 md:flex md:items-center md:gap-5">
        <button
          type="button"
          onClick={onOrderNow}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[#FE6E00] px-4 text-sm font-medium text-white transition hover:bg-[#E86300] md:h-14 md:w-[199px] md:text-2xl md:leading-10"
        >
          Order Now
        </button>

        <button
          type="button"
          onClick={onMessageSeller}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0669D9] px-4 text-sm font-medium text-[#E2F1FF] transition hover:bg-[#0553AE] md:h-14 md:w-[241px] md:px-4 md:text-[22px] md:leading-10"
        >
          <span className="whitespace-nowrap">Chat with Seller</span>
          <MessageCircle className="hidden size-8 md:block" strokeWidth={1.8} />
        </button>

        <button
          type="button"
          onClick={onSendInquiry}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[#EAF9FF] px-4 text-sm font-medium text-[#111827] transition hover:bg-[#DDF5FF] md:h-14 md:w-[250px] md:text-2xl md:leading-10"
        >
          Send Inquiry
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] p-5 md:mt-[50px] md:h-[208px]">
        <div className="flex items-center gap-3 text-lg font-semibold text-[#4B5563] md:text-2xl md:leading-10">
          <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#F59E0B]">
            <ShieldCheck size={24} />
          </span>
          Protected by Baiy Trade Assurance
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#4B5563] md:gap-5 md:pl-2 md:text-xl md:leading-8">
          <AssuranceItem label="Escrow Protection" />
          <AssuranceItem label="Resolution" />
          <AssuranceItem label="Verified Suppliers" />
        </div>

        <p className="mt-6 text-sm leading-6 text-[#4B5563] md:text-lg md:leading-7">
          A short copy here to give a more confident purchase to users
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
    <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[rgba(107,114,128,0.06)] px-3 text-sm font-semibold text-[#13A83B] md:h-12 md:min-w-[199px] md:justify-center">
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
