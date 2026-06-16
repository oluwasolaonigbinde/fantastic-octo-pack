"use client";

import Link from "next/link";
import { CheckSquare, X } from "lucide-react";

const detailRows = [
  ["Distributor's name", "Oluwatobiloba Babatunde"],
  ["Distributor's phone number", "08130000000"],
  ["Distributor's email address", "oluwatunde@gmail.com"],
  ["Product name", "The name of the product"],
  ["Quantity", "12"],
  ["Unit price", "\u20a660,028.00"],
  ["Total price", "\u20a6780,070.00"],
  ["Date of order placed", "12/09/2025  -  12:20am"],
  ["Proposed delivery date", "12/09/2025"],
] as const;

export default function AdminRfqDetailPage() {
  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-[500px] overflow-y-auto bg-white text-gray1 shadow-xl">
      <header className="flex h-[100px] items-end justify-between border-b border-gray5 px-10 pb-5 pt-10">
        <h1 className="text-2xl font-semibold leading-10">Order Details</h1>
        <Link
          href="/dashboard/admin/rfqs-orders"
          aria-label="Close order details"
          className="flex size-6 items-center justify-center"
        >
          <X size={24} strokeWidth={1.75} />
        </Link>
      </header>

      <main className="px-10 pt-6">
        <section className="flex w-[420px] flex-col gap-5">
          <div className="flex h-[88px] items-center justify-between rounded-2xl border border-[#FFE079] bg-[#FFF6D9] px-8 py-5">
            <p className="text-lg font-medium leading-6 text-[#272B36]">Order Status</p>
            <div className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FFC000] px-[18px] py-[11px]">
              <CheckSquare size={18} strokeWidth={2.25} className="text-white" />
              <span className="text-lg font-normal leading-7 text-white">Pending</span>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {detailRows.map(([label, value]) => (
              <div key={label} className="space-y-2">
                <p className="text-sm font-normal leading-5 text-gray2">{label}</p>
                <p className="text-base font-normal leading-6 text-gray1">{value}</p>
              </div>
            ))}

            <div className="space-y-2">
              <p className="text-sm font-normal leading-5 text-gray2">Payment status</p>
              <p className="text-lg font-bold leading-8 text-success">NO</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-normal leading-5 text-gray2">Additional note</p>
              <p className="text-base font-normal leading-6 text-gray1">
                Figma ipsum component variant main layer.
              </p>
              <p className="text-base font-normal leading-6 text-gray1">
                Outline arrange main vector text. Figma follower auto reesizing bold selection opacity
                device flatten. Community editor text ellipse rotate arrow asset vertical connection.
                Stroke line align component font rectangle union. Inspect.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
