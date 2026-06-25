"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckSquare, X } from "lucide-react";

import { ADMIN_PAYMENT_ESCROW_FIGMA_FALLBACK } from "@/constants/adminFigmaFallbacks";

const pickParam = (
  searchParams: URLSearchParams,
  key: string,
  fallback: string,
) => searchParams.get(key)?.trim() || fallback;

export default function AdminPaymentEscrowDetailPage() {
  const searchParams = useSearchParams();

  const detailRows = [
    ["Order ID", pickParam(searchParams, "orderId", ADMIN_PAYMENT_ESCROW_FIGMA_FALLBACK.orderId), false],
    ["Buyer ID", pickParam(searchParams, "buyerId", ADMIN_PAYMENT_ESCROW_FIGMA_FALLBACK.buyerId), false],
    ["Seller ID", pickParam(searchParams, "sellerId", ADMIN_PAYMENT_ESCROW_FIGMA_FALLBACK.sellerId), false],
    ["Name of item", pickParam(searchParams, "itemName", ADMIN_PAYMENT_ESCROW_FIGMA_FALLBACK.itemName), false],
    ["Engineer ID", pickParam(searchParams, "engineerId", ADMIN_PAYMENT_ESCROW_FIGMA_FALLBACK.engineerId), false],
    ["Amount", pickParam(searchParams, "amount", ADMIN_PAYMENT_ESCROW_FIGMA_FALLBACK.amount), true],
    ["Age of days", ADMIN_PAYMENT_ESCROW_FIGMA_FALLBACK.ageOfDays, false],
  ] as const;

  const status = pickParam(searchParams, "status", "Pending");

  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-[500px] overflow-hidden bg-white text-gray1 shadow-xl">
      <header className="flex h-[100px] items-end justify-between border-b border-gray5 px-10 pb-5 pt-10">
        <h1 className="text-2xl font-semibold leading-10">Escrow Details</h1>
        <Link
          href="/dashboard/admin/payment"
          aria-label="Close escrow details"
          className="flex size-6 items-center justify-center"
        >
          <X size={24} strokeWidth={1.75} />
        </Link>
      </header>

      <main className="px-10 pt-6">
        <section className="flex h-[660px] w-[420px] flex-col gap-5">
          <div className="flex h-[88px] items-center justify-between rounded-2xl border border-[#FFF7F0] bg-[#FFF7F0] px-8 py-5">
            <p className="text-lg font-medium leading-6 text-[#272B36]">Request Status</p>
            <div className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FE6E00] px-[18px] py-[11px]">
              <CheckSquare size={18} strokeWidth={2.25} className="text-white" />
              <span className="text-lg font-normal leading-7 text-white">
                {status}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {detailRows.map(([label, value, emphasized]) => (
              <div key={label} className="space-y-2">
                <p className="text-sm font-normal leading-5 text-gray2">{label}</p>
                <p
                  className={`${
                    emphasized ? "text-lg font-medium" : "text-base font-normal"
                  } leading-6 text-gray1`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="absolute left-10 top-[829px] flex h-[60px] w-[420px] items-center justify-center rounded-[14px] bg-primary py-4 opacity-60">
        <button type="button" className="cursor-not-allowed text-lg font-normal leading-8 text-white" disabled>
          Reverse Escrow
        </button>
      </div>
    </div>
  );
}
