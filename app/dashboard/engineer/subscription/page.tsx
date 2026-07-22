"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

import Header from "../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  PopUp,
  Select,
  Spinner,
} from "@/components/base";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlanChangePreviewQuery } from "@/hooks/queries/subscription";
import { useWallet } from "@/hooks/useWallet";
import { useWalletTopup } from "@/hooks/useWalletTopup";
import { TopUpDrawer, TopUpReturnBanner } from "@/components/wallet/wallet-topup";
import { koboToNaira } from "@/lib/wallet-format";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { UserRole } from "@/types/user";
import type { PlanFeature, Subscription, SubscriptionPlan } from "@/types/subscription";

// ─── Formatting helpers ──────────────────────────────────────────────────────

/** Amounts are stored in kobo; render as naira. */
const formatNaira = (kobo: number) =>
  `₦${(kobo / 100).toLocaleString("en-NG")}`;

const intervalLabel = (interval: SubscriptionPlan["interval"]) =>
  interval === "yearly" ? "year" : "month";

/** "monthly" ×9 → "9 months"; "yearly" ×1 → "1 year". */
const billingPeriodLabel = (
  interval: SubscriptionPlan["interval"],
  intervalCount: number,
) => {
  const unit = intervalLabel(interval);
  const count = intervalCount > 0 ? intervalCount : 1;
  return count > 1 ? `${count} ${unit}s` : `1 ${unit}`;
};

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

/** "job_request_limit" → "Job request limit". */
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
  /** The caller already holds a live paid subscription. */
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
          {plan.description || "Designed for growing service engineers"}
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

      {/* CTA. The current paid plan shows Manage — upgrades and downgrades are
          driven from that dialog, so no other plan card carries a change button
          (there is deliberately no "downgrade to Free"). When the caller has no
          paid subscription, the free tier is the baseline and paid plans are
          subscribable. */}
      <div className="mt-4">
        {isCurrent ? (
          isFree ? (
            <div className="w-full rounded-[12px] bg-[#F3F4F6] py-2 text-center text-sm font-normal text-[#6B7280]">
              Current plan
            </div>
          ) : (
            <button
              type="button"
              onClick={onManage}
              className="w-full rounded-[12px] py-2 text-sm font-normal text-[#111827]"
              style={{ backgroundColor: "#C4C8CE" }}
            >
              Manage Subscription
            </button>
          )
        ) : subscribed ? null : isFree ? null : (
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

// ─── Upgrade / Downgrade Dialog ───────────────────────────────────────────────

/**
 * Shared plan-change dialog. The caller picks a target plan from a dropdown,
 * sees the resulting fee (with collapsible billing period + features) and the
 * proration preview, then confirms. `plans` is already filtered to the eligible
 * tiers for the direction (upgrades: pricier plans; downgrades: cheaper *paid*
 * plans — the Free tier is never offered here).
 */
function ChangePlanDialog({
  open,
  mode,
  plans,
  isMutating,
  onClose,
  onConfirm,
}: {
  open: boolean;
  mode: "upgrade" | "downgrade";
  plans: SubscriptionPlan[];
  isMutating: boolean;
  onClose: () => void;
  onConfirm: (planId: string) => void;
}) {
  const isUpgrade = mode === "upgrade";
  // Local picker state. The parent remounts this dialog (via `key`) each time it
  // opens, so the selection resets cleanly without a reset effect.
  const [selectedId, setSelectedId] = useState("");
  const [showBilling, setShowBilling] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  const selected = plans.find((plan) => plan._id === selectedId) ?? null;

  const { data: preview, isLoading: isPreviewLoading } =
    usePlanChangePreviewQuery(open && selectedId ? selectedId : null);

  // Upgrades are charged now; block confirmation when the wallet can't cover it.
  const blockedByBalance = Boolean(
    isUpgrade && preview && preview.amountDue > 0 && !preview.sufficientBalance,
  );

  return (
    <Dialog open={open} onOpenChange={() => !isMutating && onClose()}>
      <DialogContent className="max-w-[440px] rounded-[20px] bg-white p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold text-[#111827]">
            {isUpgrade
              ? "Upgrade Subscription Plan"
              : "Downgrade Subscription Plan"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {plans.length === 0 ? (
            <p className="rounded-[12px] bg-[#F9FAFB] px-4 py-6 text-center text-sm text-[#6B7280]">
              No {isUpgrade ? "higher" : "lower"}-tier plans are available right
              now.
            </p>
          ) : (
            <Select
              label="Select new plan"
              placeholder="Select new plan"
              value={selectedId}
              onValueChange={setSelectedId}
              options={plans.map((plan) => ({
                label: `${plan.name} — ${formatNaira(plan.price)}`,
                value: plan._id,
              }))}
            />
          )}

          {selected ? (
            <div className="rounded-[12px] border border-[#22C55E] bg-white p-4">
              <p className="text-sm text-[#6B7280]">Your new fee will be</p>
              <p className="mt-1 text-lg font-semibold text-[#16A34A]">
                {formatNaira(selected.price)} /{" "}
                {intervalLabel(selected.interval)}
              </p>
              <p className="text-xs text-[#6B7280]">
                {formatNaira(selected.price)} billed{" "}
                {selected.interval === "yearly" ? "yearly" : "monthly"}
                {selected.intervalCount > 1
                  ? ` (every ${billingPeriodLabel(selected.interval, selected.intervalCount)})`
                  : ""}
              </p>

              {/* Billing Period — collapsible */}
              <div className="mt-3 border-t border-[#E5E7EB] pt-3">
                <button
                  type="button"
                  onClick={() => setShowBilling((v) => !v)}
                  className="flex w-full items-center justify-between"
                >
                  <span className="text-base font-semibold text-[#111827]">
                    Billing Period
                  </span>
                  {showBilling ? (
                    <ChevronUp className="size-4 text-[#4B5563]" />
                  ) : (
                    <ChevronDown className="size-4 text-[#4B5563]" />
                  )}
                </button>
                {showBilling ? (
                  <p className="mt-1 text-sm text-[#6B7280]">
                    Billed every{" "}
                    {billingPeriodLabel(
                      selected.interval,
                      selected.intervalCount,
                    )}
                    .
                  </p>
                ) : null}
              </div>

              {/* Features — collapsible */}
              <div className="mt-3 border-t border-[#E5E7EB] pt-3">
                <button
                  type="button"
                  onClick={() => setShowFeatures((v) => !v)}
                  className="flex w-full items-center justify-between"
                >
                  <span className="text-base font-semibold text-[#111827]">
                    Features
                  </span>
                  {showFeatures ? (
                    <ChevronUp className="size-4 text-[#4B5563]" />
                  ) : (
                    <ChevronDown className="size-4 text-[#4B5563]" />
                  )}
                </button>
                {showFeatures ? (
                  <ul className="mt-1 space-y-1">
                    {selected.features.length === 0 ? (
                      <li className="text-xs text-[#6B7280]">
                        No features listed.
                      </li>
                    ) : (
                      selected.features.map((feature) => (
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
          ) : null}

          {/* Proration / cost preview from the backend. */}
          {selected ? (
            <div className="text-sm">
              {isPreviewLoading ? (
                <p className="text-[#6B7280]">Calculating cost…</p>
              ) : preview ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Due now</span>
                    <span className="font-semibold text-[#111827]">
                      {preview.amountDue > 0
                        ? formatNaira(preview.amountDue)
                        : "₦0.00"}
                    </span>
                  </div>
                  {preview.changeType === "downgrade" ? (
                    <p className="mt-1 text-[#6B7280]">
                      Takes effect {formatDate(preview.effectiveAt)} — no charge
                      now.
                    </p>
                  ) : preview.proration && preview.amountDue > 0 ? (
                    <p className="mt-1 text-[#6B7280]">
                      Prorated for the rest of your current billing cycle.
                    </p>
                  ) : null}
                  {blockedByBalance ? (
                    <p className="mt-1 font-medium text-[#E33C13]">
                      Insufficient wallet balance to cover this upgrade.
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-[#6B7280]">
                  The billing difference will be settled on your next invoice.
                </p>
              )}
            </div>
          ) : null}

          <button
            type="button"
            disabled={!selected || isMutating || blockedByBalance}
            onClick={() => selected && onConfirm(selected._id)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#0669D9] text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMutating
              ? "Applying…"
              : isUpgrade
                ? "Upgrade"
                : "Downgrade"}
            {!isMutating ? <ArrowRight className="size-4" /> : null}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EngineerSubscription() {
  const queryClient = useQueryClient();

  const {
    plans,
    subscription,
    isLoading,
    isMutating,
    subscribe,
    changePlan,
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
  } = useWalletTopup({ callbackPath: "/dashboard/engineer/subscription" });

  /** Open the top-up panel prefilled with the shortfall needed for a plan. */
  const handleTopUp = (plan: SubscriptionPlan) => {
    const shortfallKobo = Math.max(plan.price - availableBalance, 0);
    openTopUp(koboToNaira(shortfallKobo));
  };

  const [showManageModal, setShowManageModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  /** Which plan-change dialog is open (driven from the Manage dialog). */
  const [changeMode, setChangeMode] = useState<"upgrade" | "downgrade" | null>(
    null,
  );

  const [popup, setPopup] = useState<{
    type: "success" | "warning";
    title: string;
    description: string;
  } | null>(null);

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
  const currentPlanPrice =
    currentPlan?.price ?? subscription?.planSnapshot?.price ?? 0;
  // Billing cadence for the Manage dialog — prefer the frozen snapshot.
  const currentInterval =
    subscription?.planSnapshot?.interval ?? currentPlan?.interval ?? "monthly";
  const currentIntervalCount =
    subscription?.planSnapshot?.intervalCount ?? currentPlan?.intervalCount ?? 1;

  // Eligible targets for each direction. Downgrades stay above ₦0 — there is no
  // downgrade to the Free tier.
  const upgradePlans = useMemo(
    () =>
      availablePlans.filter(
        (plan) => plan._id !== currentPlanId && plan.price > currentPlanPrice,
      ),
    [availablePlans, currentPlanId, currentPlanPrice],
  );
  const downgradePlans = useMemo(
    () =>
      availablePlans.filter(
        (plan) =>
          plan._id !== currentPlanId &&
          plan.price > 0 &&
          plan.price < currentPlanPrice,
      ),
    [availablePlans, currentPlanId, currentPlanPrice],
  );

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
    void queryClient.invalidateQueries({
      queryKey: queryKeys.subscription.all,
    });
    setPopup({
      type: "warning",
      title: "Couldn't subscribe",
      description:
        error ?? "We couldn't start your subscription. Please try again.",
    });
  };

  const handleConfirmChangePlan = async (planId: string) => {
    const target = availablePlans.find((plan) => plan._id === planId);
    if (!target) return;
    const isUpgrade = target.price > currentPlanPrice;
    const { ok, error } = await changePlan(target._id);
    setChangeMode(null);
    setShowManageModal(false);
    setPopup(
      ok
        ? {
            type: "success",
            title: isUpgrade ? "Plan upgraded" : "Plan downgraded",
            description: `You're now on the ${target.name} plan. Any billing difference has been applied to this cycle.`,
          }
        : {
            type: "warning",
            title: "Couldn't change plan",
            description:
              error ?? "We couldn't change your plan. Please try again.",
          },
    );
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
    <ProtectedRoute requiredRole={UserRole.ENGINEER}>
      <div>
        <Header
          title="Subscription"
          description="Subscribe to unlock premium tools and exclusive updates."
        />

        <div className="space-y-4 bg-[#F9FAFB] p-4 md:p-6">
          {/* Paystack return banner — shown after coming back from top-up. */}
          <TopUpReturnBanner status={returnStatus} onDismiss={dismissReturnStatus} />

          {/* ── Subscription Analytics ── */}
          <section
            aria-label="Subscription analytics"
            className="rounded-[12px] border border-[#DDE0E5] bg-white p-6"
          >
            <h2 className="text-[20px] font-medium text-[#111827]">
              Subscription analytics
            </h2>

            {/* Fee · Current Plan · Renewal date. The middle cell is the
                highlighted one in the design. */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-0">
              <div className="border-l border-[#DDE0E5] px-6 py-2">
                <p className="text-sm text-[#6B7280]">Fee</p>
                <p className="mt-2 text-xl font-medium text-[#111827]">
                  {hasPaidSubscription && subscription?.planSnapshot
                    ? formatNaira(subscription.planSnapshot.price)
                    : "₦0.00"}
                </p>
              </div>

              <div className="rounded-[12px] border border-[#AAD3F3] bg-[#F6FBFF] px-6 py-3">
                <p className="text-sm text-[#6B7280]">Current Plan</p>
                <p className="mt-2 text-xl font-medium text-[#111827]">
                  {hasPaidSubscription
                    ? currentPlan?.name ?? subscription?.planSnapshot?.name ?? "Active plan"
                    : "Free"}
                </p>
              </div>

              <div className="border-l border-[#DDE0E5] px-6 py-2">
                <p className="text-sm text-[#6B7280]">
                  {subscription?.cancelAtPeriodEnd ? "Ends on" : "Renewal date"}
                </p>
                <p className="mt-2 text-xl font-medium text-[#111827]">
                  {hasPaidSubscription
                    ? formatDate(subscription?.currentPeriodEnd ?? subscription?.nextBillingDate)
                    : "—"}
                </p>
              </div>
            </div>
          </section>

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
              Choose a plan that fits how much work you take on
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

        {/* ── Manage Subscription Modal ── */}
        <Dialog open={showManageModal} onOpenChange={() => setShowManageModal(false)}>
          <DialogContent className="max-w-[460px] rounded-[20px] bg-white p-6">
            <DialogHeader>
              <DialogTitle className="text-[20px] font-semibold text-[#111827]">
                Manage Subscriptions
              </DialogTitle>
            </DialogHeader>
            <div className="mt-5 space-y-5">
              {/* Current plan summary */}
              <div className="rounded-[16px] bg-[#EAF4FF] px-5 py-5">
                <p className="text-sm font-medium text-[#3586E4]">Current Plan</p>
                <p className="mt-1 text-[26px] font-semibold leading-tight text-[#111827]">
                  {currentPlan?.name ??
                    subscription?.planSnapshot?.name ??
                    "Active plan"}
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#111827]">
                  {formatNaira(
                    subscription?.planSnapshot?.price ?? currentPlanPrice,
                  )}
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Billing period:{" "}
                  <span className="font-semibold text-[#111827]">
                    {billingPeriodLabel(currentInterval, currentIntervalCount)}
                  </span>
                </p>
                <p className="mt-3 text-sm text-[#6B7280]">
                  {subscription?.cancelAtPeriodEnd
                    ? `Cancellation scheduled — access ends ${formatDate(subscription?.currentPeriodEnd)}.`
                    : `Renews ${formatDate(subscription?.currentPeriodEnd ?? subscription?.nextBillingDate)}.`}
                </p>
              </div>

              {/* Upgrade / Downgrade */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowManageModal(false);
                    setChangeMode("upgrade");
                  }}
                  className="flex h-12 w-full items-center justify-center rounded-[12px] bg-[#0669D9] text-sm font-medium text-white transition hover:bg-[#0559b8]"
                >
                  Upgrade
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowManageModal(false);
                    setChangeMode("downgrade");
                  }}
                  className="flex h-12 w-full items-center justify-center rounded-[12px] border border-[#FE6E00] bg-[#FFF7F0] text-sm font-medium text-[#FE6E00] transition hover:bg-[#FFEFE0]"
                >
                  Downgrade
                </button>
              </div>

              {/* Cancel */}
              {!subscription?.cancelAtPeriodEnd ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowManageModal(false);
                    setShowCancelModal(true);
                  }}
                  className="w-full text-center text-[15px] font-medium text-[#FE6E00]"
                >
                  Cancel Subscription
                </button>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Upgrade / Downgrade Plan Dialogs ── */}
        <ChangePlanDialog
          key={`upgrade-${changeMode === "upgrade"}`}
          open={changeMode === "upgrade"}
          mode="upgrade"
          plans={upgradePlans}
          isMutating={isMutating}
          onClose={() => setChangeMode(null)}
          onConfirm={handleConfirmChangePlan}
        />
        <ChangePlanDialog
          key={`downgrade-${changeMode === "downgrade"}`}
          open={changeMode === "downgrade"}
          mode="downgrade"
          plans={downgradePlans}
          isMutating={isMutating}
          onClose={() => setChangeMode(null)}
          onConfirm={handleConfirmChangePlan}
        />

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
                className="flex h-12 md:h-14 flex-1 items-center justify-center rounded-[12px] bg-[#0669D9] text-[16px] font-normal text-white disabled:opacity-60"
              >
                No don&apos;t cancel
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isMutating}
                className="flex h-12 md:h-14 flex-1 items-center justify-center rounded-[12px] border border-[#4B5563] text-[16px] font-normal text-[#4B5563] disabled:opacity-60"
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
    </ProtectedRoute>
  );
}
