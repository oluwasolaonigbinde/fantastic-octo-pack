"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, SlidersHorizontal, Banknote, Layers, Percent, Info } from "lucide-react";

import Header from "../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";
import { agentEscrowOrders } from "../mockdata";

export default function AgentEscrowPage() {
  const [search, setSearch] = useState({ businessType: "", orderId: "", status: "" });

  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      <Header title="ESCROW Management" description="Wednesday 10th September, 2025" />
      <main className="min-h-[calc(100vh-100px)] space-y-4 bg-[#F5F7FA] px-5 py-6 md:p-4">

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total amount in ESCROW", value: "₦150,000", meta: "From 10 active loans", icon: <Banknote size={20} className="text-[#F97316]" />, bg: "#FEF3C7" },
            { label: "Total commission", value: "₦150,000", meta: "Eligible commission", icon: <Layers size={20} className="text-[#10B981]" />, bg: "#D1FAE5" },
            { label: "ESCROW released", value: "₦150,000", meta: "For this month", icon: <Percent size={20} className="text-[#F59E0B]" />, bg: "#FEF3C7" },
            { label: "Pending release", value: "5", meta: "Orders in progress", icon: <Layers size={20} className="text-[#6366F1]" />, bg: "#EEF2FF" },
          ].map((card) => (
            <div
              key={card.label}
              className="flex min-h-[126px] flex-col justify-between rounded-2xl border border-[#DDE0E5] bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-[#6B7280]">{card.label}</p>
                  <p className="mt-1 text-xl font-semibold text-[#111827]">{card.value}</p>
                </div>
                <span
                  className="flex size-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: card.bg }}
                >
                  {card.icon}
                </span>
              </div>
              <p className="text-xs text-[#0669D9]">{card.meta}</p>
            </div>
          ))}
        </div>

        {/* How ESCROW works info box */}
        <div className="flex min-h-[150px] items-start gap-3 rounded-xl bg-[#EAF8FF] p-3 md:min-h-[115px] md:p-5">
          <Info size={18} className="mt-0.5 shrink-0 text-[#0669D9]" />
          <div>
            <p className="text-lg font-medium text-[#0B3B75] md:text-lg">How ESCROW works</p>
            <p className="mt-1 text-xs leading-5 text-[#07529E] md:mt-2 md:text-base md:leading-6">
              When a buyer pays for an order, the money is held securely in escrow. Once the
              delivery is confirmed and accepted, the funds are released to the distributor, and
              your 20% commission is automatically credited to your wallet.
            </p>
          </div>
        </div>

        {/* Table card */}
        <div className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
          <p className="mb-7 text-lg font-semibold text-[#111827] md:mb-12 md:text-xl">
            Active Escrow Orders
          </p>

          {/* Filters */}
          <p className="mb-7 text-base text-[#111827] md:mb-4">Filter list by:</p>
          <div className="mb-10 flex flex-col gap-6 sm:flex-wrap sm:flex-row sm:items-end">
            <div className="flex-1 sm:min-w-[140px] lg:flex-none lg:w-[251px]">
              <label className="mb-3 block text-base text-[#111827]">Enter business type</label>
              <input
                type="text"
                placeholder="Enter business type"
                value={search.businessType}
                onChange={(e) => setSearch((s) => ({ ...s, businessType: e.target.value }))}
                className="h-[60px] w-full rounded-2xl border border-[#DDE0E5] px-4 text-base placeholder:text-[#C4CBD5] focus:outline-none focus:ring-2 focus:ring-[#0669D9]/30"
              />
            </div>
            <div className="flex-1 sm:min-w-[140px] lg:flex-none lg:w-[251px]">
              <label className="mb-3 block text-base text-[#111827]">Enter order ID</label>
              <input
                type="text"
                placeholder="Enter order ID"
                value={search.orderId}
                onChange={(e) => setSearch((s) => ({ ...s, orderId: e.target.value }))}
                className="h-[60px] w-full rounded-2xl border border-[#DDE0E5] px-4 text-base placeholder:text-[#C4CBD5] focus:outline-none focus:ring-2 focus:ring-[#0669D9]/30"
              />
            </div>
            <div className="flex-1 sm:min-w-[140px] lg:flex-none lg:w-[251px]">
              <label className="mb-3 block text-base text-[#111827]">Status</label>
              <input
                type="text"
                placeholder="Enter status"
                value={search.status}
                onChange={(e) => setSearch((s) => ({ ...s, status: e.target.value }))}
                className="h-[60px] w-full rounded-2xl border border-[#DDE0E5] px-4 text-base placeholder:text-[#C4CBD5] focus:outline-none focus:ring-2 focus:ring-[#0669D9]/30"
              />
            </div>
            <button
              type="button"
              className="inline-flex h-[60px] w-full items-center justify-center gap-3 rounded-xl bg-[#0669D9] px-6 text-base font-medium text-white sm:w-[250px]"
            >
              <SlidersHorizontal size={16} />
              Filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-[#F3F4F6]">
                  <th className="pb-5 text-left text-base font-medium text-[#667085]">Order ID</th>
                  <th className="pb-5 text-left text-base font-medium text-[#667085]">Name of item</th>
                  <th className="pb-5 text-left text-base font-medium text-[#667085]">Name of seller</th>
                  <th className="hidden pb-5 text-left text-base font-medium text-[#667085] sm:table-cell">Name of buyer</th>
                  <th className="hidden pb-5 text-left text-base font-medium text-[#667085] md:table-cell">Escrow timeline</th>
                  <th className="hidden pb-5 text-left text-base font-medium text-[#667085] md:table-cell">Expected release</th>
                  <th className="hidden pb-5 text-left text-base font-medium text-[#667085] sm:table-cell">Commission</th>
                  <th className="hidden pb-5 text-left text-base font-medium text-[#667085] md:table-cell">Status</th>
                  <th className="hidden pb-5 text-left text-base font-medium text-[#667085] md:table-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {agentEscrowOrders.map((row, idx) => (
                  <tr key={`${row.id}-${idx}`} className="border-b border-[#F9FAFB]">
                    <td className="py-5 text-[#111827]">{row.id}</td>
                    <td className="py-5 text-[#111827]">{row.itemName}</td>
                    <td className="py-5 text-[#111827]">{row.sellerName}</td>
                    <td className="hidden py-5 text-[#111827] sm:table-cell">{row.buyerName}</td>
                    <td className="hidden py-5 text-[#111827] md:table-cell">{row.escrowTimeline}</td>
                    <td className="hidden py-5 text-[#111827] md:table-cell">{row.expectedRelease}</td>
                    <td className="hidden py-5 text-[#111827] sm:table-cell">{row.commission}</td>
                    <td className="hidden py-5 text-sm font-medium text-[#F97316] md:table-cell">{row.status}</td>
                    <td className="hidden py-5 md:table-cell">
                      <Link
                        href={`/dashboard/agent/orders/${row.id}-${idx}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-[#0669D9]"
                      >
                        <Eye size={16} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </ProtectedRoute>
  );
}
