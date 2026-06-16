"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Coins, CreditCard, Eye, FileText, RefreshCw, Repeat, SlidersHorizontal, TrendingUp, Users } from "lucide-react";
import Header from "../../component/header";
import { Button, Input, SingleSelect, SummaryCard } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ------------------------------------------------------------------ */
/*  Mock data matching Figma                                           */
/* ------------------------------------------------------------------ */

const SUBSCRIBER_ROWS = Array.from({ length: 6 }).map((_, i) => ({
  id: `sub-${i + 1}`,
  name: "Samuel Smart",
  currentPlan: "Free",
  startDate: "28/01/2025",
  endDate: "08/07/2025",
  usageLimit: "3 Months",
  renewalStatus: "Auto-renew",
  status: "Active" as const,
  expRenewalDate: "20/03/2025",
  arpu: "₦0",
}));

const performanceBars = [
  [0, 68, 44],
  [51, 35, 25],
  [58, 60, 78],
  [34, 42, 45],
  [50, 60, 40],
  [70, 40, 25],
  [55, 45, 35],
  [90, 50, 30],
  [65, 35, 20],
  [75, 55, 40],
  [60, 40, 30],
  [85, 45, 25],
];

const renewalData = [
  40, 55, 45, 70, 60, 80, 65, 90, 75, 85, 70, 95,
];
const expiryData = [
  30, 40, 35, 50, 45, 55, 50, 60, 55, 65, 60, 70,
];


/* ------------------------------------------------------------------ */
/*  Charts (CSS-only to match Figma visual)                            */
/* ------------------------------------------------------------------ */

function PerformanceChart() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yAxis = ["250", "200", "150", "100", "50"];

  return (
    <div className="min-h-[564px] w-[791px] rounded-2xl border border-gray5 bg-white p-3 md:min-h-0 md:w-auto md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div>
          <h3 className="text-base font-medium leading-5 text-gray1 md:medium3">Monthly Subscription Performance</h3>
          <p className="mt-1 text-[11px] leading-4 text-gray3 md:text-sm">
            Month on month comparison of user subscription
          </p>
        </div>
        <button
          type="button"
          disabled
          className="mt-4 inline-flex h-[60px] w-[152px] items-center justify-between self-start rounded-xl border border-gray5 px-3 text-sm text-gray2 md:mt-0 md:h-auto md:w-auto md:gap-2 md:py-2"
        >
          2025
          <CalendarDays size={15} />
        </button>
      </div>
      <div className="mt-4 hidden flex-wrap items-center gap-4 text-xs text-gray3 md:flex">
        {[
          { label: "Free plan", color: "bg-[#CCE6FF]" },
          { label: "Basic plan", color: "bg-[#F6D98E]" },
          { label: "Premium plan", color: "bg-[#BDEBC8]" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${item.color}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="mb-16 mt-5 flex h-[320px] rounded-2xl bg-white px-1 pb-4 pt-3 md:hidden">
        <div className="flex flex-col justify-between pb-7 pr-3 text-xs text-gray3">
          {yAxis.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="flex flex-1 flex-col">
          <div className="flex justify-end pb-2 text-xs text-gray3">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#CCE6FF]" />
              Free plan
            </span>
          </div>
          <div className="flex flex-1 items-end justify-between gap-5">
            {performanceBars.slice(0, 4).map((group, idx) => (
              <div key={`mobile-perf-${idx}`} className="flex flex-col items-center gap-3">
                <div className="flex h-[210px] items-end gap-1">
                  <span className="w-2.5 rounded-t-full bg-gradient-to-b from-[#CCE6FF] to-white" style={{ height: `${group[0]}%` }} />
                  <span className="w-2.5 rounded-t-full bg-gradient-to-b from-[#F6D98E] to-white" style={{ height: `${group[1]}%` }} />
                  <span className="w-2.5 rounded-t-full bg-gradient-to-b from-[#FAD9BF] to-white md:from-[#BDEBC8]" style={{ height: `${group[2]}%` }} />
                </div>
                <span className="text-xs text-gray3">{months[idx]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 hidden h-[180px] items-end gap-3 rounded-2xl bg-[#FCFCFD] px-4 pb-6 pt-4 md:flex">
        {performanceBars.map((group, idx) => (
          <div key={`perf-${idx}`} className="flex flex-1 flex-col items-center gap-3">
            <div className="flex h-[130px] items-end gap-0.5">
              <span className="w-2 rounded-t-full bg-[#CCE6FF]" style={{ height: `${group[0]}%` }} />
              <span className="w-2 rounded-t-full bg-[#F6D98E]" style={{ height: `${group[1]}%` }} />
              <span className="w-2 rounded-t-full bg-[#BDEBC8]" style={{ height: `${group[2]}%` }} />
            </div>
            <span className="text-xs text-gray3">{months[idx]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MostPurchasedDonut() {
  return (
    <div className="min-h-[381px] w-[320px] rounded-2xl border border-gray5 bg-white p-3 md:min-h-0 md:w-auto md:p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="medium3 text-gray1">Most purchased plans</h3>
        <span className="hidden text-xs text-gray3">Apr</span>
      </div>
      <div className="mt-6 flex justify-center">
        <div
          className="relative size-40 rounded-full md:hidden"
          style={{
            background:
              "conic-gradient(from 310deg, #FF8A00 0deg 72deg, #F6B90A 72deg 180deg, #0669D9 180deg 360deg)",
          }}
        />
        <div className="relative hidden rounded-full md:block md:size-44 md:bg-[conic-gradient(#0669D9_0deg_162deg,#F6B90A_162deg_270deg,#13A83B_270deg_360deg)]">
          <div className="absolute inset-[24px] hidden rounded-full bg-white md:block" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {[
          { label: "20% - Premium plan", color: "bg-[#FF8A00]" },
          { label: "30% - Basic plan", color: "bg-[#F6B90A]" },
          { label: "50% - Free plan", color: "bg-primary" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 text-sm text-gray2">
            <span className={`size-3 rounded-full ${item.color}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpiryRenewalPie() {
  return (
    <div className="min-h-[361px] w-[319px] rounded-2xl border border-gray5 bg-white p-3 md:min-h-0 md:w-auto md:p-5">
      <h3 className="medium3 text-gray1">Most purchased plans</h3>
      <div className="mt-6 flex justify-center">
        <div className="relative size-40 rounded-full bg-[conic-gradient(#F6B90A_0deg_108deg,#0669D9_108deg_360deg)]">
          <span className="absolute right-10 top-14 text-[11px] font-medium text-white">30%</span>
          <span className="absolute bottom-12 left-12 text-[11px] font-medium text-white">70%</span>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {[
          { label: "30% - Expiry rate", color: "bg-[#F6B90A]" },
          { label: "70% - Renewal rate", color: "bg-primary" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 text-sm text-gray2">
            <span className={`size-3 rounded-sm ${item.color}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpiryRenewalChart() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yAxis = ["250", "200", "150", "100", "50"];

  return (
    <div className="min-h-[490px] w-[691px] rounded-2xl border border-gray5 bg-white p-3 md:min-h-0 md:w-auto md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div>
          <h3 className="text-base font-medium leading-5 text-gray1 md:medium3">Expiry and Renewal Rates</h3>
          <p className="mt-1 text-[11px] leading-4 text-gray3 md:text-sm">
            Month by month comparison of expiry and renewal rates
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex h-[60px] w-[294px] items-center justify-between self-start rounded-xl border border-gray5 px-3 text-sm text-gray2 md:h-auto md:w-auto md:gap-2 md:py-2"
        >
          2025
          <CalendarDays size={15} />
        </button>
      </div>
      <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-gray3 md:mt-4 md:justify-start md:text-xs">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-[#F6B90A] md:rounded-full" />
          <span>Expiry rates</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-primary md:rounded-full" />
          <span>Renewal rates</span>
        </div>
      </div>
      <div className="mt-6 flex h-[150px] overflow-hidden rounded-2xl bg-[#FCFCFD] px-1 pb-4 pt-3 md:hidden">
        <div className="flex flex-col justify-between pb-7 pr-3 text-xs text-gray3">
          {yAxis.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="flex flex-1 items-end justify-between gap-3 opacity-0">
          {months.map((month, index) => (
            <div key={`mobile-expiry-${month}`} className="flex flex-col items-center gap-3">
              <div className="flex h-[200px] items-end gap-1">
                <span className="w-2 rounded-t-full bg-[#F6B90A]" style={{ height: `${expiryData[index]}%` }} />
                <span className="w-2 rounded-t-full bg-primary" style={{ height: `${renewalData[index]}%` }} />
              </div>
              <span className="text-[10px] text-gray3">{month}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Simplified line chart using SVG */}
      <div className="mt-6 hidden rounded-2xl bg-[#FCFCFD] p-4 md:block">
        <svg viewBox="0 0 480 160" className="h-[160px] w-full" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#F6B90A"
            strokeWidth="2"
            points={expiryData.map((v, i) => `${i * (480 / 11)},${160 - v * 1.6}`).join(" ")}
          />
          <polyline
            fill="none"
            stroke="#0669D9"
            strokeWidth="2"
            points={renewalData.map((v, i) => `${i * (480 / 11)},${160 - v * 1.6}`).join(" ")}
          />
        </svg>
        <div className="flex justify-between px-1 text-xs text-gray3">
          {months.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubscriptionMetricCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  iconBg: string;
}) {
  return (
    <div className="flex min-h-[128px] flex-col justify-between rounded-2xl border border-gray5 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] leading-4 text-gray1">{title}</p>
          <p className="mt-2 text-base font-medium leading-5 text-gray1">{value}</p>
        </div>
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </span>
      </div>
      <p className="text-[10px] leading-4 text-gray3">{subtitle}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function AdminSubscriptionsPage() {
  return (
    <div className="overflow-x-hidden">
      <Header
        title="Subscriptions"
        description="View all metrics and create new subscriptions"
      />

      <div className="max-w-full space-y-4 overflow-x-hidden px-5 pb-4 pt-[26px] md:space-y-8 md:p-6">
        {/* Summary cards */}
        <div className="grid min-w-0 grid-cols-2 gap-4 md:hidden">
          <SubscriptionMetricCard
            title="Total subscription"
            value="25"
            icon={<FileText size={16} className="text-[#F6B90A]" />}
            iconBg="bg-[#FFF5DB]"
            subtitle="For this month"
          />
          <SubscriptionMetricCard
            title="Active subscribers"
            value="10"
            icon={<RefreshCw size={16} className="text-[#13A83B]" />}
            iconBg="bg-[#E8FAEE]"
            subtitle="For this month"
          />
          <SubscriptionMetricCard
            title="Subscription revenue"
            value="₦518,886.98"
            icon={<TrendingUp size={16} className="text-[#F6B90A]" />}
            iconBg="bg-[#FFF5DB]"
            subtitle="↗ 31% today"
          />
          <SubscriptionMetricCard
            title="Commissions"
            value="₦518,886.98"
            icon={<Coins size={16} className="text-primary" />}
            iconBg="bg-[#E7F1FF]"
            subtitle="For this month"
          />
        </div>
        <div className="hidden min-w-0 gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total subscription"
            value="25"
            icon={<Users size={18} className="text-primary" />}
            iconBg="bg-[#E7F1FF]"
            subtitle="For this month"
          />
          <SummaryCard
            title="Active subscribers"
            value="10"
            icon={<Repeat size={18} className="text-[#C04FE0]" />}
            iconBg="bg-[#F8E8FF]"
            subtitle="For this month"
          />
          <SummaryCard
            title="Subscription revenue"
            value="₦518,886.98"
            icon={<CreditCard size={18} className="text-[#13A83B]" />}
            iconBg="bg-[#E8FAEE]"
            subtitle="↗ 31% today"
          />
          <SummaryCard
            title="Commissions"
            value="₦518,886.98"
            icon={<CreditCard size={18} className="text-[#F6B90A]" />}
            iconBg="bg-[#FFF5DB]"
            subtitle="For this month"
          />
        </div>

        {/* Quick Links */}
        <section className="card h-[160px] w-[320px] md:h-auto md:w-auto">
          <h3 className="medium3 text-gray1">Quick Links</h3>
          <p className="mt-1 text-sm text-gray3">
            What would you like to perform?
          </p>
          <div className="mt-4">
            <Link href="/dashboard/admin/subscriptions/plans/create">
              <Button
                title="Create subscription plan"
                iconRight={<ArrowRight size={16} />}
                className="-ml-2 h-[60px] w-[297px] md:ml-0 md:h-14 md:w-auto"
                type="button"
              />
            </Link>
          </div>
        </section>

        {/* Charts row */}
        <div className="grid min-w-0 gap-5 xl:grid-cols-[1.6fr_1fr]">
          <div className="min-w-0">
            <PerformanceChart />
          </div>
          <div className="min-w-0">
            <MostPurchasedDonut />
          </div>
        </div>

        {/* Subscriber table */}
        <section className="card min-h-[1052px] w-[1160px] min-w-0 space-y-5 overflow-hidden p-3 md:min-h-0 md:w-auto md:space-y-4 md:p-5">
          <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between">
            <div>
              <h3 className="medium3 text-gray1">All subscribed users</h3>
              <p className="text-sm text-gray3">
                View all seller/distributors/OEMs/Engineer subscribed
              </p>
            </div>
            <button
              type="button"
              disabled
              className="inline-flex h-14 w-full items-center justify-between rounded-xl border border-gray5 px-3 text-sm text-gray2 md:h-auto md:w-auto md:gap-2 md:py-2"
            >
              2025
              <CalendarDays size={15} />
            </button>
          </div>
          <p className="text-xs font-medium text-gray3 md:uppercase md:tracking-[0.12em]">
            Filter table list by:
          </p>
          <div className="grid gap-5 md:gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
            <SingleSelect
              label="Current plan"
              placeholder="Enter current plan"
              onValueChange={() => {}}
              options={[
                { value: "all", label: "All plans" },
                { value: "free", label: "Free" },
                { value: "basic", label: "Basic" },
                { value: "premium", label: "Premium" },
              ]}
            />
            <Input label="Start - End date" placeholder="From - To" />
            <SingleSelect
              label="Status"
              placeholder="Enter status"
              onValueChange={() => {}}
              options={[
                { value: "all", label: "All statuses" },
                { value: "active", label: "Active" },
                { value: "expired", label: "Expired" },
                { value: "trial", label: "On Trial" },
              ]}
            />
            <Button
              title="Filter"
              iconLeft={<SlidersHorizontal size={16} />}
              className="h-[60px] self-end md:h-14"
              type="button"
            />
          </div>
          <div className="mt-5 max-w-full overflow-hidden md:mt-0 md:rounded-2xl md:border md:border-gray5">
            <Table
              className="min-w-[1108px] [&_td]:h-12 [&_td]:text-sm [&_th]:h-11 [&_th]:text-sm md:[&_td]:h-12 md:[&_td]:text-base md:[&_th]:h-11 md:[&_th]:text-base"
              containerClassName="max-w-full"
            >
              <TableHeader className="[&_tr]:bg-white md:[&_tr]:bg-[#F3F4F6]">
                <TableRow>
                  <TableHead>Name of subscriber</TableHead>
                  <TableHead>Current plan</TableHead>
                  <TableHead>Start date</TableHead>
                  <TableHead>End date</TableHead>
                  <TableHead>Usage limit</TableHead>
                  <TableHead>Renewal status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Exp/renewal date</TableHead>
                  <TableHead>ARPU</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SUBSCRIBER_ROWS.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className={index === SUBSCRIBER_ROWS.length - 1 ? "hidden md:table-row" : undefined}
                  >
                    <TableCell className="min-w-[160px]">
                      <div className="flex items-center gap-3">
                        <span className="size-8 shrink-0 rounded-full bg-gray5" />
                        <span className="font-medium text-gray1">
                          {row.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{row.currentPlan}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.startDate}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.endDate}</TableCell>
                    <TableCell>{row.usageLimit}</TableCell>
                    <TableCell>{row.renewalStatus}</TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-success">
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{row.expRenewalDate}</TableCell>
                    <TableCell>{row.arpu}</TableCell>
                    <TableCell>
                      <Button
                        title="View"
                        variant="primaryLight"
                        size="sm"
                        iconLeft={<Eye size={14} />}
                        className="w-auto"
                        type="button"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Bottom charts row */}
        <div className="grid min-w-0 gap-5 xl:grid-cols-[1fr_1.6fr]">
          <div className="min-w-0">
            <div className="md:hidden">
              <ExpiryRenewalPie />
            </div>
            <div className="hidden md:block">
              <MostPurchasedDonut />
            </div>
          </div>
          <div className="min-w-0">
            <ExpiryRenewalChart />
          </div>
        </div>
      </div>
    </div>
  );
}
