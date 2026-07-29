"use client";

import Header from "../component/header";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMyProductsQuery } from "@/hooks/queries/products";
import { useDistributorQuoteSummaryQuery } from "@/hooks/queries/rfqs";
import { useOrderSummaryQuery } from "@/hooks/queries/orders";
import { useKycUpgradePrompt } from "@/hooks/useKycUpgradePrompt";
import { useSubscriptionQuery } from "@/hooks/queries/subscription";
import { reset } from "@/store/slices/auth-slice";
import { Button } from "@/components/base";
import { ClipboardList, Mail, Plus, ShoppingBag, Wallet } from "lucide-react";
import {
  DistributorOverviewAlerts,
  readAlertDismissals,
} from "./_components/distributor-overview-alerts";
import { DistributorKpiGrid } from "./_components/distributor-kpi-grid";
import {
  DistributorActionCenter,
  type DistributorActionItem,
} from "./_components/distributor-action-center";
import { DistributorRecentListedSection } from "./_components/distributor-recent-listed-section";

export default function DistributorDashboard() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data } = useAppSelector((state) => state.auth);
  const { data: myProductsData, isLoading } = useMyProductsQuery(data?._id);
  const myProducts = myProductsData?.products ?? null;
  // `GET /orders/summary` is role-scoped — a distributor gets their sales.
  const { data: orderSummary } = useOrderSummaryQuery();
  const { data: quoteSummary } = useDistributorQuoteSummaryQuery();
  const { shouldPrompt: needsKyc } = useKycUpgradePrompt();
  const { data: mySubscription } = useSubscriptionQuery();

  const [alertDismissed, setAlertDismissed] = useState(readAlertDismissals);

  useEffect(() => {
    dispatch(reset());
  }, [dispatch]);

  /**
   * Every counter below is either measured from a live response or `null`.
   * Nothing is defaulted to a stand-in figure: a KPI with no data behind it
   * renders a dash, and an action card with no data behind it is not shown.
   */
  const salesThisMonth = orderSummary?.totalValue.thisMonth ?? null;
  const activeOrders = orderSummary?.activeOrders ?? null;
  const ordersAwaitingConfirmation =
    orderSummary?.awaitingBuyerConfirmation ?? null;
  const pendingPayments = orderSummary
    ? (orderSummary.byStatus.created_pending_payment ?? 0) +
      (orderSummary.byStatus.payment_initiated ?? 0)
    : null;
  const pendingQuotes = quoteSummary?.pendingResponse ?? null;
  /**
   * Prefer the server's own counts; fall back to the fetched page only when the
   * list endpoint omits its summary block.
   */
  const productsPendingApproval =
    myProductsData?.meta.summary?.statusCounts.pending ??
    myProducts?.filter((product) => product.status === "pending").length ??
    null;

  /** An active paid plan is what the "update your badge" notice is asking for. */
  const needsSubscription =
    mySubscription !== undefined &&
    mySubscription.subscription?.status !== "active";

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  const actionCenterItems: DistributorActionItem[] = useMemo(() => {
    const plural = (count: number, noun: string) =>
      `${count} ${noun}${count === 1 ? "" : "s"}`;

    const candidates: Array<DistributorActionItem & { count: number | null }> = [
      {
        count: pendingQuotes,
        title: `${plural(pendingQuotes ?? 0, "quote")} awaiting your response`,
        subtitle: "View all quotes",
        cta: "View Quotes",
        href: "/dashboard/distributor/quotes",
        icon: Mail,
        tone: "blue",
      },
      {
        count: pendingPayments,
        title: `${plural(pendingPayments ?? 0, "order")} pending payment`,
        subtitle: "Review Orders",
        cta: "View Orders",
        href: "/dashboard/distributor/orders",
        icon: Wallet,
        tone: "amber",
      },
      {
        count: ordersAwaitingConfirmation,
        title: `${plural(ordersAwaitingConfirmation ?? 0, "order")} awaiting confirmation`,
        subtitle: "Review Orders",
        cta: "Review Order",
        href: "/dashboard/distributor/orders",
        icon: ShoppingBag,
        tone: "blue",
      },
      {
        count: productsPendingApproval,
        title: `${plural(productsPendingApproval ?? 0, "product")} pending approval`,
        subtitle: "Review your catalogue",
        cta: "Preview Product",
        href: "/dashboard/distributor/catalogue",
        icon: ClipboardList,
        tone: "orange",
      },
    ];

    // Only surface an action the distributor can actually take right now.
    return candidates
      .filter((candidate) => (candidate.count ?? 0) > 0)
      .map((candidate) => {
        const { count, ...item } = candidate;
        void count;
        return item;
      });
  }, [
    ordersAwaitingConfirmation,
    pendingPayments,
    pendingQuotes,
    productsPendingApproval,
  ]);

  return (
    <>
      <Header
        title="Dashboard Overview"
        description={today}
        mobileChrome="dashboard"
      />
      <div className="space-y-5 bg-[#F9FAFB] p-3 md:p-6">
        <DistributorOverviewAlerts
          kycVisible={needsKyc && !alertDismissed.kyc}
          subscriptionVisible={needsSubscription && !alertDismissed.subscription}
          onDismissKyc={() =>
            setAlertDismissed((s) => ({ ...s, kyc: true }))
          }
          onDismissSubscription={() =>
            setAlertDismissed((s) => ({ ...s, subscription: true }))
          }
        />

        <DistributorKpiGrid
          salesThisMonth={salesThisMonth}
          pendingQuotes={pendingQuotes}
          activeOrders={activeOrders}
          pendingPayments={pendingPayments}
        />

        <section className="rounded-2xl border border-[#DDE0E5] bg-white px-5 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[20px] font-medium leading-8 text-[#111827]">
                Add Product
              </h2>
              <p className="text-base leading-6 text-[#4B5563]">
                upload your new product to store
              </p>
            </div>
            <Button
              title="Add New Product"
              iconLeft={<Plus className="size-5" />}
              onClick={() => router.push("/dashboard/distributor/catalogue/new")}
              className="!w-fit rounded-xl px-5 text-base font-normal"
              variant="primary"
              size="md"
            />
          </div>
        </section>

        <DistributorActionCenter items={actionCenterItems} />

        <DistributorRecentListedSection
          myProducts={myProducts}
          isLoading={isLoading}
          roleSegment="distributor"
        />
      </div>
    </>
  );
}
