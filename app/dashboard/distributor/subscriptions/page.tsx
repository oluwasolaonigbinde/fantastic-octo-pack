"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Mail,
  MessagesSquare,
} from "lucide-react";

import Header from "../../component/header";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  PopUp,
  Spinner,
} from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { useSubscription } from "@/hooks/useSubscription";
import { useWallet } from "@/hooks/useWallet";
import { useWalletTopup } from "@/hooks/useWalletTopup";
import { TopUpDrawer, TopUpReturnBanner } from "@/components/wallet/wallet-topup";
import { koboToNaira } from "@/lib/wallet-format";
import { fetchUserProducts } from "@/store/slices/product-slice";
import { fetchDistributorInbox } from "@/store/slices/rfq-slice";
import { fetchMySubscription } from "@/store/slices/subscription-slice";
import type { PlanFeature, Subscription, SubscriptionPlan } from "@/types/subscription";

const MOCK_MESSAGE_SUMMARY = { total: 4, read: 1, unread: 3 };

// Per-card icon background tints from Figma
const KPI_ICON_BG = ["#FCE4FF", "#DEFFE7", "#E2F1FF", "#E2F1FF"] as const;

// ─── Formatting helpers ──────────────────────────────────────────────────────

/** Amounts are stored in kobo; render as naira. */
const formatNaira = (kobo: number) =>
  `₦${(kobo / 100).toLocaleString("en-NG")}`;

const intervalLabel = (interval: SubscriptionPlan["interval"]) =>
  interval === "yearly" ? "year" : "month";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

/** "product_listing_limit" → "Product listing limit". */
const humanizeFeatureKey = (key: string) => {
  const spaced = key.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const featureValueLabel = (feature: PlanFeature) => {
  if (typeof feature.numericValue === "number")
    return feature.numericValue === -1 ? "Unlimited" : String(feature.numericValue);
  if (typeof feature.booleanValue === "boolean")
    return feature.booleanValue ? "Included" : "Not included";
  return "—";
};

const subscriptionPlanId = (subscription: Subscription | null) => {
  if (!subscription) return null;
  return typeof subscription.plan === "string"
    ? subscription.plan
    : subscription.plan?._id ?? null;
};

/**
 * A subscription that blocks taking a new one — anything the backend still
 * considers in force. Only fully `canceled`/`expired` subscriptions free the
 * caller to subscribe again.
 */
const isLiveSubscription = (subscription: Subscription | null) =>
  !!subscription && !["canceled", "expired"].includes(subscription.status);

// ─── KPI Summary Card ────────────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  meta,
  icon,
  iconBg,
}: {
  title: string;
  value: string | number;
  meta: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E8ECF4] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#6B7280]">{title}</p>
          <p className="mt-2 text-[32px] font-semibold leading-[48px] text-[#111827]">{value}</p>
          <p className="mt-3 text-xs text-[#6B7280]">{meta}</p>
        </div>
        <div className="rounded-2xl p-3" style={{ backgroundColor: iconBg }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  isCurrent,
  subscribed,
  canAfford,
  isBusy,
  onSubscribe,
  onManage,
  onTopUp,
}: {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  /** The caller already holds a live subscription — no plan is subscribable. */
  subscribed: boolean;
  /** The wallet has enough available balance to pay for this plan. */
  canAfford: boolean;
  isBusy: boolean;
  onSubscribe: () => void;
  onManage: () => void;
  onTopUp: () => void;
}) {
  const [showBilling, setShowBilling] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  // The free tier is the baseline — it's never subscribed to or managed.
  const isFree = plan.price <= 0;

  return (
    <article className="flex flex-col justify-between rounded-[12px] border border-[#DDE0E5] bg-white p-4">
      {/* Top — badge, price, tagline */}
      <div className="border-b border-[#DDE0E5] pb-4">
        <div className="inline-flex items-center rounded-full bg-[#EAF9FF] px-3 py-1 text-sm font-semibold text-[#3586E4]">
          {plan.name}
          {isCurrent ? " (current)" : ""}
        </div>
        <p className="mt-2 text-xl font-semibold text-[#4B5563]">
          {formatNaira(plan.price)}
        </p>
        <p className="text-sm text-[#6B7280]">
          {plan.description || "Designed for growing distributors"}
        </p>
      </div>

      {/* Billing Period — collapsible */}
      <div className="mt-3 space-y-3">
        <div>
          <button
            type="button"
            onClick={() => setShowBilling((v) => !v)}
            className="flex w-full items-center justify-between"
          >
            <span className="text-sm font-bold text-[#4B5563]">Billing Period</span>
            {showBilling ? (
              <ChevronUp className="size-4 text-[#4B5563]" />
            ) : (
              <ChevronDown className="size-4 text-[#4B5563]" />
            )}
          </button>
          {showBilling ? (
            <p className="mt-1 text-xs text-[#6B7280]">
              {formatNaira(plan.price)} billed{" "}
              {plan.interval === "yearly" ? "yearly" : "monthly"}
              {plan.intervalCount > 1 ? ` (every ${plan.intervalCount} ${intervalLabel(plan.interval)}s)` : ""}
            </p>
          ) : null}
        </div>

        {/* Features — collapsible */}
        <div>
          <button
            type="button"
            onClick={() => setShowFeatures((v) => !v)}
            className="flex w-full items-center justify-between"
          >
            <span className="text-sm font-bold text-[#4B5563]">Features</span>
            {showFeatures ? (
              <ChevronUp className="size-4 text-[#4B5563]" />
            ) : (
              <ChevronDown className="size-4 text-[#4B5563]" />
            )}
          </button>
          {showFeatures ? (
            <ul className="mt-1 space-y-1">
              {plan.features.length === 0 ? (
                <li className="text-xs text-[#6B7280]">No features listed.</li>
              ) : (
                plan.features.map((feature) => (
                  <li
                    key={feature.key}
                    className="flex items-center justify-between text-xs text-[#4B5563]"
                  >
                    <span>{humanizeFeatureKey(feature.key)}</span>
                    <span className="font-medium text-[#111827]">
                      {featureValueLabel(feature)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      </div>

      {/* CTA. Free is the baseline (no subscribe). On a paid plan, only the
          current plan shows Manage — every other card has no action. */}
      <div className="mt-4">
        {isFree ? (
          isCurrent ? (
            <div className="w-full rounded-[12px] bg-[#F3F4F6] py-2 text-center text-sm font-normal text-[#6B7280]">
              Current plan
            </div>
          ) : null
        ) : subscribed ? (
          isCurrent ? (
            <button
              type="button"
              onClick={onManage}
              className="w-full rounded-[12px] py-2 text-sm font-normal text-[#111827]"
              style={{ backgroundColor: "#C4C8CE" }}
            >
              Manage Subscription
            </button>
          ) : null
        ) : (
          <>
            <Button
              title={`Subscribe to ${plan.name}`}
              onClick={onSubscribe}
              isBusy={isBusy}
              disabled={!canAfford}
              className="rounded-[12px]"
            />
            {!canAfford ? (
              <p className="mt-3 text-center text-[13px] leading-5 text-[#E33C13]">
                Insufficient wallet balance.{" "}
                <button
                  type="button"
                  onClick={onTopUp}
                  className="font-medium underline"
                >
                  Top up your wallet
                </button>{" "}
                to subscribe.
              </p>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DistributorSubscriptions() {
  const dispatch = useAppDispatch();
  const { data: authData } = useAppSelector((state) => state.auth);
  const { myProducts, totalProducts } = useAppSelector((state) => state.product);
  const { distributorQuotes } = useAppSelector((state) => state.rfq);

  const {
    plans,
    subscription,
    isLoading,
    isMutating,
    subscribe,
    cancel,
  } = useSubscription();
  const { wallet } = useWallet();
  const availableBalance = wallet?.availableBalance ?? 0;
  const {
    open: topUpOpen,
    openTopUp,
    returnStatus,
    dismissReturnStatus,
    panelProps,
  } = useWalletTopup({ callbackPath: "/dashboard/distributor/subscriptions" });

  /** Open the top-up panel prefilled with the shortfall needed for a plan. */
  const handleTopUp = (plan: SubscriptionPlan) => {
    const shortfallKobo = Math.max(plan.price - availableBalance, 0);
    openTopUp(koboToNaira(shortfallKobo));
  };

  const [showManageModal, setShowManageModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [popup, setPopup] = useState<{
    type: "success" | "warning";
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    if (authData?._id && authData?.tokens?.accessToken && !myProducts) {
      dispatch(fetchUserProducts({ id: authData._id, token: authData.tokens.accessToken }));
    }
  }, [authData?._id, authData?.tokens?.accessToken, dispatch, myProducts]);

  useEffect(() => {
    if (authData?.tokens?.accessToken && !distributorQuotes) {
      dispatch(fetchDistributorInbox(authData.tokens.accessToken));
    }
  }, [authData?.tokens?.accessToken, dispatch, distributorQuotes]);

  const products = useMemo(() => myProducts ?? [], [myProducts]);
  const quotes = useMemo(() => distributorQuotes ?? [], [distributorQuotes]);
  const approvedProducts = useMemo(
    () => products.filter((p) => p.status === "approved"),
    [products],
  );
  const equipmentCount = useMemo(
    () => products.filter((p) => p.category?.toLowerCase() === "equipment").length,
    [products],
  );
  const consumablesCount = useMemo(
    () => products.filter((p) => p.category?.toLowerCase() === "consumables").length,
    [products],
  );
  const approvedEquipmentCount = useMemo(
    () => approvedProducts.filter((p) => p.category?.toLowerCase() === "equipment").length,
    [approvedProducts],
  );
  const approvedConsumablesCount = useMemo(
    () => approvedProducts.filter((p) => p.category?.toLowerCase() === "consumables").length,
    [approvedProducts],
  );
  const respondedQuotes = useMemo(
    () =>
      quotes.filter((q) => q.status === "quoted" || q.status === "unavailable").length,
    [quotes],
  );
  const unrespondedQuotes = useMemo(
    () => quotes.filter((q) => q.status === "pending_response").length,
    [quotes],
  );

  const availablePlans = useMemo(() => plans ?? [], [plans]);
  // A live subscription to a paid plan. The free tier also comes back as a live
  // subscription, but it's the baseline — it must not block subscribing to a
  // paid plan, so treat it as "not subscribed" here.
  const hasPaidSubscription =
    isLiveSubscription(subscription) &&
    (subscription?.planSnapshot?.price ?? 0) > 0;
  const currentPlan = useMemo(() => {
    if (!hasPaidSubscription) return null;
    const planId = subscriptionPlanId(subscription);
    const byId = availablePlans.find((plan) => plan._id === planId);
    if (byId) return byId;
    // The subscribed plan may be archived / not in the caller's plan list —
    // fall back to matching the snapshot name so it still reads as current.
    const snapshotName = subscription?.planSnapshot?.name?.toLowerCase();
    return (
      availablePlans.find((plan) => plan.name.toLowerCase() === snapshotName) ??
      null
    );
  }, [availablePlans, hasPaidSubscription, subscription]);
  const currentPlanId = currentPlan?._id ?? null;

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    // Frontend guard — don't attempt to subscribe when the wallet can't cover
    // the plan's first billing cycle.
    if (availableBalance < plan.price) {
      setPopup({
        type: "warning",
        title: "Insufficient wallet balance",
        description: `This plan costs ${formatNaira(plan.price)} but your available wallet balance is ${formatNaira(availableBalance)}. Top up your wallet, then try again.`,
      });
      return;
    }
    setPendingPlanId(plan._id);
    const { ok, error } = await subscribe(plan._id);
    setPendingPlanId(null);
    if (ok) {
      setPopup({
        type: "success",
        title: "Subscription started",
        description:
          "Your plan is now active. An invoice has been generated for this billing cycle.",
      });
      return;
    }
    // If the backend says a subscription already exists, refresh so the cards
    // flip to "Manage Subscription".
    const token = authData?.tokens?.accessToken;
    if (token) void dispatch(fetchMySubscription(token));
    setPopup({
      type: "warning",
      title: "Couldn't subscribe",
      description:
        error ?? "We couldn't start your subscription. Please try again.",
    });
  };

  const handleCancel = async () => {
    const { ok, error } = await cancel();
    setShowCancelModal(false);
    setShowManageModal(false);
    setPopup(
      ok
        ? {
            type: "success",
            title: "Subscription cancelled",
            description:
              "Your subscription will remain active until the end of the current billing period. You won't be billed again.",
          }
        : {
            type: "warning",
            title: "Couldn't cancel",
            description:
              error ?? "We couldn't cancel your subscription. Please try again.",
          },
    );
  };

  return (
    <div>
      <Header
        title="Subscription"
        description="Subscribe to unlock premium tools and exclusive updates."
      />

      {/* Page bg matches Figma: #F9FAFB */}
      <div className="space-y-4 bg-[#F9FAFB] p-4 md:p-6">
        {/* Paystack return banner — shown after coming back from top-up. */}
        <TopUpReturnBanner status={returnStatus} onDismiss={dismissReturnStatus} />

        {/* ── KPI Cards ── */}
        <section className="grid gap-4 xl:grid-cols-4">
          <SummaryCard
            title="Total product listed"
            value={totalProducts || products.length}
            meta={`Equipment: ${equipmentCount} | Consumables: ${consumablesCount}`}
            icon={<FileCheck2 className="size-6 text-[#C026D3]" />}
            iconBg={KPI_ICON_BG[0]}
          />
          <SummaryCard
            title="Total verified products"
            value={approvedProducts.length}
            meta={`Equipment: ${approvedEquipmentCount} | Consumables: ${approvedConsumablesCount}`}
            icon={<CheckCircle2 className="size-6 text-[#16A34A]" />}
            iconBg={KPI_ICON_BG[1]}
          />
          <SummaryCard
            title="Total quote request"
            value={quotes.length}
            meta={`Responded: ${respondedQuotes} | Un-responded: ${unrespondedQuotes}`}
            icon={<MessagesSquare className="size-6 text-[#0669D9]" />}
            iconBg={KPI_ICON_BG[2]}
          />
          <SummaryCard
            title="Messages unlocked"
            value={MOCK_MESSAGE_SUMMARY.total}
            meta={`Read: ${MOCK_MESSAGE_SUMMARY.read} | Unread: ${MOCK_MESSAGE_SUMMARY.unread}`}
            icon={<Mail className="size-6 text-[#0669D9]" />}
            iconBg={KPI_ICON_BG[3]}
          />
        </section>

        {/* ── Current Plan Bar ── */}
        <nav
          aria-label="Current subscription"
          className="rounded-[12px] border border-[#DDE0E5] bg-white p-5"
        >
          <div className="grid gap-0 divide-x divide-[#DDE0E5] lg:grid-cols-3">
            <div className="rounded-[20px] border border-[#AAD3F3] bg-[#F6FBFF] px-5 py-4">
              <p className="text-sm text-[#6B7280]">Current Plan</p>
              <p className="mt-2 text-lg font-medium text-[#111827]">
                {hasPaidSubscription
                  ? currentPlan?.name ?? subscription?.planSnapshot?.name ?? "Active plan"
                  : "Free"}
              </p>
            </div>
            <div className="px-8 py-4">
              <p className="text-sm text-[#6B7280]">Fee</p>
              <p className="mt-2 text-xl font-semibold text-[#111827]">
                {hasPaidSubscription && subscription?.planSnapshot
                  ? formatNaira(subscription.planSnapshot.price)
                  : "₦0.00"}
              </p>
            </div>
            <div className="px-8 py-4">
              <p className="text-sm text-[#6B7280]">
                {subscription?.cancelAtPeriodEnd ? "Ends on" : "Renewal date"}
              </p>
              <p className="mt-2 text-xl font-semibold text-[#111827]">
                {hasPaidSubscription
                  ? formatDate(subscription?.currentPeriodEnd ?? subscription?.nextBillingDate)
                  : "—"}
              </p>
            </div>
          </div>
        </nav>

        {/* ── Plans ── */}
        <section className="rounded-[12px] border border-[#DDE0E5] bg-white p-5">
          <h2 className="text-[20px] font-medium text-[#111827]">
            All available plans - {availablePlans.length}
          </h2>
        </section>

        <section
          className="rounded-[20px] border border-[#DDE0E5] p-5"
          style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
        >
          <h2 className="text-lg font-bold text-[#111827]">Subscriptions</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Choose a plan that fits your business stage
          </p>

          {isLoading && availablePlans.length === 0 ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : availablePlans.length === 0 ? (
            <p className="py-16 text-center text-[#6B7280]">
              No subscription plans are available right now.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-3">
              {availablePlans.map((plan) => (
                <PlanCard
                  key={plan._id}
                  plan={plan}
                  isCurrent={
                    hasPaidSubscription
                      ? plan._id === currentPlanId
                      : plan.price <= 0
                  }
                  subscribed={hasPaidSubscription}
                  canAfford={availableBalance >= plan.price}
                  isBusy={isMutating && pendingPlanId === plan._id}
                  onSubscribe={() => handleSubscribe(plan)}
                  onManage={() => setShowManageModal(true)}
                  onTopUp={() => handleTopUp(plan)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Manage Subscription Modal — cancel is the only action ── */}
      <Dialog open={showManageModal} onOpenChange={() => setShowManageModal(false)}>
        <DialogContent className="max-w-[500px] rounded-[20px] bg-white p-8">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold text-[#111827]">
              Manage Subscription
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6 space-y-5">
            <div className="rounded-[20px] border border-[#AAD3F3] bg-[#F6FBFF] px-5 py-4">
              <p className="text-sm text-[#6B7280]">Current Plan</p>
              <p className="mt-1 text-lg font-medium text-[#111827]">
                {currentPlan?.name ?? subscription?.planSnapshot?.name ?? "Active plan"}
              </p>
              {subscription?.planSnapshot ? (
                <p className="mt-1 text-sm text-[#6B7280]">
                  {formatNaira(subscription.planSnapshot.price)} /{" "}
                  {intervalLabel(subscription.planSnapshot.interval)}
                </p>
              ) : null}
              <p className="mt-3 text-sm text-[#6B7280]">
                {subscription?.cancelAtPeriodEnd
                  ? `Cancellation scheduled — access ends ${formatDate(subscription?.currentPeriodEnd)}.`
                  : `Renews ${formatDate(subscription?.currentPeriodEnd ?? subscription?.nextBillingDate)}.`}
              </p>
            </div>

            {!subscription?.cancelAtPeriodEnd ? (
              <button
                type="button"
                onClick={() => {
                  setShowManageModal(false);
                  setShowCancelModal(true);
                }}
                className="w-full pt-2 text-center text-[16px] font-medium text-[#E33C13] underline"
              >
                Cancel Subscription
              </button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Subscription Modal ── */}
      <Dialog open={showCancelModal} onOpenChange={() => !isMutating && setShowCancelModal(false)}>
        <DialogContent className="max-w-[500px] rounded-[20px] bg-white p-0">
          <div className="px-10 pt-[34px]">
            <h2 className="text-center text-[20px] font-medium leading-8 text-[#E33C13]">
              Cancel Subscription
            </h2>

            <div
              className="mt-6 flex items-center justify-center rounded-[20px] border px-4 py-4"
              style={{
                backgroundColor: "#FFF7F0",
                borderColor: "#FE6E00",
                minHeight: 128,
              }}
            >
              <p className="text-center text-[16px] font-normal leading-6 text-[#111827]">
                Are you sure you want to cancel your current plan?
                <br />
                Your plan stays active until the end of the billing period
                {subscription?.currentPeriodEnd
                  ? ` (${formatDate(subscription.currentPeriodEnd)})`
                  : ""}
                , then your premium features are removed and you won&apos;t be billed again.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 px-10 pb-[34px] pt-6">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              disabled={isMutating}
              className="flex h-14 flex-1 items-center justify-center rounded-[12px] bg-[#0669D9] text-[16px] font-normal text-white disabled:opacity-60"
            >
              No don&apos;t cancel
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isMutating}
              className="flex h-14 flex-1 items-center justify-center rounded-[12px] border border-[#4B5563] text-[16px] font-normal text-[#4B5563] disabled:opacity-60"
            >
              {isMutating ? "Cancelling…" : "Yes Cancel"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <PopUp
        open={popup !== null}
        type={popup?.type ?? "success"}
        title={popup?.title ?? ""}
        description={popup?.description ?? ""}
        primaryButtonText="Okay"
        onClose={() => setPopup(null)}
      />

      {/* Wallet top-up panel — reuses the shared Paystack top-up flow. */}
      <TopUpDrawer open={topUpOpen} panelProps={panelProps} />
    </div>
  );
}
