"use client";

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  ClipboardCheck,
  Eye,
  FileText,
  Monitor,
  Users,
} from "lucide-react";

import Header from "../component/header";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/base";
import { ADMIN_DASHBOARD_FIGMA_FALLBACK } from "@/constants/adminFigmaFallbacks";
import { useAppSelector } from "@/hooks/useAppSelector";
import adminService, { type AdminDashboardSummary } from "@/services/adminService";

const POLL_INTERVAL_MS = 60_000;

const compactFormatter = new Intl.NumberFormat("en-NG");
const decimalFormatter = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FIGMA_DASHBOARD_YEAR = 2025;

const EMPTY_SUMMARY: AdminDashboardSummary = {
  users: {
    total: 0,
    buyers: 0,
    distributors: 0,
    oems: 0,
    engineers: 0,
    agents: 0,
  },
  rfqs: {
    total: 0,
    rfqsSent: 0,
    quotesSent: 0,
  },
  revenue: {
    supported: false,
    total: 0,
    monthly: MONTHS.map((month) => ({ month, total: 0 })),
  },
  approvals: {
    total: 0,
    accounts: 0,
    productListings: 0,
  },
  onboardingAnalytics: MONTHS.map((month) => ({
    month,
    buyers: 0,
    distributors: 0,
    oems: 0,
    engineers: 0,
  })),
  topProductsByRfqs: [],
  recentUsers: [],
};

type OverviewValue = string | number;

interface OverviewCardProps {
  title: string;
  mobileTitle?: string;
  value: OverviewValue;
  meta: string;
  mobileMeta?: string;
  icon: ReactNode;
  iconClassName: string;
  loading?: boolean;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return `${date.toLocaleDateString("en-GB")} - ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase()}`;
}

function OverviewCard({
  title,
  mobileTitle,
  value,
  meta,
  mobileMeta,
  icon,
  iconClassName,
  loading = false,
}: OverviewCardProps) {
  return (
    <div className="min-h-[130px] rounded-2xl border border-gray5 bg-white p-3 shadow-[0_4px_12px_rgba(15,23,42,0.04)] md:min-h-0 md:p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-normal leading-4 text-gray2 md:text-sm">
            {mobileTitle ? (
              <>
                <span className="md:hidden">{mobileTitle}</span>
                <span className="hidden md:inline">{title}</span>
              </>
            ) : (
              title
            )}
          </p>
          <p className="mt-2 whitespace-nowrap text-[14px] font-medium leading-5 text-gray1 md:text-[18px] md:leading-6">
            {loading ? "--" : value}
          </p>
          <p className="mt-2 text-[10px] leading-4 text-gray3 md:whitespace-nowrap md:text-[11px]">
            {mobileMeta ? (
              <>
                <span className="md:hidden">
                  {mobileMeta.split("\n").map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
                <span className="hidden md:inline">{meta}</span>
              </>
            ) : (
              meta
            )}
          </p>
        </div>
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-xl md:size-10 ${iconClassName}`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

function RevenueChart({
  monthly,
  supported,
}: {
  monthly: AdminDashboardSummary["revenue"]["monthly"];
  supported: boolean;
}) {
  const maxValue = Math.max(...monthly.map((item) => item.total), 0);

  return (
    <div className="min-h-[428px] overflow-hidden rounded-2xl border border-gray5 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="medium3 text-gray1">Revenue Analysis</h3>
          <p className="mt-1 text-sm text-gray3">
            {supported
              ? "Total revenue for January - December, 2025"
              : "Revenue reporting is not available yet"}
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-xl border border-gray5 px-3 py-2 text-sm text-gray2"
        >
          {FIGMA_DASHBOARD_YEAR}
          <CalendarDays size={15} />
        </button>
      </div>

      <div className="mt-12 flex h-[276px] rounded-2xl bg-[#FCFCFD] px-4 pb-6 pt-4">
        <div className="flex flex-col justify-between pb-6 pr-3 text-xs text-gray3">
          {["25m", "20m", "15m", "10m", "5m", "0"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="flex flex-1 items-end justify-between">
          {monthly.map((item) => {
            const height = maxValue > 0 ? Math.max(8, (item.total / maxValue) * 190) : 8;

            return (
              <div key={item.month} className="flex flex-col items-center gap-3">
                <div
                  className="w-6 rounded-t-[2px] bg-gradient-to-t from-[#F6FBFF] to-[#7FC7FF]"
                  style={{ height: `${height}px` }}
                />
                <span className="text-xs text-gray3">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RfqRatioCard({
  rfqsSent,
  quotesSent,
}: {
  rfqsSent: number;
  quotesSent: number;
}) {
  const total = rfqsSent + quotesSent;
  const quotePercent = total ? Math.round((quotesSent / total) * 100) : 0;
  const rfqPercent = total ? 100 - quotePercent : 0;
  const quoteDegrees = total ? Math.round((quotesSent / total) * 360) : 0;
  const desktopGradientStart = 148;
  const mobileQuotePercent = ADMIN_DASHBOARD_FIGMA_FALLBACK.mobileRfqRatio.quotesPercent;
  const mobileRfqPercent = ADMIN_DASHBOARD_FIGMA_FALLBACK.mobileRfqRatio.rfqsPercent;
  const mobileQuoteDegrees = Math.round((mobileQuotePercent / 100) * 360);

  return (
    <div className="min-h-[361px] w-[319px] rounded-2xl border border-gray5 bg-white p-3 md:min-h-[428px] md:w-auto md:p-5">
      <h3 className="medium3 text-gray1">
        <span className="md:hidden">RFQ Recentage Ratio</span>
        <span className="hidden md:inline">RFQs Percentage Ratio</span>
      </h3>

      <div className="mt-6 flex justify-center">
        <div
          className="relative hidden size-52 rounded-full md:block"
          style={{
            background: `conic-gradient(from ${desktopGradientStart}deg, #F6B90A 0deg ${quoteDegrees}deg, #0669D9 ${quoteDegrees}deg 360deg)`,
          }}
        />
        <div
          className="relative size-40 rounded-full md:hidden"
          style={{
            background: `conic-gradient(#F6B90A 0deg ${mobileQuoteDegrees}deg,#0669D9 ${mobileQuoteDegrees}deg 360deg)`,
          }}
        >
          <span className="absolute left-[57%] top-[36%] text-xs font-semibold text-white">
            {mobileQuotePercent}%
          </span>
          <span className="absolute left-[31%] top-[58%] text-xs font-semibold text-white">
            {mobileRfqPercent}%
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-3 md:hidden">
        <div className="flex items-center gap-3 text-sm text-gray2">
          <span className="size-4 rounded bg-[#F6B90A]" />
          <span>{ADMIN_DASHBOARD_FIGMA_FALLBACK.mobileRfqRatio.quotesLabel}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray2">
          <span className="size-4 rounded bg-primary" />
          <span>{ADMIN_DASHBOARD_FIGMA_FALLBACK.mobileRfqRatio.rfqsLabel}</span>
        </div>
      </div>

      <div className="mt-6 hidden space-y-3 md:block">
        <div className="flex items-center gap-3 text-sm text-gray2">
          <span className="size-6 rounded-lg bg-[#F6B90A]" />
          <span>
            {quotePercent}% - Quotes received ({compactFormatter.format(quotesSent)})
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray2">
          <span className="size-6 rounded-lg bg-primary" />
          <span>
            {rfqPercent}% - Request For Quotes sent ({compactFormatter.format(rfqsSent)})
          </span>
        </div>
      </div>
    </div>
  );
}

function OnboardingChart({
  data,
}: {
  data: AdminDashboardSummary["onboardingAnalytics"];
}) {
  const maxValue = Math.max(
    ...data.flatMap((item) => [
      item.buyers,
      item.distributors,
      item.oems,
      item.engineers,
    ]),
    1,
  );

  const heightFor = (value: number) => Math.max(6, (value / maxValue) * 170);
  const mobileYAxis = ["250", "200", "150", "100", "50", "0"];

  return (
    <div className="min-h-[564px] w-full rounded-2xl border border-gray5 bg-white p-3 md:min-h-[428px] md:w-auto md:p-5">
      <div className="md:hidden">
        <h3 className="text-base font-semibold text-gray1">User Onboarding Analysis</h3>
        <p className="mt-1 text-xs text-gray3">
          Month-on-month comparison of user subscription
        </p>
        <button
          type="button"
          disabled
          className="mt-5 inline-flex w-[150px] items-center justify-between rounded-xl border border-gray5 px-4 py-3 text-sm text-gray2"
        >
          2025
          <CalendarDays size={16} />
        </button>
        <div className="mt-7 flex items-center justify-end text-xs text-gray3">
          <span className="flex items-center gap-2">
            <span className="size-4 rounded border border-[#7FC7FF] bg-[#E8F4FF]" />
            Free plan
          </span>
        </div>
        <div className="mt-4 flex h-[300px] rounded-2xl bg-white px-1 pb-4">
          <div className="flex flex-col justify-between pb-7 pr-5 text-sm text-gray3">
            {mobileYAxis.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="flex flex-1 items-end justify-between gap-2">
            {data.slice(0, 4).map((group) => (
              <div key={`mobile-${group.month}`} className="flex flex-col items-center gap-4">
                <div className="flex h-[210px] items-end gap-1">
                  <span className="w-3 rounded-t-full bg-gradient-to-t from-[#F6FBFF] to-[#7FC7FF]" style={{ height: `${heightFor(group.buyers)}px` }} />
                  <span className="w-3 rounded-t-full bg-gradient-to-t from-[#FFF9EA] to-[#F6B90A]" style={{ height: `${heightFor(group.distributors)}px` }} />
                  <span className="w-3 rounded-t-full bg-gradient-to-t from-[#FFF5EF] to-[#FF7A1A]" style={{ height: `${heightFor(group.engineers)}px` }} />
                </div>
                <span className="text-sm text-gray3">{group.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden items-start justify-between gap-4 md:flex">
        <div>
          <h3 className="medium3 text-gray1">User Onboarding Analytics</h3>
          <p className="mt-1 text-sm text-gray3">
            Month-on-month comparison of users onboarded
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 rounded-xl border border-gray5 px-3 py-2 text-sm text-gray2"
        >
          {FIGMA_DASHBOARD_YEAR}
          <CalendarDays size={15} />
        </button>
      </div>

      <div className="mt-5 hidden flex-wrap items-center justify-center gap-10 text-xs text-gray3 md:flex">
        {[
          { label: "Buyers", color: "bg-[#CCE6FF]" },
          { label: "Distributors", color: "bg-[#F6D98E]" },
          { label: "OEMs", color: "bg-[#BDEBC8]" },
          { label: "Service Engineers", color: "bg-[#F6C0A7]" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`size-4 rounded border ${item.color}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 hidden h-[300px] grid-cols-[48px_1fr] rounded-2xl bg-[#FCFCFD] px-4 pb-6 pt-4 md:grid">
        <div className="flex flex-col justify-between pb-8 pr-3 text-xs text-gray3">
          {["250", "200", "150", "100", "50", "0"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-3">
        {data.map((group, index) => (
          <div
            key={group.month}
            className={`flex flex-col items-center gap-3 ${index > 3 ? "hidden md:flex" : ""}`}
          >
            <div className="flex h-[220px] items-end gap-1">
              <span className="w-2 rounded-t-full bg-gradient-to-t from-[#F6FBFF] to-[#7FC7FF]" style={{ height: `${heightFor(group.buyers)}px` }} />
              <span className="w-2 rounded-t-full bg-gradient-to-t from-[#FFF9EA] to-[#F6B90A]" style={{ height: `${heightFor(group.distributors)}px` }} />
              <span className="w-2 rounded-t-full bg-gradient-to-t from-[#F3FFF6] to-[#25B84E]" style={{ height: `${heightFor(group.oems)}px` }} />
              <span className="w-2 rounded-t-full bg-gradient-to-t from-[#FFF5EF] to-[#FF7A1A]" style={{ height: `${heightFor(group.engineers)}px` }} />
            </div>
            <span className="text-xs text-gray3">{group.month}</span>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}

function StaticTableCard({
  title,
  actionLabel,
  actionHref,
  columns,
  rows,
  emptyText,
  hideActionOnMobile = false,
  mobileHiddenColumnIndexes = [],
  mobileClassName = "",
}: {
  title: string;
  actionLabel: string;
  actionHref: string;
  columns: string[];
  rows: Array<{ id: string; cells: ReactNode[] }>;
  emptyText: string;
  hideActionOnMobile?: boolean;
  mobileHiddenColumnIndexes?: number[];
  mobileClassName?: string;
}) {
  return (
    <div className={`rounded-2xl border border-gray5 bg-white p-5 md:min-h-[428px] ${mobileClassName}`}>
      <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="medium3 text-gray1">{title}</h3>
        <Link href={actionHref} className={hideActionOnMobile ? "hidden md:block" : undefined}>
          <Button
            title={actionLabel}
            iconRight={<ArrowRight size={18} />}
            size="sm"
            className="w-[132px] whitespace-nowrap rounded-xl px-3 text-[13px] md:w-auto md:rounded-full md:px-4"
          />
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader className="[&_tr]:bg-white">
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={column}
                  className={`whitespace-nowrap ${mobileHiddenColumnIndexes.includes(index) ? "hidden md:table-cell" : ""}`}
                >
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-gray3">
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.cells.map((cell, index) => (
                    <TableCell
                      key={`${row.id}-${index}`}
                      className={mobileHiddenColumnIndexes.includes(index) ? "hidden md:table-cell" : undefined}
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-3 flex justify-center md:hidden">
        <span className="h-1.5 w-8 rounded-full bg-primary" />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);
  const [summary, setSummary] = useState<AdminDashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      setSummary(await adminService.getDashboardSummary(token));
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to load admin dashboard summary."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    void loadSummary();
    const intervalId = window.setInterval(() => void loadSummary(), POLL_INTERVAL_MS);
    const onFocus = () => void loadSummary();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadSummary, token]);

  const topProductRows = useMemo(
    () =>
      summary.topProductsByRfqs.map((product) => ({
        id: product.id,
        cells: [
          <div key={`${product.id}-name`} className="flex items-center gap-3">
            <span className="size-8 overflow-hidden rounded-md bg-[#D9D9D9]">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt="" className="size-full object-cover" />
              ) : null}
            </span>
            <span>{product.name}</span>
          </div>,
          compactFormatter.format(product.rfqCount),
        ],
      })),
    [summary.topProductsByRfqs]
  );

  const recentUserRows = useMemo(
    () =>
      summary.recentUsers.map((user) => ({
        id: user.id,
        cells: [
          <div key={`${user.id}-name`} className="flex items-center gap-3">
            <span className="size-8 overflow-hidden rounded-md bg-[#D9D9D9]">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="size-full object-cover" />
              ) : null}
            </span>
            <span>{user.name}</span>
          </div>,
          user.type,
          formatDateTime(user.dateOnboarded),
          <span key={`${user.id}-action`} className="inline-flex items-center gap-4">
            <Eye size={15} className="text-[#19B95A]" />
            <Monitor size={15} className="text-primary" />
          </span>,
        ],
      })),
    [summary.recentUsers]
  );

  // Keep the live total and trend data, but where the current API does not yet
  // expose the category split shown in Figma, use a scoped Figma-backed adapter
  // instead of inventing neutral placeholder copy.
  const revenueMeta = ADMIN_DASHBOARD_FIGMA_FALLBACK.revenueBreakdownDesktop;
  const mobileRevenueMeta = ADMIN_DASHBOARD_FIGMA_FALLBACK.revenueBreakdownMobile.join("\n");

  return (
    <div className="overflow-x-hidden">
      <Header
        title="Admin Dashboard"
        description="Get insight into everything happening in your account"
      />

      <div className="space-y-5 overflow-x-hidden px-5 pb-4 pt-7 md:p-4">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <OverviewCard
            title="Total number of users"
            mobileTitle="Total Users"
            value={compactFormatter.format(summary.users.total)}
            meta={`Buyers ${summary.users.buyers} | Distributors ${summary.users.distributors} | OEMs ${summary.users.oems}`}
            mobileMeta={`Buyers: ${summary.users.buyers}\nDistributors: ${summary.users.distributors}\nOEMs: ${summary.users.oems}`}
            icon={<Users size={18} className="text-[#0669D9]" />}
            iconClassName="bg-[#E7F1FF]"
            loading={loading}
          />
          <OverviewCard
            title="Total number of RFQs"
            mobileTitle="Total RFQ"
            value={compactFormatter.format(summary.rfqs.total)}
            meta={`RFQs ${summary.rfqs.rfqsSent} | Quotes sent ${summary.rfqs.quotesSent}`}
            mobileMeta={`RFQs: ${summary.rfqs.rfqsSent}\nQuotes sent: ${summary.rfqs.quotesSent}`}
            icon={<FileText size={18} className="text-[#C04FE0]" />}
            iconClassName="bg-[#F8E8FF]"
            loading={loading}
          />
          <OverviewCard
            title="Total revenue"
            value={decimalFormatter.format(summary.revenue.total)}
            meta={revenueMeta}
            mobileMeta={mobileRevenueMeta}
            icon={<Banknote size={18} className="text-[#13A83B]" />}
            iconClassName="bg-[#E8FAEE]"
            loading={loading}
          />
          <OverviewCard
            title="Total Approval"
            value={compactFormatter.format(summary.approvals.total)}
            meta={`Accounts ${summary.approvals.accounts} | Product listing ${summary.approvals.productListings}`}
            mobileMeta={`Accounts: ${summary.approvals.accounts}\nProduct listing: ${summary.approvals.productListings}`}
            icon={<ClipboardCheck size={18} className="text-[#F6B90A]" />}
            iconClassName="bg-[#FFF5DB]"
            loading={loading}
          />
        </section>

        <div className="xl:hidden">
          <OnboardingChart data={summary.onboardingAnalytics} />
        </div>

        <section className="grid gap-5 xl:grid-cols-[2fr_1fr]">
          <div className="hidden xl:block">
            <RevenueChart
              monthly={summary.revenue.monthly}
              supported={summary.revenue.supported}
            />
          </div>
          <RfqRatioCard
            rfqsSent={summary.rfqs.rfqsSent}
            quotesSent={summary.rfqs.quotesSent}
          />
        </section>

        <div className="hidden xl:block">
          <OnboardingChart data={summary.onboardingAnalytics} />
        </div>

        <section className="grid gap-5 xl:grid-cols-2">
          <StaticTableCard
            title="Top 10 Products by RFQs"
            actionLabel="View All Product"
            actionHref="/dashboard/admin/products"
            columns={["Products' name", "RFQs count"]}
            rows={topProductRows}
            emptyText="No RFQs with stable product identifiers yet."
            mobileClassName="min-h-[480px] w-[474px] md:min-h-0 md:w-auto"
          />

          <StaticTableCard
            title="Recently Onboarded Users"
            actionLabel="View All Users"
            actionHref="/dashboard/admin/platform-users"
            columns={["Users' name", "User type", "Date onboarded", "Action"]}
            rows={recentUserRows}
            emptyText="No users onboarded yet."
            hideActionOnMobile
            mobileHiddenColumnIndexes={[2, 3]}
            mobileClassName="min-h-[436px] w-[560px] md:min-h-0 md:w-auto"
          />
        </section>
      </div>
    </div>
  );
}
