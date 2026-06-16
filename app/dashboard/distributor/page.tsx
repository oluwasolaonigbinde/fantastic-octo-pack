"use client";

import Header from "../component/header";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUserProducts } from "@/store/slices/product-slice";
import { fetchDistributorInbox } from "@/store/slices/rfq-slice";
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
  const { myProducts, isLoading } = useAppSelector(
    (state) => state.product,
  );
  const { data } = useAppSelector((state) => state.auth);
  const { distributorQuotes } = useAppSelector((state) => state.rfq);

  const [alertDismissed, setAlertDismissed] = useState(readAlertDismissals);

  useEffect(() => {
    dispatch(reset());
    if (myProducts) {
      return;
    }
    if (data?._id && data?.tokens?.accessToken) {
      dispatch(
        fetchUserProducts({
          id: data._id,
          token: data.tokens.accessToken,
        }),
      );
    }
  }, [myProducts, dispatch, data?._id, data?.tokens?.accessToken, data]);

  useEffect(() => {
    if (data?.tokens?.accessToken && !distributorQuotes) {
      dispatch(fetchDistributorInbox(data.tokens.accessToken));
    }
  }, [dispatch, data?.tokens?.accessToken, distributorQuotes]);

  const totalQuoteRequests = distributorQuotes?.length ?? 0;
  const unrespondedQuotes =
    distributorQuotes?.filter((q) => q.status === "pending_response")
      .length ?? 0;
  const pendingQuotesMetric = totalQuoteRequests || 14;
  const salesThisMonth = "N665,000";

  const actionCenterItems: DistributorActionItem[] = useMemo(
    () => [
      {
        title: `${unrespondedQuotes || 5} quote awaiting your response`,
        subtitle: "View all quotes",
        cta: "View Quotes",
        href: "/dashboard/distributor/quotes",
        icon: Mail,
        tone: "blue",
      },
      {
        title: "2 order pending payment",
        subtitle: "Review Orders",
        cta: "View Quotes",
        href: "/dashboard/distributor/orders",
        icon: Wallet,
        tone: "amber",
      },
      {
        title: "3 order awaiting confirmation",
        subtitle: "Review Orders",
        cta: "Review Order",
        href: "/dashboard/distributor/orders",
        icon: ShoppingBag,
        tone: "blue",
      },
      {
        title: "6 product pending approval",
        subtitle: "Review Orders",
        cta: "Preview Product",
        href: "/dashboard/distributor/catalogue",
        icon: ClipboardList,
        tone: "orange",
      },
    ],
    [unrespondedQuotes],
  );

  return (
    <>
      <Header
        title="Dashboard Overview"
        description="Wednesday 10th September, 2025"
        mobileChrome="dashboard"
      />
      <div className="space-y-5 bg-[#F9FAFB] p-3 md:p-6">
        <DistributorOverviewAlerts
          kycVisible={!alertDismissed.kyc}
          subscriptionVisible={!alertDismissed.subscription}
          onDismissKyc={() =>
            setAlertDismissed((s) => ({ ...s, kyc: true }))
          }
          onDismissSubscription={() =>
            setAlertDismissed((s) => ({ ...s, subscription: true }))
          }
        />

        <DistributorKpiGrid
          salesThisMonth={salesThisMonth}
          pendingQuotes={pendingQuotesMetric}
          activeOrders={22}
          pendingPayments={7}
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
