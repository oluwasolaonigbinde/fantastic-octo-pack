"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileCheck2,
  Mail,
  MessagesSquare,
} from "lucide-react";

import Header from "../../component/header";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  PopUp,
} from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchUserProducts } from "@/store/slices/product-slice";
import { fetchDistributorInbox } from "@/store/slices/rfq-slice";

// Silver removed — not in Figma design
type PlanId = "free" | "starter" | "bronze" | "gold" | "platinum";
type ModalMode = "upgrade" | "downgrade";
type BillingAction = "now" | "later";
type PaymentMethod = "credit_card" | "bank_transfer" | "wallet";

const PLAN_ORDER: PlanId[] = ["free", "starter", "bronze", "gold", "platinum"];

// Badge bg/text colours from Figma design tokens
const PLAN_DETAILS: Record<
  PlanId,
  { name: string; monthly: string; yearly: string; accentClass: string }
> = {
  free: {
    name: "Free",
    monthly: "₦0.00",
    yearly: "No recurring billing",
    accentClass: "bg-[#F3F4F6] text-[#6B7280]",
  },
  starter: {
    name: "Starter",
    monthly: "₦25,000 / month",
    yearly: "₦150,000 billed yearly",
    accentClass: "bg-[#EAF9FF] text-[#3586E4]",
  },
  bronze: {
    name: "Bronze",
    monthly: "₦50,000 / month",
    yearly: "₦300,000 billed yearly",
    accentClass: "bg-[#FFF7F0] text-[#FF8D36]",
  },
  gold: {
    name: "Gold",
    monthly: "₦100,000 / month",
    yearly: "₦600,000 billed yearly",
    accentClass: "bg-[rgba(255,204,0,0.12)] text-[#F2C100]",
  },
  platinum: {
    name: "Platinum",
    monthly: "₦150,000 / month",
    yearly: "₦900,000 billed yearly",
    accentClass: "bg-[rgba(52,199,89,0.12)] text-[#34C759]",
  },
};

// Plans available in the plan-selector dropdown (Component 16) — excludes Free
const SELECTABLE_PLANS: PlanId[] = ["starter", "bronze", "gold", "platinum"];

// Per-card icon background tints from Figma
const KPI_ICON_BG = ["#FCE4FF", "#DEFFE7", "#E2F1FF", "#E2F1FF"] as const;

const MOCK_MESSAGE_SUMMARY = { total: 4, read: 1, unread: 3 };

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

// ─── Plan Selector Dropdown (Figma Component 16 — node 6306-68020) ────────────

function PlanSelectorDropdown({
  value,
  onChange,
}: {
  value: PlanId | null;
  onChange: (plan: PlanId) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedName = value ? PLAN_DETAILS[value].name : null;

  return (
    <div className="relative w-full">
      {/* Closed state — bg #F9FAFB, rounded-[20px] */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-[20px] bg-[#F9FAFB] px-5 py-[22px]"
      >
        <div className="flex items-center gap-3.5">
          <span className="inline-block size-[23px] rounded-full bg-[#E8ECF4]" />
          <span className="text-[20px] font-medium leading-8 text-black">
            {selectedName ?? "Select new plan"}
          </span>
        </div>
        <ChevronDown className="size-6 text-[#4B5563]" />
      </button>

      {/* Expanded state — white bg, shadow */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-full rounded-[20px] bg-white py-5 shadow-lg">
          <div className="flex flex-col gap-4 px-5">
            {SELECTABLE_PLANS.map((planId) => (
              <button
                key={planId}
                type="button"
                onClick={() => {
                  onChange(planId);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3.5 text-[20px] font-medium leading-8 text-black"
              >
                <span className="inline-block size-[23px] rounded-full bg-[#E8ECF4]" />
                {PLAN_DETAILS[planId].name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payment Method Option ────────────────────────────────────────────────────

function PaymentOption({
  active,
  title,
  subtitle,
  children,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div className="w-full rounded-[20px] border border-[#E8ECF4] bg-white p-5 text-left">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex size-6 items-center justify-center rounded-full border ${
              active ? "border-[#FF7A00]" : "border-[#DDE0E5]"
            }`}
          >
            <span
              className={`size-3 rounded-full ${active ? "bg-[#FF7A00]" : "bg-transparent"}`}
            />
          </span>
          <div>
            <p className="text-[18px] font-medium text-[#111827]">{title}</p>
            {subtitle ? <p className="text-sm text-[#6B7280]">{subtitle}</p> : null}
          </div>
        </div>
        <ChevronDown className="size-5 text-[#6B7280]" />
      </button>
      {active ? (
        <div className="mt-5 border-t border-[#EEF2F7] pt-5">{children}</div>
      ) : null}
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  planId,
  currentPlan,
  onChoose,
  onManage,
}: {
  planId: PlanId;
  currentPlan: PlanId;
  onChoose: (planId: PlanId) => void;
  onManage: () => void;
}) {
  const plan = PLAN_DETAILS[planId];
  const isCurrent = currentPlan === planId;
  const priceDisplay = plan.monthly.replace(" / month", "");

  return (
    <article className="flex flex-col justify-between rounded-[12px] border border-[#DDE0E5] bg-white p-5">
      {/* Top — badge, price, tagline */}
      <div className="border-b border-[#DDE0E5] pb-10">
        <div
          className={`inline-flex items-center rounded-full px-5 py-2 text-2xl font-semibold leading-10 ${plan.accentClass}`}
        >
          {plan.name}
          {isCurrent ? " (current)" : ""}
        </div>
        <p className="mt-4 text-[32px] font-semibold leading-[48px] text-[#4B5563]">
          {priceDisplay}
        </p>
        <p className="text-[20px] font-semibold leading-8 text-[#6B7280]">
          Design for growing distributors
        </p>
      </div>

      {/* Accordion rows — right-arrow icon (icon-park-solid:right-one equivalent) */}
      <div className="mt-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-[24px] font-bold leading-10 text-[#4B5563]">Billing Period</span>
          <ChevronRight className="size-6 text-[#4B5563]" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[21px] font-bold leading-[36px] text-[#4B5563]">Features</span>
          <ChevronRight className="size-6 text-[#4B5563]" />
        </div>
      </div>

      {/* CTA button */}
      <div className="mt-10">
        {isCurrent ? (
          // Current plan — "Manage Subscription" greyed button (Figma: #C4C8CE bg, #111827 text)
          <button
            type="button"
            onClick={onManage}
            className="w-full rounded-[12px] py-3 text-[16px] font-normal leading-6 text-[#111827]"
            style={{ backgroundColor: "#C4C8CE" }}
          >
            Manage Subscription
          </button>
        ) : (
          <Button
            title={planId === "free" ? "Downgrade to Free" : `Upgrade to ${plan.name}`}
            onClick={() => onChoose(planId)}
            className="rounded-[12px]"
          />
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

  const [currentPlan, setCurrentPlan] = useState<PlanId>("starter");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("starter");
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [billingAction, setBillingAction] = useState<BillingAction>("later");
  const [showPaymentView, setShowPaymentView] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("bank_transfer");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  // Manage subscription modal (plan selector dropdown — Component 16)
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageSelectedPlan, setManageSelectedPlan] = useState<PlanId | null>(null);
  // Cancel subscription modal (Figma node 6312-68206)
  const [showCancelModal, setShowCancelModal] = useState(false);

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

  const selectedPlanDetails = PLAN_DETAILS[selectedPlan];

  const finishPaymentFlow = () => {
    setCurrentPlan(selectedPlan);
    setShowPaymentView(false);
    setShowSuccessPopup(true);
  };

  const openUpgradeDowngradeModal = (nextPlan: PlanId) => {
    setSelectedPlan(nextPlan);
    setBillingAction("later");
    setModalMode(
      PLAN_ORDER.indexOf(nextPlan) > PLAN_ORDER.indexOf(currentPlan) ? "upgrade" : "downgrade",
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
        {!showPaymentView ? (
          <>
            {/* ── KPI Cards — each with its own icon tint from Figma ── */}
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

            {/* ── Current Plan Bar — colours from Figma: #F6FBFF / #AAD3F3 ── */}
            <nav
              aria-label="Current subscription"
              className="rounded-[12px] border border-[#DDE0E5] bg-white p-5"
            >
              <div className="grid gap-0 divide-x divide-[#DDE0E5] lg:grid-cols-3">
                <div className="rounded-[20px] border border-[#AAD3F3] bg-[#F6FBFF] px-5 py-4">
                  <p className="text-sm text-[#6B7280]">Current Plan</p>
                  <p className="mt-2 text-lg font-medium text-[#111827]">Starter plan</p>
                </div>
                <div className="px-8 py-4">
                  <p className="text-sm text-[#6B7280]">Fee</p>
                  <p className="mt-2 text-xl font-semibold text-[#111827]">₦25,000</p>
                </div>
                <div className="px-8 py-4">
                  <p className="text-sm text-[#6B7280]">Renewal date</p>
                  <p className="mt-2 text-xl font-semibold text-[#111827]">30th May 2025</p>
                </div>
              </div>
            </nav>

            {/* ── "All available plans" header — Medium 500, 20px per Figma ── */}
            <section className="rounded-[12px] border border-[#DDE0E5] bg-white p-5">
              <h2 className="text-[20px] font-medium text-[#111827]">All available plans - 6</h2>
            </section>

            {/* ── Plan Cards — 5 tiers in xl:grid-cols-3 = 3+2 rows matching Figma ── */}
            <section
              className="rounded-[20px] border border-[#DDE0E5] p-5"
              style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
            >
              {/* Section header — Bold 700, 28px per Figma */}
              <h2 className="text-[28px] font-bold text-[#111827]">Subscriptions</h2>
              <p className="mt-2 text-[17px] font-semibold text-[#6B7280]">
                Choose a plan that fits your business stage
              </p>

              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                {PLAN_ORDER.map((planId) => (
                  <PlanCard
                    key={planId}
                    planId={planId}
                    currentPlan={currentPlan}
                    onManage={() => {
                      setManageSelectedPlan(null);
                      setShowManageModal(true);
                    }}
                    onChoose={openUpgradeDowngradeModal}
                  />
                ))}
              </div>
            </section>
          </>
        ) : (
          /* ── Payment View ── */
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowPaymentView(false)}
                className="inline-flex items-center gap-2 text-[18px] text-[#4B5563]"
              >
                <ArrowLeft className="size-5" />
                Go Back
              </button>
              <div className="rounded-[24px] border border-[#E8ECF4] bg-white p-5 shadow-sm">
                <h2 className="text-[28px] font-semibold text-[#111827]">Payment</h2>
                <p className="mt-2 text-sm text-[#6B7280]">
                  Select preferred payment method to proceed
                </p>
                <div className="mt-6 space-y-4">
                  <PaymentOption
                    active={selectedPaymentMethod === "credit_card"}
                    title="Credit card"
                    subtitle="Visa / Mastercard"
                    onClick={() => setSelectedPaymentMethod("credit_card")}
                  >
                    <p className="text-sm text-[#6B7280]">
                      Card payment will be wired when the seller billing slice goes live.
                    </p>
                  </PaymentOption>
                  <PaymentOption
                    active={selectedPaymentMethod === "bank_transfer"}
                    title="Bank transfer"
                    subtitle="Make payment into the account details below and click the confirmation button."
                    onClick={() => setSelectedPaymentMethod("bank_transfer")}
                  >
                    <div className="space-y-3 text-sm text-[#4B5563]">
                      <p>Account number: 7694873992</p>
                      <p>Account name: Samuel Smart</p>
                      <p>Bank name: GTB bank</p>
                      <p className="pt-2 text-[28px] font-semibold text-[#111827]">
                        05:49{" "}
                        <span className="text-sm font-normal text-[#6B7280]">
                          (Make payment before time expires)
                        </span>
                      </p>
                      <Button
                        title="I have made payment"
                        className="rounded-2xl"
                        onClick={finishPaymentFlow}
                      />
                    </div>
                  </PaymentOption>
                  <PaymentOption
                    active={selectedPaymentMethod === "wallet"}
                    title="My wallet"
                    subtitle="You can use your available wallet to make payment."
                    onClick={() => setSelectedPaymentMethod("wallet")}
                  >
                    <div className="space-y-4 text-sm text-[#4B5563]">
                      <p>Available wallet balance</p>
                      <p className="text-[36px] font-semibold text-[#111827]">₦150,000</p>
                      <Button
                        title="Make payment"
                        className="rounded-2xl"
                        onClick={finishPaymentFlow}
                      />
                    </div>
                  </PaymentOption>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-[#E8ECF4] bg-white p-5 shadow-sm">
              <h2 className="text-[28px] font-semibold text-[#111827]">Payment summary</h2>
              <div className="mt-16 space-y-5 text-[18px] text-[#4B5563]">
                <div className="flex items-center justify-between">
                  <span>Item&apos;s total</span>
                  <span>{selectedPlanDetails.monthly.replace(" / month", "")}</span>
                </div>
                <div className="flex items-center justify-between text-[28px] font-semibold text-[#111827]">
                  <span>Total</span>
                  <span>{selectedPlanDetails.monthly.replace(" / month", "")}</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ── Upgrade / Downgrade Confirmation Modal ── */}
      <Dialog open={modalMode !== null} onOpenChange={() => setModalMode(null)}>
        <DialogContent className="max-w-[500px] rounded-[28px] p-0">
          <DialogHeader className="border-b border-[#EAEFF5] px-8 py-6">
            <DialogTitle className="text-[20px] font-semibold text-[#111827]">
              {modalMode === "upgrade"
                ? "Upgrade Subscription Plan"
                : "Downgrade Subscription Plan"}
            </DialogTitle>
            <DialogDescription className="mt-5 rounded-[20px] border border-[#86BEFF] bg-[#F3FAFF] px-6 py-8 text-center text-[18px] leading-8 text-[#4B5563]">
              {modalMode === "upgrade"
                ? "Are you sure you want to upgrade? This will remove premium privileges and take your account to the premium plan."
                : "Are you sure you want to downgrade? This will remove basic plan privileges and take your account to the free plan."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-8 py-7 text-sm text-[#4B5563]">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={billingAction === "now"}
                onChange={() => setBillingAction("now")}
                className="mt-1 size-5"
              />
              <span>
                <span className="block text-[18px] font-medium text-[#111827]">
                  {modalMode === "upgrade" ? "Upgrade now" : "Schedule downgrade"}
                </span>
                {modalMode === "upgrade"
                  ? "This will automatically upgrade your subscription plan."
                  : "This account will be downgraded at the end of your current plan - May 31st 2025."}
              </span>
            </label>
            {modalMode === "upgrade" ? (
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={billingAction === "later"}
                  onChange={() => setBillingAction("later")}
                  className="mt-1 size-5"
                />
                <span>
                  <span className="block text-[18px] font-medium text-[#111827]">
                    Upgrade later (Auto renew)
                  </span>
                  This account will be upgraded at the end of your current plan - May 31st 2025.
                </span>
              </label>
            ) : null}
            <div className="rounded-[24px] border border-[#56D67A] px-6 py-5 text-center">
              <p className="text-sm text-[#4B5563]">Your new fee will be</p>
              <p className="mt-3 text-[34px] font-semibold text-[#2BA84A]">
                {selectedPlanDetails.monthly}
              </p>
              <p className="mt-2 text-sm text-[#6B7280]">{selectedPlanDetails.yearly}</p>
            </div>
            <Button
              title={modalMode === "upgrade" ? "Continue" : "Schedule downgrade plan"}
              className="rounded-2xl"
              iconRight={<ArrowLeft className="size-4 rotate-180" />}
              onClick={() => {
                setShowPaymentView(true);
                setModalMode(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Manage Subscription Modal (hosts Component 16 plan selector) ── */}
      <Dialog open={showManageModal} onOpenChange={() => setShowManageModal(false)}>
        <DialogContent className="max-w-[500px] rounded-[20px] bg-white p-8">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold text-[#111827]">
              Manage Subscription
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <PlanSelectorDropdown
              value={manageSelectedPlan}
              onChange={(plan) => setManageSelectedPlan(plan)}
            />
            {manageSelectedPlan && (
              <Button
                title={`Switch to ${PLAN_DETAILS[manageSelectedPlan].name}`}
                className="rounded-[12px]"
                onClick={() => {
                  openUpgradeDowngradeModal(manageSelectedPlan);
                  setShowManageModal(false);
                }}
              />
            )}
            {/* Cancel subscription entry point */}
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
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Subscription Modal (Figma node 6312-68206) ── */}
      <Dialog open={showCancelModal} onOpenChange={() => setShowCancelModal(false)}>
        {/* 500×376px, white, rounded-[20px] */}
        <DialogContent className="max-w-[500px] rounded-[20px] bg-white p-0">
          <div className="px-10 pt-[34px]">
            {/* Title — error red #E33C13, Medium 500, 20px, centered */}
            <h2 className="text-center text-[20px] font-medium leading-8 text-[#E33C13]">
              Cancel Subscription
            </h2>

            {/* Warning box — #FFF7F0 bg, #FE6E00 border, 20px radius, 128px tall */}
            <div
              className="mt-6 flex items-center justify-center rounded-[20px] border px-4 py-4"
              style={{
                backgroundColor: "#FFF7F0",
                borderColor: "#FE6E00",
                minHeight: 128,
              }}
            >
              <p className="text-center text-[16px] font-normal leading-6 text-[#111827]">
                Are you sure you want to cancel current plan?
                <br />
                This will remove current plan privileges and take your all rolling premium
                features
              </p>
            </div>
          </div>

          {/* Buttons — row, gap 20px, height 56px each */}
          <div className="flex items-center gap-5 px-10 pb-[34px] pt-6">
            {/* "No don't cancel" — teal #0669D9, white text */}
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="flex h-14 flex-1 items-center justify-center rounded-[12px] bg-[#0669D9] text-[16px] font-normal text-white"
            >
              No don&apos;t cancel
            </button>
            {/* "Yes Cancel" — no fill, border #4B5563, grey text */}
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="flex h-14 flex-1 items-center justify-center rounded-[12px] border border-[#4B5563] text-[16px] font-normal text-[#4B5563]"
            >
              Yes Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <PopUp
        open={showSuccessPopup}
        type="success"
        title="Subscription updated"
        description="Your distributor subscription selection has been updated locally. Billing and plan enforcement will connect once the subscription slice is activated."
        primaryButtonText="Okay"
        onClose={() => setShowSuccessPopup(false)}
      />
    </div>
  );
}
