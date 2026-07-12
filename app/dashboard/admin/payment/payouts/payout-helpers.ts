import type { PaymentParty, PaymentStatus, PaymentTransaction } from "@/types/payment";

/** Format a smallest-unit (kobo) amount as a currency string. */
export const formatKobo = (amount?: number | null, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((amount ?? 0) / 100);

export const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} · ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};

export const isToday = (value?: string | null) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

/**
 * The account holder behind a payout. For a withdrawal the funds are released
 * to the beneficiary, so prefer the payee and fall back to the payer.
 */
export const getPayoutUser = (
  transaction: PaymentTransaction,
): PaymentParty | null => transaction.payee ?? transaction.payer ?? null;

export const getUserName = (party?: PaymentParty | null) => {
  if (!party) return "-";
  const name = `${party.firstName ?? ""} ${party.lastName ?? ""}`.trim();
  return name || party.email || party._id;
};

const metadataString = (
  transaction: PaymentTransaction,
  keys: string[],
): string | undefined => {
  const metadata = transaction.metadata;
  if (!metadata) return undefined;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
};

const metadataNumber = (
  transaction: PaymentTransaction,
  keys: string[],
): number | undefined => {
  const metadata = transaction.metadata;
  if (!metadata) return undefined;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
};

export const getUserType = (transaction: PaymentTransaction) =>
  metadataString(transaction, ["userType", "userRole", "role", "accountType"]);

export const getUserPhone = (transaction: PaymentTransaction) =>
  metadataString(transaction, ["phone", "phoneNumber", "userPhone", "msisdn"]);

/** Available wallet balance for the requester, in kobo, if the backend reported it. */
export const getAvailableBalanceKobo = (transaction: PaymentTransaction) =>
  metadataNumber(transaction, [
    "availableBalance",
    "walletBalance",
    "balance",
    "availableBalanceKobo",
  ]);

export type PayoutStatusTone = "success" | "pending" | "danger";

export const payoutStatusTone: Record<PaymentStatus, PayoutStatusTone> = {
  pending_approval: "pending",
  pending: "pending",
  success: "success",
  refunded: "success",
  rejected: "danger",
  failed: "danger",
  abandoned: "danger",
};

export const payoutStatusLabel: Record<PaymentStatus, string> = {
  pending_approval: "Pending",
  pending: "Pending",
  success: "Approved",
  refunded: "Refunded",
  rejected: "Rejected",
  failed: "Failed",
  abandoned: "Abandoned",
};

const statusToneClasses: Record<PayoutStatusTone, string> = {
  success: "bg-[#E8FAEE] text-[#13A83B]",
  pending: "bg-[#E7F1FF] text-primary",
  danger: "bg-[#FDE8E8] text-danger",
};

export const payoutStatusClass = (status: PaymentStatus) =>
  statusToneClasses[payoutStatusTone[status]];
