import type { ReactNode } from "react";

import type { Quote, Rfq, UserRef } from "@/types/rfq";
import { getPartyDisplayName } from "@/utils/partyDisplayName";

const moneyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value?: number | null): string {
  if (typeof value !== "number") return "Not available";
  return moneyFormatter.format(value);
}

export function formatDate(value?: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-GB");
}

export function presentDate(value?: string | null): string {
  return formatDate(value);
}

export function formatQuantity(value?: number | null): string {
  return typeof value === "number" ? String(value) : "Not available";
}

export function pickFirstText(
  ...values: Array<string | null | undefined>
): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

export function isUserRef(value: unknown): value is UserRef {
  return Boolean(value && typeof value === "object" && "email" in value);
}

export function getUserName(value: unknown, fallback = "Not available"): string {
  if (!isUserRef(value)) return fallback;
  return getPartyDisplayName(value, value.email);
}

export function getUserEmail(value: unknown, fallback = "Not available"): string {
  return isUserRef(value) && value.email ? value.email : fallback;
}

export function getUserPhone(value: unknown, fallback = "Not available"): string {
  return isUserRef(value) && value.phoneNumber ? value.phoneNumber : fallback;
}

export function getFirstRfqItem(rfq?: Rfq) {
  return rfq?.items?.[0];
}

export function getItemProductName(rfq?: Rfq, fallback = "Not available"): string {
  const item = getFirstRfqItem(rfq);
  if (!item) return fallback;
  return item.productName || fallback;
}

export function getItemUnitPrice(rfq?: Rfq, fallback?: number | null): string {
  // RFQ request lines do not carry a seller price. Pricing belongs to the
  // distributor quote response, so only show the table fallback here.
  return formatMoney(fallback);
}

export function getFirstQuoteItem(quote?: Quote) {
  return quote?.items?.[0];
}

export function DetailField({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-normal leading-5 text-gray3">{label}</p>
      <p className="break-words text-base font-normal leading-6 text-gray1">
        {value || "Not available"}
      </p>
    </div>
  );
}

export function DetailStatusBanner({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#FFE079] bg-[#FFF6D9] px-6 py-4 sm:px-8 sm:py-5">
      <p className="text-sm font-medium text-[#272B36] sm:text-lg">{label}</p>
      <span className="inline-flex rounded-lg bg-[#FFC000] px-4 py-2 text-sm font-normal text-white sm:px-[18px] sm:py-[11px] sm:text-lg">
        {value}
      </span>
    </div>
  );
}
