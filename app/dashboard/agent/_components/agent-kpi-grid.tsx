"use client";

import { Banknote, Layers, Percent } from "lucide-react";

interface AgentKpiGridProps {
  allSavings: string;
  availableFunds: string;
  pendingCommissions: string;
  businessesOnboarded: number;
}

interface KpiCardProps {
  title: string;
  value: string;
  meta: string;
  icon: React.ReactNode;
  iconBg: string;
}

function KpiCard({ title, value, meta, icon, iconBg }: KpiCardProps) {
  return (
    <div className="flex min-h-[110px] flex-col justify-between rounded-xl border border-[#DDE0E5] bg-white p-3.5 md:min-h-[126px] md:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13px] text-[#6B7280] md:text-sm">{title}</p>
          <p className="mt-2 whitespace-nowrap text-[17px] font-semibold text-[#111827] md:text-xl">{value}</p>
        </div>
        <span
          className="flex size-8 items-center justify-center rounded-lg md:size-11"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </span>
      </div>
      <p className="text-[11px] text-[#0669D9] md:text-sm">{meta}</p>
    </div>
  );
}

export function AgentKpiGrid({
  allSavings,
  availableFunds,
  pendingCommissions,
  businessesOnboarded,
}: AgentKpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <KpiCard
        title="All earnings"
        value={allSavings}
        meta="Total income earned"
        icon={<Banknote size={20} className="text-[#F97316]" />}
        iconBg="#FEF3C7"
      />
      <KpiCard
        title="Available funds"
        value={availableFunds}
        meta="Funds ready for withdrawal"
        icon={<Percent size={20} className="text-[#10B981]" />}
        iconBg="#D1FAE5"
      />
      <KpiCard
        title="Pending commissions"
        value={pendingCommissions}
        meta="Earnings awaiting release"
        icon={<Layers size={20} className="text-[#F59E0B]" />}
        iconBg="#FEF3C7"
      />
      <KpiCard
        title="Businesses onboarded"
        value={String(businessesOnboarded).padStart(2, "0")}
        meta="Active sellers on platform"
        icon={<Layers size={20} className="text-[#0D8BFF]" />}
        iconBg="#EAF3FF"
      />
    </div>
  );
}
