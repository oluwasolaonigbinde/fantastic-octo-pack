"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK } from "@/constants/adminFigmaFallbacks";

const pickParam = (
  searchParams: URLSearchParams,
  key: string,
  fallback: string,
) => searchParams.get(key)?.trim() || fallback;

export default function AdminPaymentInvoiceDetailPage() {
  const searchParams = useSearchParams();

  const rows = [
    ["Invoice ID", pickParam(searchParams, "orderId", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.invoiceId), false],
    ["Item", pickParam(searchParams, "itemName", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.itemName), false],
    ["Unit price", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.unitPrice, true],
    ["Quantity", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.quantity, false],
    ["Total amount", pickParam(searchParams, "amount", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.totalAmount), true],
    ["Buyer's name", pickParam(searchParams, "buyerId", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.buyerName), false],
    ["Distributor's name", pickParam(searchParams, "sellerId", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.distributorName), false],
    ["Payment method", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.paymentMethod, false],
    ["Distributor's account", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.distributorAccount, true],
    ["Bank name", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.bankName, true],
    ["Date created", pickParam(searchParams, "dateTime", ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.dateCreated), false],
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
