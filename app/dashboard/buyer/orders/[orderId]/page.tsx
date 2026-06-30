"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Info,
  Phone,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

import Header from "../../../component/header";
import { Skeleton } from "@/components/base";
import DeliveryStepper from "@/components/orders/DeliveryStepper";
import {
  buyerDemoOrderMeta,
  buyerDemoOrders,
  getBuyerOrderStatusTone,
  getOrderDisplayId,
  getOrderProductImage,
  getPersonName,
  toBuyerOrderRow,
  type BuyerOrderRow,
  type BuyerOrderStage,
} from "@/constants/demoBuyerOrders";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import {
  clearDraftSave,
  confirmOrderReceipt,
  fetchOrderDetail,
  updateOrderDraft,
} from "@/store/slices/order-slice";
import { createOrderDispute } from "@/store/slices/order-dispute-slice";
import { useWallet } from "@/hooks/useWallet";
import { useOrderPayment } from "@/hooks/useOrderPayment";
import { koboToNaira } from "@/lib/wallet-format";
import type { Order, OrderPaymentMethod } from "@/types/order";
import {
  formatDeliveryAddress,
  getActiveMilestoneCount,
  getOrderMilestones,
  isAwaitingBuyerConfirmation,
  isPaidOrderStatus,
} from "@/types/order";

type ModalKind =
  | "payment"
  | "delivery"
  | "installation"
  | "dispute"
  | "disputeSuccess"
  | "editDraft"
  | null;

type PaymentOption = {
  label: string;
  /** Functional rails carry a method; disabled rails are "coming soon". */
  method: OrderPaymentMethod | null;
};

const paymentMethods: PaymentOption[] = [
  { label: "BAIY trade assurance", method: "wallet" },
  { label: "Paystack", method: "paystack" },
  { label: "Flutterwave", method: null },
  { label: "Google Pay", method: null },
  { label: "Apple Pay", method: null },
  { label: "Bank wallet", method: null },
];

const stageFromQuery = (value: string | null, status?: string): BuyerOrderStage => {
  if (
    value === "payment" ||
    value === "delivery" ||
    value === "installation" ||
    value === "completed"
  ) {
    return value;
  }
  if (status === "completed") return "completed";
  return "ongoing";
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "--";
  return new Intl.DateTimeFormat("en-GB").format(parsed);
};

// Demo-walkthrough stage → completed-milestone count, on the canonical
// (installation) scale: Create, Payment, Received, Delivered, Installed, Completed.
const milestoneCountByStage: Record<BuyerOrderStage, number> = {
  ongoing: 1,
  payment: 2,
  delivery: 4, // Received + Delivered done, delivery tracking in progress.
  installation: 5, // Installed done, awaiting buyer confirmation.
  completed: 6,
};

/**
 * True once the order has been paid for (escrow funded). The live API has no
 * `paymentStatus` field — payment is encoded in `status`, which the backend
 * advances through the money-in / fulfillment states (paid → processing →
 * received → delivered → installed → completed). See `isPaidOrderStatus`.
 */
const isOrderPaid = (paymentStatus?: string, status?: string) => {
  // `paymentStatus` is legacy/demo only; kept for back-compat.
  if (paymentStatus && paymentStatus.toLowerCase() === "paid") return true;
  return isPaidOrderStatus(status);
};

function DetailStat({
  label,
  value,
  valueClassName = "text-[#111827]",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-xs text-[#8A94A6]">{label}</p>
      <p className={`mt-1 text-sm font-medium ${valueClassName}`}>{value}</p>
    </div>
  );
}

function InfoCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-[#DDE0E5] bg-white p-5 ${className}`}>
      <h2 className="text-base font-medium text-[#111827] md:text-lg">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ProductVisual({ image, name }: { image?: string; name: string }) {
  return (
    <div className="flex h-[145px] items-center justify-center overflow-hidden rounded-xl border border-[#E9EEF5] bg-[#F8FAFC] md:h-[150px]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="h-full w-full object-contain" />
      ) : (
        <div className="relative h-20 w-36 rounded-full bg-gradient-to-br from-[#DCE7EF] via-white to-[#B8C8D6] shadow-inner">
          <div className="absolute left-5 top-5 h-7 w-24 rounded-full bg-white/80 shadow" />
        </div>
      )}
    </div>
  );
}

function OrderSummaryCard({ order }: { order: BuyerOrderRow }) {
  return (
    <InfoCard title="Order summary">
      <div className="flex items-center gap-3">
        <ProductVisual image={order.productImage} name={order.productName} />
      </div>
      <div className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-[#6B7280]">Order ID</span>
          <span className="font-medium text-[#111827]">{order.id}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[#6B7280]">Invoice ID</span>
          <span className="font-medium text-[#111827]">{buyerDemoOrderMeta.invoiceId}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[#6B7280]">Items total</span>
          <span className="font-medium text-[#111827]">{formatCurrency(order.totalPrice)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[#6B7280]">Delivery fee</span>
          <span className="font-medium text-[#111827]">
            {formatCurrency(buyerDemoOrderMeta.deliveryFee)}
          </span>
        </div>
        <div className="flex justify-between gap-4 border-t border-[#EEF2F7] pt-3">
          <span className="font-medium text-[#111827]">Total</span>
          <span className="font-semibold text-primary">{formatCurrency(order.totalPrice)}</span>
        </div>
      </div>
    </InfoCard>
  );
}

/** Shown under the delivery stepper while the order is frozen by an open dispute. */
function DisputeBanner() {
  return (
    <div className="mt-6 flex items-start gap-2 rounded-xl border border-[#FACC15] bg-[#FFFBEB] px-4 py-3">
      <Info size={16} className="mt-0.5 shrink-0 text-[#B45309]" />
      <p className="text-sm text-[#B45309]">
        This order is under active dispute. Tracking is paused until the dispute is
        resolved.
      </p>
    </div>
  );
}

function ActionNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-[#DDEBFF] bg-[#F4F9FF] px-4 py-3 text-sm text-primary">
      {children}
    </p>
  );
}

/** Live escrow countdown shown on the tracking card (HOUR : MINUTES : SECONDS). */
function CountdownTimer({ target }: { target?: Date }) {
  const [now, setNow] = useState(() => Date.now());
  // When the order carries no real deadline, anchor a 24h window at mount time.
  const [fallbackDeadline] = useState(() => Date.now() + 24 * 60 * 60 * 1000);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const deadline = target ? target.getTime() : fallbackDeadline;
  const remaining = Math.max(0, deadline - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const segments: { value: number; label: string }[] = [
    { value: Math.floor(totalSeconds / 3600), label: "HOUR" },
    { value: Math.floor((totalSeconds % 3600) / 60), label: "MINUTES" },
    { value: totalSeconds % 60, label: "SECONDS" },
  ];
  const pad = (value: number) => String(value).padStart(2, "0");

  return (
    <div className="mt-2 flex items-end gap-2">
      {segments.map((segment, index) => (
        <div key={segment.label} className="flex items-end gap-2">
          <div className="text-center">
            <span className="text-2xl font-semibold text-[#FF6B00]">
              {pad(segment.value)}
            </span>
            <span className="mt-1 block text-[10px] uppercase tracking-wide text-[#9CA3AF]">
              {segment.label}
            </span>
          </div>
          {index < segments.length - 1 ? (
            <span className="pb-4 text-xl font-semibold text-[#FF6B00]">:</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function BuyerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const {
    currentOrder,
    isLoading,
    isError,
    message,
    isConfirming,
    confirmError,
    isSavingDraft,
    draftError,
  } = useAppSelector((state) => state.order);
  const { data: authData } = useAppSelector((state) => state.auth);
  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0].label);
  const [modal, setModal] = useState<ModalKind>(null);
  const [notice, setNotice] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeError, setDisputeError] = useState("");

  const orderId = params.orderId as string;
  const { wallet } = useWallet();
  const {
    isPaying,
    payError,
    isPaid,
    payResult,
    pay,
    reset: resetPayment,
  } = useOrderPayment({
    orderId,
    callbackPath: `/dashboard/buyer/orders/${orderId}?view=payment`,
  });
  const demoOrder = useMemo(
    () => buyerDemoOrders.find((item) => item.sourceId === orderId || item.id === orderId),
    [orderId],
  );

  useEffect(() => {
    if (authData?.tokens?.accessToken && orderId && !demoOrder) {
      dispatch(fetchOrderDetail({ token: authData.tokens.accessToken, orderId }));
    }
  }, [authData?.tokens?.accessToken, demoOrder, dispatch, orderId]);

  const liveOrder: Order | null = demoOrder ? null : currentOrder;
  const order = useMemo<BuyerOrderRow | null>(() => {
    if (demoOrder) return demoOrder;
    return liveOrder ? toBuyerOrderRow(liveOrder) : null;
  }, [demoOrder, liveOrder]);

  const liveStatus = order?.status ?? "";
  const paid = isOrderPaid(liveOrder?.paymentStatus, liveStatus);
  const requestedView = searchParams.get("view");
  // A `draft_pending_buyer` order was created by a distributor on the buyer's
  // behalf. The buyer reviews it (notably adding a delivery address) before
  // paying. Delivery address is required before payment can proceed.
  const isDraft = liveStatus === "draft_pending_buyer";
  const needsDeliveryAddress =
    isDraft && !formatDeliveryAddress(liveOrder?.deliveryAddress);
  // The payment form only opens when explicitly requested AND still unpaid.
  const showPaymentForm = requestedView === "payment" && !paid;
  // Installation-dependent progress milestones (shared with the distributor view).
  const requiresInstallation = demoOrder
    ? true
    : Boolean(liveOrder?.requiresInstallation);
  // The distributor has finished every required fulfillment stage but the buyer
  // hasn't confirmed receipt yet. Because it's the buyer who confirms delivery,
  // the final logistics step is shown as in-progress ("Delivery in progress") and
  // stays pending until they confirm — it doesn't read as a completed "Delivered".
  const awaitingBuyerConfirmation =
    !demoOrder && paid && !!liveOrder && isAwaitingBuyerConfirmation(liveOrder);
  // Live orders: an unpaid order stays on the pre-payment ("ongoing") view; a
  // paid order is ALWAYS in the tracking flow and lives entirely in the "delivery"
  // part — including the confirm-receipt step, which only differs by whether the
  // distributor has finished delivering (`awaitingBuyerConfirmation`).
  const stage: BuyerOrderStage = showPaymentForm
    ? "payment"
    : demoOrder
      ? stageFromQuery(requestedView, liveStatus)
      : !paid
        ? "ongoing"
        : liveStatus === "completed"
          ? "completed"
          : "delivery";
  const baseMilestones = getOrderMilestones(requiresInstallation);
  const inProgressIndex = requiresInstallation
    ? baseMilestones.indexOf("Installed")
    : baseMilestones.indexOf("Delivered");
  const milestones = awaitingBuyerConfirmation
    ? baseMilestones.map((label, index) =>
        index === inProgressIndex
          ? requiresInstallation
            ? "Installation in progress"
            : "Delivery in progress"
          : label,
      )
    : baseMilestones;
  const activeMilestoneCount = demoOrder
    ? milestoneCountByStage[stage]
    : awaitingBuyerConfirmation
      ? inProgressIndex // steps before the in-progress one are complete; it stays pending.
      : paid && liveOrder
        ? Math.max(2, getActiveMilestoneCount(liveOrder, requiresInstallation))
        : 1;
  // The distributor has delivered, but it's the buyer who confirms it — so it
  // stays "in progress" until they do.
  const productStatusText =
    stage === "completed"
      ? "Completed"
      : awaitingBuyerConfirmation
        ? "Delivery in progress — confirm receipt"
        : "Awaiting Suppliers Delivery";
  // The confirm-receipt UI (and supplier evidence) shows on the delivery part
  // once the distributor has finished delivering. Demo orders keep their
  // walkthrough's dedicated "installation" stage.
  const deliveryUnderway = demoOrder
    ? stage === "installation"
    : awaitingBuyerConfirmation;
  const hasActiveDispute = Boolean(liveOrder?.activeDisputeId);
  // Only the live order can carry a real deadline; the API doesn't return one
  // today, so this is usually undefined and CountdownTimer falls back to a
  // mount-anchored 24h window.
  const proposedDate = liveOrder?.proposedDeliveryDate
    ? new Date(liveOrder.proposedDeliveryDate)
    : null;
  const escrowDeadline =
    proposedDate && !Number.isNaN(proposedDate.getTime())
      ? proposedDate
      : undefined;
  const expectedByText = liveOrder?.proposedDeliveryDate
    ? formatDate(liveOrder.proposedDeliveryDate)
    : buyerDemoOrderMeta.escrow.expectedBy;
  const statusTone = getBuyerOrderStatusTone(stage === "completed" ? "completed" : liveStatus);
  const productImage = order?.productImage || getOrderProductImage(liveOrder);
  const supplierName =
    order?.supplierName || getPersonName(liveOrder?.seller, buyerDemoOrderMeta.supplier.name);
  const sellerRef =
    liveOrder?.seller && typeof liveOrder.seller === "object"
      ? liveOrder.seller
      : null;
  const supplierId =
    sellerRef?._id ??
    (typeof liveOrder?.seller === "string" ? liveOrder.seller : "");
  const supplierEmail = sellerRef?.email || buyerDemoOrderMeta.supplier.email;
  const supplierPhone =
    sellerRef?.phoneNumber || buyerDemoOrderMeta.supplier.phone;
  const supplierRole =
    sellerRef?.businessName ||
    sellerRef?.distributorStoreProfile?.businessName ||
    buyerDemoOrderMeta.supplier.role;
  const buyerName = getPersonName(liveOrder?.buyer, buyerDemoOrderMeta.deliveryAddress.name);
  const buyerEmail =
    liveOrder?.buyer && typeof liveOrder.buyer === "object"
      ? liveOrder.buyer.email
      : buyerDemoOrderMeta.deliveryAddress.email;
  const deliveryAddressText =
    formatDeliveryAddress(liveOrder?.deliveryAddress) ||
    buyerDemoOrderMeta.deliveryAddress.address;

  const navigateStage = (nextStage: BuyerOrderStage) => {
    router.push(`/dashboard/buyer/orders/${orderId}?view=${nextStage}`);
  };

  // Wallet funds compared against the order total. Order totals are in naira;
  // wallet balances are in kobo.
  const orderTotal = order?.totalPrice ?? 0;
  const walletNaira = wallet ? koboToNaira(wallet.availableBalance) : 0;
  const selectedOption = paymentMethods.find((m) => m.label === selectedPayment);
  const insufficientWallet =
    selectedOption?.method === "wallet" && walletNaira < orderTotal;

  // Surface the receipt the moment a payment settles (wallet inline or on the
  // return trip from Paystack).
  useEffect(() => {
    // Sync the settled-payment signal from Redux into the receipt modal.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isPaid) setModal("payment");
  }, [isPaid]);

  // A paid order has no business on the payment screen. If the buyer lands here
  // (back button, stale link, refresh) for an already-paid live order, send
  // them to the order details view. `paid` comes straight from backend data.
  useEffect(() => {
    if (!demoOrder && paid && requestedView === "payment" && !isPaid) {
      router.replace(`/dashboard/buyer/orders/${orderId}`);
    }
  }, [demoOrder, paid, requestedView, isPaid, orderId, router]);

  // Open the draft editor when the buyer arrives from the chat "Confirm order"
  // action (?view=edit) on a live draft order.
  useEffect(() => {
    if (!demoOrder && isDraft && requestedView === "edit") {
      dispatch(clearDraftSave());
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModal("editDraft");
    }
  }, [demoOrder, isDraft, requestedView, dispatch]);

  const handleSubmitPayment = () => {
    if (!selectedOption?.method || insufficientWallet) return;
    // A draft order must carry a delivery address before it can be paid for.
    if (needsDeliveryAddress) {
      dispatch(clearDraftSave());
      setModal("editDraft");
      return;
    }
    void pay(selectedOption.method);
  };

  // Persist edits to a draft order (PATCH /orders/:id/draft). On success the
  // refreshed order flows back through Redux; we close the editor.
  const handleSaveDraft = async (payload: {
    quantity?: number;
    notes?: string;
    deliveryAddress?: string;
  }) => {
    const token = authData?.tokens?.accessToken;
    if (!token || isSavingDraft) return;
    const result = await dispatch(
      updateOrderDraft({ token, orderId, payload }),
    );
    if (updateOrderDraft.fulfilled.match(result)) {
      setModal(null);
      // Drop ?view=edit so the editor doesn't immediately reopen.
      if (requestedView === "edit") {
        router.replace(`/dashboard/buyer/orders/${orderId}`);
      }
    }
  };

  // Buyer confirms receipt of a fulfilled order: POST /orders/:id/received,
  // which releases escrow and advances the order to "completed". On success we
  // show the confirmation modal; the refreshed order then renders the
  // completed view. Demo orders keep the local, client-only walkthrough.
  const handleConfirmReceipt = async () => {
    if (demoOrder) {
      setModal("installation");
      return;
    }
    const token = authData?.tokens?.accessToken;
    if (!token || isConfirming) return;
    const result = await dispatch(confirmOrderReceipt({ token, orderId }));
    if (confirmOrderReceipt.fulfilled.match(result)) {
      setModal("installation");
    }
  };

  // Raise a dispute against the order: POST /order-disputes/order/:id with the
  // selected reason, description, and optional evidence file. On success we show
  // the confirmation modal. Demo orders short-circuit to the success state.
  const handleSubmitDispute = async (
    reason: string,
    description: string,
    file?: File,
  ) => {
    setDisputeError("");
    if (demoOrder) {
      setModal("disputeSuccess");
      return;
    }
    const token = authData?.tokens?.accessToken;
    if (!token) {
      setDisputeError("You need to be signed in to raise a dispute.");
      return;
    }
    setIsSubmittingDispute(true);
    const result = await dispatch(
      createOrderDispute({
        token,
        orderId,
        payload: { reason, description },
        file,
      }),
    );
    setIsSubmittingDispute(false);
    if (createOrderDispute.fulfilled.match(result)) {
      setModal("disputeSuccess");
    } else {
      setDisputeError(
        (result.payload as string) || "Failed to raise dispute. Please try again.",
      );
    }
  };

  // Clearing payment state stops the receipt effect from reopening the modal.
  const closeModal = () => {
    if (modal === "payment") resetPayment();
    if (modal === "dispute") setDisputeError("");
    if (modal === "editDraft") {
      dispatch(clearDraftSave());
      if (requestedView === "edit") {
        router.replace(`/dashboard/buyer/orders/${orderId}`);
      }
    }
    setModal(null);
  };

  const payReference =
    (typeof payResult?.reference === "string" && payResult.reference) ||
    liveOrder?.paymentReference ||
    buyerDemoOrderMeta.paymentReference;

  if (isLoading || (!order && !demoOrder)) {
    return (
      <div>
        <Header title="Orders" description="Manage and track all orders." />
        <main className="space-y-4 p-4 md:p-6">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-48" />
          <div className="grid gap-4 xl:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          {isError ? (
            <ActionNotice>{message || "Unable to load order detail."}</ActionNotice>
          ) : null}
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <Header title="Orders" description="Manage and track all orders." />
        <main className="p-4 md:p-6">
          <ActionNotice>Unable to resolve this order.</ActionNotice>
        </main>
      </div>
    );
  }

  const paymentStatusLabel = paid ? "Paid" : "Not Paid";

  return (
    <div>
      <Header title="Orders" description="Manage and track all orders." />

      <main className="space-y-5 bg-[#F9FAFB] p-4 md:p-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard/buyer/orders")}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#111827]"
        >
          <ArrowLeft size={17} />
          Go Back
        </button>

        {stage === "payment" ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
              <h1 className="text-lg font-medium text-[#111827]">Payment</h1>
              <p className="mt-1 text-sm font-medium text-[#111827]">Payment options</p>
              <p className="mt-0.5 text-sm text-[#6B7280]">
                Select preferred payment method to proceed
              </p>

              <div className="mt-6 rounded-2xl border border-[#DDE0E5]">
                {paymentMethods.map((option) => {
                  const disabled = option.method === null;
                  const isWallet = option.method === "wallet";
                  return (
                    <button
                      key={option.label}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedPayment(option.label)}
                      className={`flex w-full items-center justify-between border-b border-[#EEF2F7] px-5 py-4 text-left last:border-b-0 ${
                        disabled ? "cursor-not-allowed opacity-50" : ""
                      }`}
                    >
                      <span className="flex items-start gap-3 text-sm text-[#111827]">
                        <span
                          className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                            selectedPayment === option.label
                              ? "border-primary"
                              : "border-[#DDE0E5]"
                          }`}
                        >
                          {selectedPayment === option.label ? (
                            <span className="size-2 rounded-full bg-primary" />
                          ) : null}
                        </span>
                        <span className="flex flex-col">
                          {option.label}
                          {isWallet ? (
                            <span className="text-xs text-[#6B7280]">
                              Balance: {formatCurrency(walletNaira)}
                            </span>
                          ) : null}
                          {disabled ? (
                            <span className="text-xs text-[#9CA3AF]">Coming soon</span>
                          ) : null}
                        </span>
                      </span>
                      <CreditCard size={18} className="text-[#6B7280]" />
                    </button>
                  );
                })}
              </div>

              {insufficientWallet ? (
                <p className="mt-4 rounded-lg border border-[#F5A400] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309]">
                  Your wallet balance is too low for this order. Top up your wallet
                  or pay with Paystack.
                </p>
              ) : null}

              {payError ? (
                <p className="mt-4 rounded-lg border border-[#E33C13] bg-[#FFF5F3] px-4 py-3 text-sm text-[#E33C13]">
                  {payError}
                </p>
              ) : null}

              <p className="mt-5 text-xs leading-5 text-[#6B7280]">
                Paystack payments redirect you to a secure checkout for{" "}
                {formatCurrency(orderTotal)} and return here once complete.
              </p>

              <button
                type="button"
                onClick={handleSubmitPayment}
                disabled={isPaying || insufficientWallet || !selectedOption?.method}
                className="mt-6 h-12 w-full rounded-xl bg-primary text-sm font-medium text-white disabled:opacity-60 md:max-w-[260px]"
              >
                {isPaying
                  ? selectedOption?.method === "paystack"
                    ? "Redirecting to Paystack…"
                    : "Processing payment…"
                  : `Pay ${formatCurrency(orderTotal)}`}
              </button>
            </section>

            <OrderSummaryCard order={order} />
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-[#DDE0E5] bg-white p-4 md:p-5">
              <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
                <ProductVisual image={productImage} name={order.productName} />

                <div className="grid content-start gap-5 xl:grid-cols-[1fr_auto]">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                    <DetailStat label="Order ID" value={order.id || getOrderDisplayId(orderId)} />
                    <DetailStat label="Name of product" value={order.productName} />
                    <DetailStat label="Quantity" value={String(order.quantity)} />
                    <DetailStat label="Unit price" value={formatCurrency(order.unitPrice)} />
                    <DetailStat label="Total price" value={formatCurrency(order.totalPrice)} />
                    <DetailStat label="Date created" value={formatDate(order.createdAt)} />
                    <DetailStat
                      label="Payment status"
                      value={paymentStatusLabel}
                      valueClassName={paid ? "text-[#16A34A]" : "text-[#F59E0B]"}
                    />
                    <DetailStat label="Payment method" value={buyerDemoOrderMeta.paymentMethod} />
                  </div>

                  {stage === "completed" ? (
                    <span className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-5 text-sm font-medium text-white">
                      <Check size={15} />
                      Delivered
                    </span>
                  ) : awaitingBuyerConfirmation ? (
                    <span className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-5 text-sm font-medium text-white">
                      Delivery in progress
                    </span>
                  ) : paid ? (
                    <span className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-5 text-sm font-medium text-white">
                      Processing
                    </span>
                  ) : (
                    <span
                      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium ${statusTone.badgeClassName}`}
                    >
                      {statusTone.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Unpaid orders get a single Make payment action. Paid orders are
                  always in the tracking flow below — no payment / "view status"
                  buttons; the milestone stepper is the navigation. */}
              {!paid ? (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  {isDraft ? (
                    <button
                      type="button"
                      onClick={() => {
                        dispatch(clearDraftSave());
                        setModal("editDraft");
                      }}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#FF6B00] bg-[#FFF7F0] px-6 text-sm font-medium text-[#FF6B00]"
                    >
                      Confirm order details
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      needsDeliveryAddress
                        ? (dispatch(clearDraftSave()), setModal("editDraft"))
                        : navigateStage("payment")
                    }
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-6 text-sm font-medium text-white"
                  >
                    <CreditCard size={16} />
                    Make payment
                  </button>
                </div>
              ) : null}
              {needsDeliveryAddress ? (
                <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#B45309]">
                  <Info size={14} />
                  Add a delivery address to continue to payment.
                </p>
              ) : null}
            </section>

            {stage !== "ongoing" ? (
              <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5 md:p-6">
                <h2 className="text-lg font-medium text-[#111827]">Delivery status</h2>
                <div className="hidden md:block">
                  <DeliveryStepper
                    activeCount={activeMilestoneCount}
                    milestones={milestones}
                  />
                </div>
                <div className="mt-5 md:hidden">
                  <DeliveryStepper
                    activeCount={activeMilestoneCount}
                    milestones={milestones}
                    compact
                  />
                </div>
                {hasActiveDispute ? <DisputeBanner /> : null}
              </section>
            ) : null}

            {notice ? <ActionNotice>{notice}</ActionNotice> : null}

            {stage === "ongoing" ? (
              <div className="grid gap-4 xl:grid-cols-3">
                <InfoCard title="Payment Information">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <DetailStat label="Payment Method" value={buyerDemoOrderMeta.paymentType} />
                    <DetailStat
                      label="Payment Status"
                      value={paymentStatusLabel}
                      valueClassName={paid ? "text-[#16A34A]" : "text-[#F59E0B]"}
                    />
                    <DetailStat label="Payment Reference" value={payReference} />
                    <DetailStat label="Documents" value="Invoice.pdf" />
                  </div>
                </InfoCard>
                <InfoCard title="Delivery Address">
                  <p className="text-sm font-medium text-[#111827]">
                    {buyerName}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#111827]">
                    {deliveryAddressText}
                  </p>
                  <p className="mt-3 text-sm text-[#6B7280]">
                    {buyerEmail}
                  </p>
                </InfoCard>
                <InfoCard title="Supplier Information">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <DetailStat label="Full name" value={supplierName} />
                    <DetailStat label="Role" value={supplierRole} />
                    <DetailStat label="Phone number" value={supplierPhone} />
                    <DetailStat label="Email address" value={supplierEmail} />
                  </div>
                </InfoCard>
              </div>
            ) : null}

            {stage === "delivery" || stage === "installation" ? (
              <section className="rounded-[10px] border border-[#F3F4F6] bg-[#F9FAFB] p-4 md:p-6">
                <div
                  className={`grid items-start gap-6 ${
                    deliveryUnderway
                      ? "xl:grid-cols-[337px_1fr_280px]"
                      : "xl:grid-cols-[337px_431px]"
                  }`}
                >
                  {/* Saved Delivery Address + actions (left column) */}
                  <div className="flex flex-col gap-4">
                    <div className="rounded-[10px] border border-[#F3F4F6] bg-[#F9FAFB] p-5">
                      <h3 className="text-xl font-medium text-[#111827]">
                        Saved Delivery Address
                      </h3>
                      <div className="mt-4 space-y-1 text-[#111827]">
                        <p className="text-lg font-medium leading-6">{buyerName}</p>
                        <p className="text-base font-medium leading-7">
                          {deliveryAddressText}
                        </p>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-base leading-6">
                          <span>{buyerEmail}</span>
                          {supplierPhone ? <span>{supplierPhone}</span> : null}
                        </div>
                      </div>
                      <p className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-[#0669D9]">
                        <Info size={18} />
                        Default address
                      </p>
                      <button className="mt-8 flex h-[50px] w-full items-center justify-center gap-2 rounded-[7px] bg-[#FE6E00] text-[15px] text-white">
                        <Phone size={20} />
                        Call Supplier{supplierPhone ? ` (${supplierPhone})` : ""}
                      </button>
                    </div>

                    {deliveryUnderway ? (
                      <button
                        type="button"
                        onClick={() => void handleConfirmReceipt()}
                        disabled={isConfirming}
                        className="h-12 w-full rounded-xl bg-primary text-sm font-medium text-white disabled:opacity-60"
                      >
                        {isConfirming
                          ? "Confirming…"
                          : demoOrder
                            ? "Confirm installation"
                            : "Confirm receipt"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setModal("dispute")}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#FE6E00] bg-[#FFF7F0] text-base font-normal text-[#FE6E00]"
                    >
                      Raise dispute
                      <ArrowRight size={20} />
                    </button>

                    {confirmError ? (
                      <p className="block rounded-lg border border-[#E33C13] bg-[#FFF5F3] px-4 py-3 text-sm text-[#E33C13]">
                        {confirmError}
                      </p>
                    ) : null}
                  </div>

                  {/* Product & Payment status */}
                  <div className="flex flex-col gap-10 rounded-[10px] border border-[#F3F4F6] bg-[#F9FAFB] p-5">
                    <div className="space-y-3">
                      <div className="rounded-[10px] bg-[#DDE0E5] p-2.5">
                        <p className="text-[15px] text-[#6B7280]">Product Status</p>
                        <p
                          className={`text-[15px] font-semibold ${
                            awaitingBuyerConfirmation
                              ? "text-[#1F9D8B]"
                              : "text-[#4B5563]"
                          }`}
                        >
                          {productStatusText}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-xl font-medium text-[#111827]">
                          Payment Status
                        </h3>
                        <div className="mt-4 rounded-xl bg-[#FFEEE0] p-5">
                          <p className="text-base font-medium text-[#111827]">
                            Time Remaining
                          </p>
                          <CountdownTimer target={escrowDeadline} />
                        </div>
                      </div>

                      {deliveryUnderway ? (
                        <div className="rounded-xl bg-[#DFF5F5] p-4">
                          <p className="text-xs text-[#6B7280]">Expected by:</p>
                          <p className="mt-1 text-sm text-[#111827]">
                            {expectedByText}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <p className="flex items-start gap-2 text-sm leading-5 text-[#0669D9]">
                      <Info size={18} className="mt-0.5 shrink-0" />
                      {demoOrder && stage === "installation"
                        ? "Please confirm installation is carried out within specified time to avoid buyer's dispute."
                        : deliveryUnderway
                          ? "Confirm you've received this order to release escrow to the supplier."
                          : "Order auto cancels if supplier doesn't confirm before timer ends"}
                    </p>
                  </div>

                  {deliveryUnderway ? (
                    <div className="rounded-[10px] border border-[#F3F4F6] bg-[#F9FAFB] p-5">
                      <h3 className="text-xl font-medium text-[#111827]">
                        Evidence upload
                      </h3>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {buyerDemoOrderMeta.evidenceImages.map((image) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={image}
                            src={image}
                            alt="Delivery evidence"
                            className="h-20 w-full rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {stage === "completed" ? (
              <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                <InfoCard title="Delivery summary">
                  <p className="text-sm font-medium text-[#111827]">
                    {buyerName}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#111827]">
                    {deliveryAddressText}
                  </p>
                  <p className="mt-5 inline-flex items-center gap-2 text-sm text-[#16A34A]">
                    <ShieldCheck size={16} />
                    ESCROW status: {buyerDemoOrderMeta.escrow.releasedStatus}
                  </p>
                </InfoCard>
                <OrderSummaryCard order={order} />
              </div>
            ) : null}
          </>
        )}
      </main>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-6 text-center shadow-xl">
            <button
              type="button"
              onClick={closeModal}
              className="ml-auto flex size-8 items-center justify-center rounded-full border border-[#DDE0E5]"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {modal === "editDraft" ? (
              <DraftEditForm
                initialQuantity={order.quantity}
                initialNotes={liveOrder?.notes ?? ""}
                initialDeliveryAddress={formatDeliveryAddress(
                  liveOrder?.deliveryAddress,
                )}
                saving={isSavingDraft}
                error={draftError}
                onSubmit={handleSaveDraft}
              />
            ) : modal === "dispute" ? (
              <DisputeForm
                order={order}
                supplierName={supplierName}
                amount={formatCurrency(order.totalPrice)}
                submitting={isSubmittingDispute}
                error={disputeError}
                onSubmit={handleSubmitDispute}
              />
            ) : modal === "disputeSuccess" ? (
              <SuccessState
                title="Congratulations"
                body="Dispute flagged successfully."
                onDone={() => {
                  setModal(null);
                  setNotice(
                    "Your dispute has been submitted and is now under review.",
                  );
                }}
              />
            ) : modal === "payment" ? (
              <ReceiptPreview
                order={order}
                recipientName={supplierName}
                senderName={buyerName}
                reference={payReference}
                methodLabel={selectedOption?.label ?? buyerDemoOrderMeta.paymentType}
                onTrack={() => {
                  resetPayment();
                  setModal(null);
                  navigateStage("delivery");
                }}
                onChat={() => {
                  resetPayment();
                  setModal(null);
                  router.push(
                    supplierId
                      ? `/dashboard/buyer/messages?compose=1&to=${supplierId}`
                      : "/dashboard/buyer/messages",
                  );
                }}
              />
            ) : (
              <SuccessState
                title="Congratulations"
                body={
                  demoOrder
                    ? modal === "delivery"
                      ? "Order delivery has been confirmed."
                      : "Order installation has been confirmed."
                    : "Receipt confirmed. Escrow has been released to the supplier."
                }
                onDone={() => {
                  setModal(null);
                  // Demo orders walk through the local stages; live orders are
                  // already refreshed to "completed" via the confirm thunk.
                  if (demoOrder) {
                    navigateStage(modal === "delivery" ? "installation" : "completed");
                  }
                }}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DraftEditForm({
  initialQuantity,
  initialNotes,
  initialDeliveryAddress,
  saving,
  error,
  onSubmit,
}: {
  initialQuantity: number;
  initialNotes: string;
  initialDeliveryAddress: string;
  saving: boolean;
  error: string;
  onSubmit: (payload: {
    quantity?: number;
    notes?: string;
    deliveryAddress?: string;
  }) => void;
}) {
  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const [notes, setNotes] = useState(initialNotes);
  const [deliveryAddress, setDeliveryAddress] = useState(initialDeliveryAddress);

  const trimmedAddress = deliveryAddress.trim();
  const canSubmit = trimmedAddress.length > 0 && quantity > 0 && !saving;

  return (
    <form
      className="pt-2 text-left"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          quantity,
          notes: notes.trim(),
          deliveryAddress: trimmedAddress,
        });
      }}
    >
      <h2 className="text-center text-lg font-medium text-[#111827]">
        Review your order
      </h2>
      <p className="mt-1 text-center text-sm text-[#6B7280]">
        Confirm the details and add a delivery address before paying.
      </p>

      <label className="mt-5 block">
        <span className="mb-1.5 block text-sm font-medium text-[#374151]">
          Delivery address
        </span>
        <textarea
          value={deliveryAddress}
          onChange={(event) => setDeliveryAddress(event.target.value)}
          placeholder="Street, city, state"
          className="h-20 w-full resize-none rounded-lg border border-[#DDE0E5] px-3 py-2 text-sm text-[#111827] outline-none placeholder:text-[#98A2B3] focus:border-primary"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-[#374151]">
          Quantity
        </span>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(event) =>
            setQuantity(Math.max(1, Number(event.target.value) || 1))
          }
          className="h-11 w-full rounded-lg border border-[#DDE0E5] px-3 text-sm text-[#111827] outline-none focus:border-primary"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-[#374151]">
          Note (optional)
        </span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={300}
          placeholder="Anything the supplier should know"
          className="h-20 w-full resize-none rounded-lg border border-[#DDE0E5] px-3 py-2 text-sm text-[#111827] outline-none placeholder:text-[#98A2B3] focus:border-primary"
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-lg border border-[#E33C13] bg-[#FFF5F3] px-4 py-3 text-sm text-[#E33C13]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-6 h-11 w-full rounded-xl bg-primary text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save order details"}
      </button>
    </form>
  );
}

function SuccessState({
  title,
  body,
  onDone,
}: {
  title: string;
  body: string;
  onDone: () => void;
}) {
  return (
    <div className="pt-2">
      <CheckCircle2 size={44} className="mx-auto text-[#16A34A]" />
      <h2 className="mt-4 text-lg font-medium text-[#111827]">{title}</h2>
      <p className="mt-2 text-sm text-[#6B7280]">{body}</p>
      <button
        type="button"
        onClick={onDone}
        className="mt-6 h-11 w-full rounded-xl bg-primary text-sm font-medium text-white"
      >
        Okay
      </button>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-sm text-[#4B5563]">{label}</span>
      <span className="flex flex-col items-end text-right">
        <span className="text-sm text-[#111827]">{value}</span>
        {sub ? <span className="text-xs text-[#4B5563]">{sub}</span> : null}
      </span>
    </div>
  );
}

function ReceiptPreview({
  order,
  recipientName,
  senderName,
  reference,
  methodLabel,
  onTrack,
  onChat,
}: {
  order: BuyerOrderRow;
  recipientName: string;
  senderName: string;
  reference: string;
  methodLabel: string;
  onTrack: () => void;
  onChat: () => void;
}) {
  const paidAt = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());

  return (
    <div className="text-left">
      <p className="text-right text-sm font-medium text-[#111827]">
        Transaction receipt
      </p>

      <div className="mt-4 flex flex-col items-center border-b border-[#DDE0E5] pb-5 text-center">
        <h2 className="text-3xl font-semibold text-[#111827]">
          {formatCurrency(order.totalPrice)}
        </h2>
        <p className="mt-1 text-lg font-medium text-[#13A83B]">Successful</p>
        <p className="text-sm text-[#111827]">{paidAt}</p>
      </div>

      <div className="mt-5 space-y-3">
        <ReceiptRow label="Recipient details" value={recipientName} sub="Seller" />
        <ReceiptRow label="Sender details" value={senderName} sub={methodLabel} />
        <ReceiptRow label="Transaction type" value="Order payment" />
        <ReceiptRow label="Payment reference" value={reference} />
      </div>

      <div className="mt-5 border-y border-[#DDE0E5] bg-[#F3F4F6] px-5 py-4">
        <p className="text-sm text-[#4B5563]">Description</p>
        <p className="mt-1 text-sm leading-6 text-[#0C0F16]">
          Payment for {order.productName} (Order {order.id}) held in escrow until
          delivery is confirmed.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3.5">
        <button
          type="button"
          onClick={onTrack}
          className="h-12 rounded-xl bg-primary text-sm font-medium text-white"
        >
          Track delivery
        </button>
        <button
          type="button"
          onClick={onChat}
          className="h-12 rounded-xl border border-[#FE6E00] bg-[#FFF7F0] text-sm font-medium text-[#FE6E00]"
        >
          Open chat
        </button>
      </div>
    </div>
  );
}

const DISPUTE_REASONS = [
  "Item not delivered",
  "Wrong item delivered",
  "Damaged item",
  "Installation issue",
  "Other",
];

function DisputeForm({
  order,
  supplierName,
  amount,
  submitting,
  error,
  onSubmit,
}: {
  order: BuyerOrderRow;
  supplierName: string;
  amount: string;
  submitting: boolean;
  error: string;
  onSubmit: (reason: string, description: string, file?: File) => void;
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const canSubmit = reason.trim().length > 0 && !submitting;

  return (
    <form
      className="mt-2 text-left"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onSubmit(reason, description, file ?? undefined);
      }}
    >
      <h2 className="text-lg font-semibold text-[#111827]">Raise dispute</h2>
      <p className="mt-1 text-sm text-[#6B7280]">
        Provide the information below to flag a dispute.
      </p>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="text-sm text-[#111827]">Name of item</span>
          <input
            value={order.productName}
            readOnly
            className="mt-1.5 h-11 w-full rounded-xl border border-[#DDE0E5] bg-[#F9FAFB] px-3 text-sm text-[#6B7280]"
          />
        </label>
        <label className="block">
          <span className="text-sm text-[#111827]">Amount</span>
          <input
            value={amount}
            readOnly
            className="mt-1.5 h-11 w-full rounded-xl border border-[#DDE0E5] bg-[#F9FAFB] px-3 text-sm text-[#6B7280]"
          />
        </label>
        <label className="block">
          <span className="text-sm text-[#111827]">
            Against (Add name/role of individual involved in dispute)
          </span>
          <input
            value={supplierName}
            readOnly
            className="mt-1.5 h-11 w-full rounded-xl border border-[#DDE0E5] bg-[#F9FAFB] px-3 text-sm text-[#6B7280]"
          />
        </label>
        <label className="block">
          <span className="text-sm text-[#111827]">Reason for dispute</span>
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-[#DDE0E5] px-3 text-sm text-[#111827]"
          >
            <option value="">Select dispute reason</option>
            {DISPUTE_REASONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-[#111827]">Add description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Enter text here"
            className="mt-1.5 min-h-[88px] w-full rounded-xl border border-[#DDE0E5] px-3 py-3 text-sm text-[#111827] outline-none"
          />
        </label>
        <div>
          <span className="text-sm text-[#111827]">Upload file (optional)</span>
          <label className="mt-1.5 flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#DDE0E5] text-xs text-[#6B7280]">
            <Upload size={18} className="text-[#FF6B00]" />
            <span>
              <span className="text-[#FF6B00]">Click here</span> to upload file
            </span>
            <span className="text-[10px] text-[#9CA3AF]">
              {file ? file.name : "Allowed format - DOCX, PNG, PDF"}
            </span>
            <input
              type="file"
              accept=".docx,.png,.pdf,.jpg,.jpeg"
              className="sr-only"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-[#E33C13] bg-[#FFF5F3] px-4 py-3 text-sm text-[#E33C13]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-5 h-12 w-full rounded-xl bg-[#0669D9] text-sm font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
