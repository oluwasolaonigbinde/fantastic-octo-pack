"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { X } from "lucide-react";

import {
  ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK,
  ADMIN_PAYMENT_ROWS,
} from "@/constants/adminFigmaFallbacks";

export default function AdminPaymentInvoiceDetailPage() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");

  const paymentRow = useMemo(
    () => ADMIN_PAYMENT_ROWS.find((row) => row.id === paymentId) ?? null,
    [paymentId],
  );

  const rows = [
    ["Invoice ID", paymentRow?.orderId || ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.invoiceId, false],
    ["Item", paymentRow?.nameOfItem || ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.itemName, false],
    ["Unit price", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.unitPrice, true],
    ["Quantity", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.quantity, false],
    ["Total amount", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.totalAmount, true],
    ["Buyer's name", paymentRow?.buyerId || ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.buyerName, false],
    ["Distributor's name", paymentRow?.sellerId || ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.distributorName, false],
    ["Payment method", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.paymentMethod, false],
    ["Distributor's account", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.distributorAccount, true],
    ["Bank name", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.bankName, true],
    ["Date created", paymentRow?.dateTime || ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.dateCreated, false],
  ] as const;

  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-[500px] overflow-hidden bg-white text-gray1 shadow-xl">
      <header className="flex h-[100px] items-end justify-between border-b border-gray5 px-10 pb-5 pt-10">
        <h1 className="text-2xl font-semibold leading-10">Invoice Details</h1>
        <Link
          href="/dashboard/admin/payment"
          aria-label="Close invoice details"
          className="flex size-6 items-center justify-center"
        >
          <X size={24} />
        </Link>
      </header>

      <main className="px-10 pt-6">
        <div className="flex h-[660px] w-[420px] flex-col gap-6">
          {rows.map(([label, value, emphasized]) => (
            <div key={label} className="space-y-2">
              <p className="text-sm leading-5 text-gray2">{label}</p>
              <p className={`${emphasized ? "text-lg font-medium" : "text-base"} leading-6 text-gray1`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
