"use client";

import Link from "next/link";
import { CheckSquare, X } from "lucide-react";

const detailRows = [
  ["Order ID", "This will be the ID number", false],
  ["Buyer ID", "This will be the name of the item", false],
  ["Seller ID", "This will be the name of the item", false],
  ["Name of item", "This will be the name of the item", false],
  ["Engineer ID", "This will be the name of the item", false],
  ["Amount", "\u20a650,000", true],
  ["Age of days", "2 - days", false],
] as const;

export default function AdminPaymentEscrowDetailPage() {
  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-[500px] overflow-hidden bg-white text-gray1 shadow-xl">
      <header className="flex h-[100px] items-end justify-between border-b border-gray5 px-10 pb-5 pt-10">
        <h1 className="text-2xl font-semibold leading-10">Invoice Details</h1>
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
              <span className="text-lg font-normal leading-7 text-white">Under dispute</span>
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

      <div className="absolute left-10 top-[829px] flex h-[60px] w-[420px] items-center justify-center rounded-[14px] bg-primary py-4">
        <button type="button" className="text-lg font-normal leading-8 text-white">
          Reverse Escrow
        </button>
      </div>
    </div>
  );
}
