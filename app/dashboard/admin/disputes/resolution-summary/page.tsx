"use client";

import Link from "next/link";
import { X } from "lucide-react";

const rows = [
  ["Invoice ID", "This will be the ID number", false],
  ["Item", "This will be the name of the item", false],
  ["Unit price", "₦50,000", true],
  ["Quantity", "10", false],
  ["Total amount", "₦500,000", true],
  ["Buyer’s name", "This will be the name of the buyer", false],
  ["Distributor’s name", "This will be the name of the distributor", false],
  ["Payment method", "ESCROW", false],
  ["Distributor’s account", "43546536577", true],
  ["Bank name", "Opay", true],
  ["Date created", "25/11/25", false],
] as const;

export default function AdminDisputeResolutionSummaryPage() {
  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-[360px] overflow-hidden bg-white text-gray1 shadow-xl">
      <header className="flex h-[93px] items-center justify-between border-b border-gray5 py-10 pl-5 pr-10">
        <h1 className="text-base font-semibold leading-[18px]">Resolution Summary</h1>
        <Link
          href="/dashboard/admin/disputes"
          aria-label="Close resolution summary"
          className="flex size-6 items-center justify-center"
        >
          <X size={24} />
        </Link>
      </header>

      <main className="px-5 pt-[22px]">
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
