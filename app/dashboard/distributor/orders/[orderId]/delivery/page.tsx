"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Info,
  Upload,
  X,
} from "lucide-react";

import Header from "../../../../component/header";
import { Skeleton } from "@/components/base";
import DeliveryStepper from "@/components/orders/DeliveryStepper";
import {
  distributorDemoOrders,
  distributorDemoOrderMeta,
  getOrderStatusTone,
} from "@/constants/demoDistributorOrders";
import {
  useFulfillOrderMutation,
  useOrderQuery,
} from "@/hooks/queries/orders";
import type { FulfillmentStage, Order } from "@/types/order";
import {
  formatDeliveryAddress,
  getActiveMilestoneCount,
  getNextFulfillmentStage,
  getOrderMilestones,
  isAwaitingBuyerConfirmation,
} from "@/types/order";
import type { UserRef } from "@/types/rfq";

type ModalKind = "action" | "success" | null;

/** Per-stage copy for the distributor fulfillment action. `delivered` copy
 * varies on whether the product still needs an installation step afterwards. */
const buildStageCopy = (
  stage: FulfillmentStage,
  requiresInstallation: boolean,
) => {
  switch (stage) {
    case "received":
      return {
        panelHelper:
          "Confirm you've received this order to begin the delivery process.",
        panelButton: "Mark as Received",
        modalTitle: "Mark order as received",
        modalBody:
          "Confirm you've received this order and are preparing it for delivery. The buyer will be notified.",
        confirmLabel: "Mark as Received",
        showUpload: false,
        successBody:
          "Order marked as received. You can now prepare it for delivery.",
      };
    case "delivered":
      return {
        panelHelper: requiresInstallation
          ? "Mark the order as delivered to the buyer. You'll confirm installation next."
          : "Mark the order as delivered to the buyer to complete fulfillment.",
        panelButton: "Mark as Delivered",
        modalTitle: "Mark order as delivered",
        modalBody:
          "Upload images of the packed product and confirm it has been delivered to the buyer.",
        confirmLabel: "Mark as Delivered",
        showUpload: true,
        successBody: requiresInstallation
          ? "Order marked as delivered. Confirm installation once it's complete."
          : "Order marked as delivered. The buyer has been notified to confirm receipt.",
      };
    case "installed":
    default:
      return {
        panelHelper:
          "Confirm installation is complete to finish fulfillment.",
        panelButton: "Confirm Installation",
        modalTitle: "Confirm installation",
        modalBody:
          "Confirm the product has been installed at the buyer's location. The buyer will be notified to confirm and release escrow.",
        confirmLabel: "Confirm Installation",
        showUpload: false,
        successBody:
          "Installation confirmed. Awaiting buyer confirmation to release escrow.",
      };
  }
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "--";
  return new Intl.DateTimeFormat("en-GB").format(parsed);
};

const getOrderDisplayId = (order: Order) =>
  order._id ? `ORD-${order._id.slice(-6).toUpperCase()}` : "Order ID";

const getPersonName = (person: string | UserRef | undefined, fallback: string) => {
  if (person && typeof person === "object") {
    const name = [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
    return name || person.email || fallback;
  }
  return fallback;
};

function OrderStat({
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

/** Live escrow countdown (HOUR : MINUTES : SECONDS). */
function CountdownTimer({ target }: { target?: Date }) {
  const [now, setNow] = useState(() => Date.now());
  const [fallbackDeadline] = useState(() => Date.now() + 24 * 60 * 60 * 1000);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const deadline = target ? target.getTime() : fallbackDeadline;
  const totalSeconds = Math.max(0, Math.floor((deadline - now) / 1000));
  const segments = [
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
            <span className="text-2xl font-semibold text-[#FE6E00]">
              {pad(segment.value)}
            </span>
            <span className="mt-1 block text-[10px] uppercase tracking-wide text-[#9CA3AF]">
              {segment.label}
            </span>
          </div>
          {index < segments.length - 1 ? (
            <span className="pb-4 text-xl font-semibold text-[#FE6E00]">:</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function DistributorDeliveryStatusPage() {
  const params = useParams();
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<ModalKind>(null);
  const [evidence, setEvidence] = useState<File[]>([]);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const orderId = params.orderId as string;
  const demoOrder = distributorDemoOrders.find((item) => item.id === orderId);

  const { data: currentOrder, isLoading } = useOrderQuery(orderId, {
    enabled: !demoOrder,
  });
  const fulfillMutation = useFulfillOrderMutation();
  const isFulfilling = fulfillMutation.isPending;

  const order = currentOrder ?? null;

  if (isLoading || (!order && !demoOrder)) {
    return (
      <div>
        <Header
          title="Orders & Disputes"
          description="View all quote request from customers"
        />
        <main className="space-y-4 p-4 md:p-6">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
        </main>
      </div>
    );
  }

  const status = demoOrder?.status || order?.status;
  const statusTone = getOrderStatusTone(status);
  const displayId = demoOrder?.id || (order ? getOrderDisplayId(order) : orderId);
  const quantity =
    demoOrder?.quantity || order?.quantity || order?.items?.[0]?.quantity || 1;
  const productName =
    demoOrder?.productName ||
    order?.productName ||
    order?.items?.[0]?.productName ||
    "Product name";
  const totalPrice = demoOrder?.totalPrice || order?.totalPrice || 0;
  const unitPrice = demoOrder?.unitPrice || totalPrice / quantity;
  const createdAt = demoOrder?.createdAt || order?.createdAt || new Date().toISOString();

  // Live orders drive the flow off the real backend status; demo orders fall
  // back to the "awaiting delivery" view so the walkthrough still works.
  const liveStatus = demoOrder ? "processing" : status;
  const hasActiveDispute = Boolean(order?.activeDisputeId);

  const buyerName =
    demoOrder?.buyerName ||
    getPersonName(order?.buyer, distributorDemoOrderMeta.buyer.name);
  const buyerEmail =
    order?.buyer && typeof order.buyer === "object"
      ? order.buyer.email || distributorDemoOrderMeta.buyer.email
      : distributorDemoOrderMeta.buyer.email;
  const buyerPhone =
    order?.buyer && typeof order.buyer === "object"
      ? order.buyer.phoneNumber || distributorDemoOrderMeta.buyer.phone
      : distributorDemoOrderMeta.buyer.phone;
  const deliveryAddressText =
    formatDeliveryAddress(order?.deliveryAddress) ||
    distributorDemoOrderMeta.deliveryAddress;

  // Whether this product needs an installation step after delivery (snapshot
  // from the product at order time). Demo orders include it for the walkthrough.
  const requiresInstallation = demoOrder
    ? true
    : Boolean(order?.requiresInstallation);

  // The next logistics stage the distributor should advance to. Demo orders
  // always start at "received" so the walkthrough still works.
  const nextStage: FulfillmentStage | null = order
    ? getNextFulfillmentStage(order)
    : demoOrder
      ? "received"
      : null;
  const stageCopy = nextStage
    ? buildStageCopy(nextStage, requiresInstallation)
    : null;

  // Product status reflects how far the distributor has advanced the order. Once
  // every stage is done (`nextStage === null`) the order waits on the buyer.
  const isFulfilled = liveStatus === "completed" || (!demoOrder && !nextStage);
  const productStatusText =
    liveStatus === "completed"
      ? "Order completed"
      : !demoOrder && !nextStage
        ? "Awaiting buyer confirmation"
        : nextStage === "delivered"
          ? "Received — ready to deliver"
          : nextStage === "installed"
            ? "Delivered — ready to install"
            : "Awaiting your delivery";

  // Installation-dependent progress milestones (shared with the buyer view, so
  // both steppers read identically). While the buyer hasn't confirmed receipt,
  // the final logistics step shows as "Delivery in progress" and stays pending —
  // it's the buyer who confirms delivery.
  const awaitingBuyerConfirmation =
    !demoOrder && !!order && isAwaitingBuyerConfirmation(order);
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
    ? 2 // Create + Payment — awaiting delivery in the walkthrough.
    : awaitingBuyerConfirmation
      ? inProgressIndex // steps before the in-progress one are complete; it stays pending.
      : order
        ? getActiveMilestoneCount(order, requiresInstallation)
        : 1;

  // POST /orders/:id/fulfillment — advance the order one logistics stage. The
  // evidence images are display-only; the backend doesn't accept them yet.
  const handleAdvanceStage = async () => {
    setActionError("");
    if (demoOrder) {
      setSuccessMessage(
        stageCopy?.successBody ?? "Delivery updated (demo).",
      );
      setModal("success");
      return;
    }
    if (isFulfilling) return;
    if (!nextStage || !stageCopy) {
      setActionError("This order has already reached its final delivery stage.");
      return;
    }
    try {
      // The mutation invalidates the order cache on success, so the stepper
      // advances and the next stage's action becomes available immediately.
      await fulfillMutation.mutateAsync({ orderId, stage: nextStage });
      setSuccessMessage(stageCopy.successBody);
      setModal("success");
      setEvidence([]);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Could not update delivery status. Please try again.",
      );
    }
  };

  const closeModal = () => {
    setModal(null);
    setActionError("");
  };

  return (
    <div>
      <Header
        title="Orders & Disputes"
        description="View all quote request from customers"
      />

      <main className="space-y-5 bg-[#F9FAFB] p-4 md:p-6">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/distributor/orders/${orderId}`)}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#111827]"
        >
          <ArrowLeft size={17} />
          Go Back
        </button>

        <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <OrderStat label="Order ID" value={displayId} />
              <OrderStat label="Name of product" value={productName} />
              <OrderStat label="Quantity" value={String(quantity)} />
              <OrderStat label="Unit price" value={formatCurrency(unitPrice)} />
              <OrderStat label="Total price" value={formatCurrency(totalPrice)} />
              <OrderStat label="Date created" value={formatDate(createdAt)} />
              <OrderStat
                label="Payment status"
                value="Paid"
                valueClassName="text-[#16A34A]"
              />
              <OrderStat
                label="Payment method"
                value={distributorDemoOrderMeta.paymentMethod}
              />
            </div>
            <span
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium ${statusTone.className}`}
            >
              <Check size={14} />
              {statusTone.label}
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-[#DDE0E5] bg-white p-6">
          <h2 className="text-lg font-medium text-[#111827]">Order status</h2>
          <div className="hidden md:block">
            <DeliveryStepper
              activeCount={activeMilestoneCount}
              milestones={milestones}
            />
          </div>
          <div className="mt-6 md:hidden">
            <DeliveryStepper
              activeCount={activeMilestoneCount}
              milestones={milestones}
              compact
            />
          </div>
          {hasActiveDispute ? (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-[#FACC15] bg-[#FFFBEB] px-4 py-3">
              <Info size={16} className="mt-0.5 shrink-0 text-[#B45309]" />
              <p className="text-sm text-[#B45309]">
                This order is under active dispute. Tracking is paused until the
                dispute is resolved.
              </p>
            </div>
          ) : null}
        </section>

        {notice ? (
          <p className="rounded-xl border border-[#DDEBFF] bg-[#F4F9FF] px-4 py-3 text-sm text-primary">
            {notice}
          </p>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="min-h-[420px] rounded-2xl border border-[#DDE0E5] bg-white p-6 md:p-8">
            <h2 className="text-lg font-medium text-[#111827]">
              Update tracking details
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[#6B7280]">
              When delivery status is updated, the buyer gets notified and the
              tracking status is updated.
            </p>

            {hasActiveDispute ? (
              <div className="mt-8 rounded-xl bg-[#FFFBEB] p-5">
                <p className="flex items-center gap-2 text-sm font-medium text-[#B45309]">
                  <Info size={18} />
                  Delivery updates are paused while this order is under dispute.
                </p>
              </div>
            ) : stageCopy ? (
              <>
                <p className="mt-8 text-sm text-[#111827]">
                  {stageCopy.panelHelper}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActionError("");
                    setModal("action");
                  }}
                  className="mt-5 h-14 w-full max-w-[300px] rounded-xl bg-primary text-sm font-medium text-white transition hover:bg-primary-dark"
                >
                  {stageCopy.panelButton}
                </button>
              </>
            ) : (
              <div className="mt-8 rounded-xl bg-[#D9FBE7] p-5">
                <p className="flex items-center gap-2 text-sm font-medium text-[#16A34A]">
                  <CheckCircle2 size={18} />
                  {liveStatus === "completed"
                    ? "Order completed. Escrow has been released to your balance."
                    : "All delivery steps complete. Awaiting buyer confirmation to release escrow."}
                </p>
              </div>
            )}

            {fulfillMutation.error ? (
              <p className="mt-4 rounded-lg border border-[#E33C13] bg-[#FFF5F3] px-4 py-3 text-sm text-[#E33C13]">
                {fulfillMutation.error instanceof Error
                  ? fulfillMutation.error.message
                  : "Could not update delivery status. Please try again."}
              </p>
            ) : null}
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#DDE0E5] bg-white p-6">
              <div className="rounded-[10px] bg-[#DDE0E5] p-2.5">
                <p className="text-[15px] text-[#6B7280]">Product Status</p>
                <p
                  className={`text-[15px] font-semibold ${
                    isFulfilled ? "text-[#16A34A]" : "text-[#4B5563]"
                  }`}
                >
                  {productStatusText}
                </p>
              </div>

              <h2 className="mt-6 text-xl font-medium text-[#111827]">
                Payment Status
              </h2>
              <div className="mt-4 rounded-xl bg-[#FFEEE0] p-5">
                <p className="text-base font-medium text-[#111827]">
                  Time Remaining
                </p>
                <CountdownTimer />
              </div>

              <p className="mt-6 flex items-start gap-2 text-sm leading-5 text-[#0669D9]">
                <Info size={18} className="mt-0.5 shrink-0" />
                {distributorDemoOrderMeta.escrow.note}
              </p>
            </section>

            <section className="rounded-2xl border border-[#DDE0E5] bg-white p-6">
              <h2 className="text-lg font-medium text-[#111827]">Delivery Address</h2>
              <p className="mt-5 text-base font-medium text-[#111827]">{buyerName}</p>
              <p className="mt-2 text-sm leading-6 text-[#111827]">
                {deliveryAddressText}
              </p>
              <p className="mt-2 text-sm text-[#6B7280]">
                {buyerEmail}
                {buyerPhone ? `   ${buyerPhone}` : ""}
              </p>
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-[#0669D9]">
                <Info size={16} />
                Default address
              </p>
            </section>
          </aside>
        </div>
      </main>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={closeModal}
              className="ml-auto flex size-8 items-center justify-center rounded-full border border-[#DDE0E5]"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {modal === "action" && stageCopy ? (
              <div className="mt-1">
                <h2 className="text-lg font-semibold text-[#111827]">
                  {stageCopy.modalTitle}
                </h2>
                <p className="mt-2 text-sm text-[#6B7280]">
                  When delivery status is updated, the buyer gets notified and the
                  tracking status is updated.
                </p>

                <p className="mt-6 text-sm text-[#111827]">
                  {stageCopy.modalBody}
                </p>

                {stageCopy.showUpload ? (
                  <>
                    <label className="mt-3 flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#DDE0E5] text-xs text-[#6B7280]">
                      <Upload size={20} className="text-[#FF6B00]" />
                      <span>
                        <span className="text-[#FF6B00]">Click here</span> to upload file
                      </span>
                      <span className="text-[10px] text-[#9CA3AF]">
                        Allowed format - DOCX, PNG, PDF
                      </span>
                      <input
                        type="file"
                        multiple
                        accept=".docx,.png,.pdf,.jpg,.jpeg"
                        className="sr-only"
                        onChange={(event) =>
                          setEvidence(Array.from(event.target.files ?? []))
                        }
                      />
                    </label>
                    {evidence.length ? (
                      <p className="mt-2 text-xs text-[#16A34A]">
                        {evidence.length} file{evidence.length > 1 ? "s" : ""} selected
                      </p>
                    ) : null}
                  </>
                ) : null}

                {actionError ? (
                  <p className="mt-4 rounded-lg border border-[#E33C13] bg-[#FFF5F3] px-4 py-3 text-sm text-[#E33C13]">
                    {actionError}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleAdvanceStage()}
                  disabled={isFulfilling}
                  className="mt-5 h-12 w-full rounded-xl bg-primary text-sm font-medium text-white disabled:opacity-60"
                >
                  {isFulfilling ? "Updating…" : stageCopy.confirmLabel}
                </button>
              </div>
            ) : (
              <div className="pt-2 text-center">
                <CheckCircle2 size={44} className="mx-auto text-[#16A34A]" />
                <h2 className="mt-4 text-lg font-medium text-[#111827]">
                  Delivery status updated
                </h2>
                <p className="mt-2 text-sm text-[#6B7280]">
                  {successMessage ||
                    "The delivery status has been updated and the buyer notified."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    setEvidence([]);
                    if (demoOrder) {
                      setNotice(
                        "Delivery updated (demo). No backend status was changed for this sample order.",
                      );
                    }
                  }}
                  className="mt-6 h-11 w-full rounded-xl bg-primary text-sm font-medium text-white"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
