"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  CheckCheck,
  CircleDollarSign,
  CreditCard,
  Hammer,
  Mail,
  MessageSquareReply,
  ShoppingBag,
  Wrench,
} from "lucide-react";

import Header from "../component/header";
import { OverviewNoticeBanner } from "../component/overview-primitives";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { useOrdersQuery } from "@/hooks/queries/orders";
import { useThreadsQuery } from "@/hooks/queries/messaging";
import { useBuyerServiceRequestsQuery } from "@/hooks/queries/service-requests";
import rfqService from "@/services/rfqService";
import type { Quote } from "@/types/rfq";

import {
  buildBuyerDashboardModel,
  type BuyerDashboardActivityKind,
} from "./buyer-dashboard-adapter";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/^NGN\s?/, "₦");

const formatCompactNaira = (value: number) => {
  if (value === 0) return "₦0";
  if (Math.abs(value) >= 1_000_000) {
    return `₦${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `₦${(value / 1_000).toFixed(0)}K`;
  }
  return `₦${value}`;
};

function BalanceMetricCard({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: string;
  tone: {
    cardClassName: string;
    iconClassName: string;
  };
  icon: React.ReactNode;
}) {
  return (
    <article
      className={`rounded-2xl border border-[#E5E7EB] px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ${tone.cardClassName}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] ${tone.iconClassName}`}
        >
          {icon}
        </span>
        <div className="min-w-0 pt-1">
          <p className="text-[0.95rem] font-medium text-[#1F2937]">{title}</p>
          <p className="mt-3 text-[1.15rem] font-semibold leading-none text-[#111827] sm:text-[1.2rem]">
            {value}
          </p>
        </div>
      </div>
    </article>
  );
}

function InlineMetricCard({
  count,
  title,
  actionLabel,
  actionHref,
  tone,
  icon,
}: {
  count: string;
  title: string;
  actionLabel: string;
  actionHref: string;
  tone: {
    cardClassName: string;
    iconClassName: string;
  };
  icon: React.ReactNode;
}) {
  return (
    <article
      className={`rounded-2xl border border-[#E5E7EB] px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ${tone.cardClassName}`}
    >
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] ${tone.iconClassName}`}
          >
            {icon}
          </span>
          <p className="max-w-[15rem] text-[0.95rem] font-medium leading-8 text-[#111827]">
            <span className="mr-1.5 inline text-[1rem] font-semibold">{count}</span>
            {title}
          </p>
        </div>
        <div className="flex items-center justify-between pl-11">
          <Link
            href={actionHref}
            className="text-sm font-medium text-primary"
          >
            {actionLabel}
          </Link>
          <ArrowRight className="size-5 text-primary" strokeWidth={1.8} />
        </div>
      </div>
    </article>
  );
}

function SummaryStripItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F3F5F8] px-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[#6B7280] shadow-sm">
          {icon}
        </span>
        <span className="truncate text-sm font-medium text-[#374151]">{label}</span>
      </div>
      <span className="text-[1.1rem] font-semibold text-[#111827]">{value}</span>
    </div>
  );
}

function SpendMetricTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#F7F8FA] px-4 py-4">
      <p className="text-sm text-[#6B7280]">{label}</p>
      <p className="mt-4 text-[1.65rem] font-semibold leading-none text-[#4B5563] sm:text-[1.8rem]">
        {value}
      </p>
    </div>
  );
}

function ActivityIcon({ kind }: { kind: BuyerDashboardActivityKind }) {
  const sharedClassName =
    "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#3B82F6] bg-[#EFF6FF] text-[#2563EB]";

  switch (kind) {
    case "payment":
      return (
        <span className={sharedClassName}>
          <CreditCard className="size-4" strokeWidth={1.8} />
        </span>
      );
    case "order":
      return (
        <span className={sharedClassName}>
          <ShoppingBag className="size-4" strokeWidth={1.8} />
        </span>
      );
    case "message":
      return (
        <span className={sharedClassName}>
          <Mail className="size-4" strokeWidth={1.8} />
        </span>
      );
    case "service_request":
      return (
        <span className={sharedClassName}>
          <Wrench className="size-4" strokeWidth={1.8} />
        </span>
      );
    case "quote":
    default:
      return (
        <span className={sharedClassName}>
          <MessageSquareReply className="size-4" strokeWidth={1.8} />
        </span>
      );
  }
}

function RecentActivityItem({
  activity,
  isLast,
}: {
  activity: {
    kind: BuyerDashboardActivityKind;
    message: string;
    relativeTime: string;
  };
  isLast: boolean;
}) {
  return (
    <article className="flex items-start gap-4">
      <div className="relative flex w-10 shrink-0 flex-col items-center">
        {!isLast ? (
          <span className="absolute left-1/2 top-11 h-[calc(100%-2.5rem)] -translate-x-1/2 border-l border-dashed border-[#D1D5DB]" />
        ) : null}
        <ActivityIcon kind={activity.kind} />
      </div>
      <div className={`min-w-0 flex-1 ${!isLast ? "border-b border-[#E5E7EB] pb-5" : "pb-1"}`}>
        <p className="max-w-[42rem] text-[1rem] font-medium leading-8 text-[#4B5563]">
          {activity.message}
        </p>
        <p className="mt-3 text-sm text-[#9CA3AF]">{activity.relativeTime}</p>
      </div>
    </article>
  );
}

const BuyerDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);
  const { data: orders } = useOrdersQuery();
  const { data: serviceRequestsData } = useBuyerServiceRequestsQuery();
  const serviceRequests = serviceRequestsData?.requests ?? [];
  const serviceRequestStatusCounts = serviceRequestsData?.statusCounts ?? null;
  const [showKycBanner, setShowKycBanner] = useState(true);
  const [quotes, setQuotes] = useState<Quote[] | null>(null);

  const { data: conversations = null } = useThreadsQuery(5);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    rfqService
      .fetchBuyerReceivedQuotes(token)
      .then((result) => {
        if (isMounted) setQuotes(result.data || []);
      })
      .catch(() => {
        if (isMounted) setQuotes([]);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const dashboardModel = useMemo(
    () =>
      buildBuyerDashboardModel({
        orders: orders ?? null,
        serviceRequests,
        serviceRequestStatusCounts,
        quotes: token ? quotes : null,
        conversations: token ? conversations : null,
      }),
    [
      conversations,
      orders,
      quotes,
      serviceRequestStatusCounts,
      serviceRequests,
      token,
    ],
  );

  return (
    <>
      <Header
        title="My Dashboard"
        description="Get insight into everything happening in your account"
      />

      <main className="min-h-[calc(100vh-100px)] bg-[#F5F7FA] p-3 md:p-6">
        <div className="mx-auto max-w-[1180px] space-y-4">
          {showKycBanner ? (
            <OverviewNoticeBanner
              text="Update your KYC level."
              onDismiss={() => setShowKycBanner(false)}
              className="rounded-2xl border-[#F59E0B]/20 bg-[#FFF7ED] text-[#9A3412]"
            />
          ) : null}

          <section className="grid gap-3 xl:grid-cols-4">
            <BalanceMetricCard
              title="Balance"
              value={formatCurrency(dashboardModel.balance)}
              tone={{
                cardClassName: "bg-[#F0F8F1]",
                iconClassName: "bg-[#65C466] text-white",
              }}
              icon={<Banknote className="size-4" strokeWidth={1.8} />}
            />
            <InlineMetricCard
              count={dashboardModel.ordersNeedConfirmation.toLocaleString("en-NG")}
              title="Orders Need Your Confirmation"
              actionLabel="View all order"
              actionHref="/dashboard/buyer/orders"
              tone={{
                cardClassName: "bg-[#FFF5F2]",
                iconClassName: "bg-[#F05A28] text-white",
              }}
              icon={<CheckCheck className="size-4" strokeWidth={1.8} />}
            />
            <InlineMetricCard
              count={dashboardModel.activeOrdersCard.toLocaleString("en-NG")}
              title="active orders (Active)"
              actionLabel="View all order"
              actionHref="/dashboard/buyer/orders"
              tone={{
                cardClassName: "bg-[#FFF8ED]",
                iconClassName: "bg-[#F59E0B] text-white",
              }}
              icon={<BriefcaseBusiness className="size-4" strokeWidth={1.8} />}
            />
            <InlineMetricCard
              count={dashboardModel.engineerRequests.toLocaleString("en-NG")}
              title="Engineer Requests"
              actionLabel="View all Request"
              actionHref="/dashboard/buyer/service-request"
              tone={{
                cardClassName: "bg-[#EFF6FF]",
                iconClassName: "bg-[#2563EB] text-white",
              }}
              icon={<Hammer className="size-4" strokeWidth={1.8} />}
            />
          </section>

          <section className="rounded-2xl border border-[#DDE0E5] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:p-5">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-[#111827]">Active Orders</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <SummaryStripItem
                icon={<ShoppingBag className="size-4" strokeWidth={1.8} />}
                label="Active Orders"
                value={dashboardModel.activeOrdersTotal.toLocaleString("en-NG")}
              />
              <SummaryStripItem
                icon={<CircleDollarSign className="size-4" strokeWidth={1.8} />}
                label="Escrow Balance"
                value={formatCurrency(dashboardModel.escrowBalance)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#DDE0E5] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:p-5">
            <div className="mb-4">
              <h2 className="text-[1.65rem] font-semibold text-[#111827]">
                Total Spend This Month
              </h2>
            </div>

            <div className="h-[260px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dashboardModel.spendSeries}
                  margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="buyerDashboardSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="label" hide />
                  <YAxis
                    width={64}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    tickCount={4}
                    tickFormatter={formatCompactNaira}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={() => "Spend"}
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: "#DBE4EE",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#buyerDashboardSpend)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <SpendMetricTile
                label="Total Spend This Month"
                value={formatCurrency(dashboardModel.spendThisMonth)}
              />
              <SpendMetricTile
                label="Order This Month"
                value={dashboardModel.ordersThisMonth.toLocaleString("en-NG")}
              />
              <SpendMetricTile
                label="Avg. Order Value"
                value={formatCurrency(dashboardModel.averageOrderValue)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#DDE0E5] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-[#111827]">Recent Activity</h2>
              <Link
                href="/dashboard/buyer/orders"
                className="text-sm font-semibold text-primary"
              >
                See more
              </Link>
            </div>

            <div className="space-y-4">
              {dashboardModel.activities.map((activity, index) => (
                <RecentActivityItem
                  key={activity.id}
                  activity={activity}
                  isLast={index === dashboardModel.activities.length - 1}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default BuyerDashboard;
