"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckSquare, X } from "lucide-react";

import { ADMIN_PAYMENT_ESCROW_FIGMA_FALLBACK } from "@/constants/adminFigmaFallbacks";

const NOT_AVAILABLE = "Not available";

const pickParam = (
  searchParams: URLSearchParams,
  key: string,
  fallback: string,
) => searchParams.get(key)?.trim() || fallback;

export default function AdminPaymentEscrowDetailPage() {
  const searchParams = useSearchParams();

  const detailRows = [
    ["Order ID", pickParam(searchParams, "orderId", NOT_AVAILABLE), false],
    ["Buyer ID", pickParam(searchParams, "buyerId", NOT_AVAILABLE), false],
    ["Seller ID", pickParam(searchParams, "sellerId", NOT_AVAILABLE), false],
    ["Name of item", pickParam(searchParams, "itemName", NOT_AVAILABLE), false],
    ["Engineer ID", pickParam(searchParams, "engineerId", ADMIN_PAYMENT_ESCROW_FIGMA_FALLBACK.engineerId), false],
    ["Amount", pickParam(searchParams, "amount", NOT_AVAILABLE), true],
    ["Age of days", ADMIN_PAYMENT_ESCROW_FIGMA_FALLBACK.ageOfDays, false],
  ] as const;

  const status = pickParam(searchParams, "status", "Pending");

  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-[500px] overflow-hidden bg-white text-gray1 shadow-xl">
      <header className="flex min-h-16 items-end justify-between border-b border-gray5 px-6 pb-5 pt-10 sm:px-10">
        <h1 className="text-2xl font-semibold leading-10">Escrow Details</h1>
        <Link
          href="/dashboard/admin/payment"
          aria-label="Close escrow details"
          className="flex size-6 shrink-0 items-center justify-center"
        >
          <X size={24} strokeWidth={1.75} />
        </Link>
      </header>

      <main className="h-[calc(100vh-4rem)] overflow-y-auto px-6 pb-8 pt-6 sm:px-10">
        <section className="flex w-full flex-col gap-5">
          <div className="flex min-h-[88px] items-center justify-between rounded-2xl border border-[#FFF7F0] bg-[#FFF7F0] px-8 py-5">
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

          <div className="mt-4 flex h-11 w-full items-center justify-center rounded-[14px] bg-primary py-4 opacity-60 sm:h-[60px]">
            <button type="button" className="cursor-not-allowed text-lg font-normal leading-8 text-white" disabled>
              Reverse Escrow
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
