/** Display helpers for payment transactions, shared across role wallet screens. */

import type { PaymentChannel, PaymentIntent, PaymentStatus } from "@/types/payment";

export const formatTransactionDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()} - ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}pm`;
};

export const intentLabel: Record<PaymentIntent, string> = {
  order_payment: "ESCROW",
  wallet_topup: "Top-up",
  service_payment: "Service",
  withdrawal: "Withdrawal",
  escrow_release: "Reversal",
  refund: "Refund",
};

export const statusColor: Record<PaymentStatus, string> = {
  success: "text-[#13A83B]",
  failed: "text-[#E33C13]",
  rejected: "text-[#E33C13]",
  abandoned: "text-[#E33C13]",
  pending_approval: "text-[#F5A400]",
  pending: "text-[#F5A400]",
  refunded: "text-[#F5A400]",
};

export const channelLabel: Record<PaymentChannel, string> = {
  card: "Card",
  bank: "Bank",
  bank_transfer: "Bank transfer",
  dedicated_virtual_account: "Virtual account",
  ussd: "USSD",
  qr: "QR",
  mobile_money: "Mobile money",
  eft: "EFT",
  wallet: "Wallet",
  internal: "Internal",
};
