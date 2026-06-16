"use client";

import { ArrowRight, CreditCard, Hourglass, Package, Wallet } from "lucide-react";

export function DistributorKpiGrid({
  salesThisMonth,
  pendingQuotes,
  activeOrders,
  pendingPayments,
}: {
  salesThisMonth: string;
  pendingQuotes: number;
  activeOrders: number;
  pendingPayments: number;
}) {
  const metrics = [
    {
      title: "Sales This Month",
      value: salesThisMonth,
      icon: Wallet,
      iconWrap: "bg-[#E8FFF7] text-[#22C55E]",
    },
    {
      title: "Pending Quotes",
      value: String(pendingQuotes),
      icon: Hourglass,
      iconWrap: "bg-[#EDF2FF] text-[#4F46E5]",
    },
    {
      title: "Active Order",
      value: String(activeOrders),
      icon: Package,
      iconWrap: "bg-[#FFF7E8] text-[#F59E0B]",
    },
    {
      title: "Pending Payment",
      value: String(pendingPayments),
      icon: CreditCard,
      iconWrap: "bg-[#FFF0EB] text-[#FE6E00]",
    },
  ];

  return (
    <section className="rounded-2xl border border-[#DDE0E5] bg-white px-5 py-5">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 xl:gap-0">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.title}
              className={`flex items-center justify-between gap-4 xl:px-7 ${
                index < metrics.length - 1 ? "xl:border-r xl:border-[#DDE0E5]" : ""
              } ${index === 0 ? "xl:pl-0" : ""} ${
                index === metrics.length - 1 ? "xl:pr-0" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex size-[61px] shrink-0 items-center justify-center rounded-2xl ${metric.iconWrap}`}
                >
                  <Icon className="size-7" />
                </div>
                <div>
                  <p className="text-sm leading-6 text-[#6B7280]">{metric.title}</p>
                  <p className="text-[20px] font-semibold leading-8 text-[#111827]">
                    {metric.value}
                  </p>
                </div>
              </div>
              <ArrowRight className="size-8 shrink-0 text-[#111827]" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
