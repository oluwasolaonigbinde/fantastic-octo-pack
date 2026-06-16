"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";

import type { BusinessOwner, KycStatus } from "../mockdata";

function KycBadge({ status }: { status: KycStatus }) {
  if (status === "Approved") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-[#059669]">
        <CheckCircle2 size={14} />
        Approved
      </span>
    );
  }
  if (status === "Pending") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-[#D97706]">
        <Clock size={14} />
        Pending
      </span>
    );
  }
  return (
    <span className="text-sm font-medium text-[#DC2626]">{status}</span>
  );
}

interface AgentBusinessTableProps {
  rows: BusinessOwner[];
  typeLabel: string;
}

export function AgentBusinessTable({ rows, typeLabel }: AgentBusinessTableProps) {
  return (
    <div>
      <p className="mb-10 text-lg font-semibold text-[#111827]">All {typeLabel}s</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-[#F3F4F6]">
              <th className="pb-6 text-left text-base font-medium text-[#667085]">
                Name of {typeLabel.toLowerCase()}
              </th>
              <th className="pb-6 text-left text-base font-medium text-[#667085]">
                Email address
              </th>
              <th className="pb-6 text-left text-base font-medium text-[#667085]">
                Phone number
              </th>
              <th className="pb-6 text-left text-base font-medium text-[#667085]">
                KYC status
              </th>
              <th className="pb-6 text-left text-base font-medium text-[#667085]">
                Total orders
              </th>
              <th className="pb-6 text-left text-base font-medium text-[#667085]">
                Earnings
              </th>
              <th className="pb-6 text-left text-base font-medium text-[#667085]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[#F9FAFB]">
                <td className="py-6 text-[#111827]">
                  <span className="hidden md:inline">1. </span>
                  {row.name}
                </td>
                <td className="py-6 text-[#111827]">{row.email}</td>
                <td className="py-6 text-[#111827]">{row.phone}</td>
                <td className="py-6">
                  <KycBadge status={row.kycStatus} />
                </td>
                <td className="py-6 text-[#111827]">{row.totalOrders}</td>
                <td className="py-6 text-[#111827]">{row.earnings}</td>
                <td className="py-6">
                  <Link
                    href={`/dashboard/agent/business-owners/${row.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#0669D9]"
                  >
                    View more <ArrowRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
