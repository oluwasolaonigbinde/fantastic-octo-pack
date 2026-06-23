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
import {
  distributorDemoMilestones,
  distributorDemoOrders,
  distributorDemoOrderMeta,
  getOrderStatusTone,
} from "@/constants/demoDistributorOrders";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchOrderDetail, fulfillOrder } from "@/store/slices/order-slice";
import type { Order } from "@/types/order";
import type { UserRef } from "@/types/rfq";

type ModalKind = "receive" | "deliver" | "success" | null;

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

/** How many of the 5 milestones are complete for a backend status. */
const milestoneFromStatus = (status: string | undefined): number => {
  switch (status) {
    case "paid":
    case "processing":
      return 2; // Create order + Payment — awaiting distributor delivery
    case "fulfilled":
      return 4; // + Delivery + Installation — awaiting buyer confirmation
    case "completed":
      return 5;
    default:
      return 1;
  }
};

const productStatusFromStatus = (status: string | undefined): string => {
  switch (status) {
    case "fulfilled":
      return "Delivery completed";
    case "completed":
      return "Order completed";
    case "paid":
    case "processing":
    default:
      return "Awaiting your delivery";
  }
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
  const dispatch = useAppDispatch();
  const { currentOrder, isLoading, isFulfilling, fulfillError } = useAppSelector(
    (state) => state.order,
  );
  const { data: authData } = useAppSelector((state) => state.auth);
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<ModalKind>(null);
  const [evidence, setEvidence] = useState<File[]>([]);
  const [actionError, setActionError] = useState("");
  // Installation is a UI-only step for now — the backend has no installation
  // state, so confirming it just advances the distributor's local view.
  const [installationConfirmed, setInstallationConfirmed] = useState(false);

  const orderId = params.orderId as string;
  const demoOrder = distributorDemoOrders.find((item) => item.id === orderId);

  useEffect(() => {
    if (authData?.tokens?.accessToken && orderId && !demoOrder) {
      dispatch(fetchOrderDetail({ token: authData.tokens.accessToken, orderId }));
    }
  }, [authData?.tokens?.accessToken, demoOrder, dispatch, orderId]);

  const order = currentOrder;

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
  const activeMilestoneCount = milestoneFromStatus(liveStatus);
  const isFulfilled = liveStatus === "fulfilled" || liveStatus === "completed";
  const productStatusText = productStatusFromStatus(liveStatus);
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
    order?.deliveryAddress?.trim() || distributorDemoOrderMeta.deliveryAddress;

  // The actual "send it out" action: POST /orders/:id/fulfill. Evidence images
  // are display-only — the backend doesn't accept them yet.
  const handleStartDelivery = async () => {
    setActionError("");
    if (demoOrder) {
      setModal("success");
      return;
    }
    if (isFulfilling) return;
    const token = authData?.tokens?.accessToken;
    if (!token) {
      setActionError("Your session has expired. Please sign in again to continue.");
      return;
    }
    const result = await dispatch(fulfillOrder({ token, orderId }));
    if (fulfillOrder.fulfilled.match(result)) {
      setModal("success");
    } else {
      setActionError(
        (result.payload as string) ||
          "Could not start delivery. Please try again.",
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
          <h2 className="text-lg font-medium text-[#111827]">Delivery status</h2>
          <div className="mt-10 grid grid-cols-5 gap-0">
            {distributorDemoMilestones.map((milestone, index) => {
              const isActive = index < activeMilestoneCount;
              return (
                <div key={milestone} className="relative flex flex-col items-center gap-4">
                  {index < distributorDemoMilestones.length - 1 ? (
                    <span
                      className={`absolute left-1/2 top-[10px] h-px w-full ${
                        index < activeMilestoneCount - 1 ? "bg-[#16A34A]" : "bg-[#DDE0E5]"
                      }`}
                    />
                  ) : null}
                  <span
                    className={`relative z-[1] flex size-5 items-center justify-center rounded-sm ${
                      isActive ? "bg-[#16A34A] text-white" : "bg-[#DDE0E5] text-white"
                    }`}
                  >
                    <Check size={13} />
                  </span>
                  <span
                    className={`text-center text-sm ${
                      isActive ? "text-[#16A34A]" : "text-[#4B5563]"
                    }`}
                  >
                    {milestone}
                  </span>
                </div>
              );
            })}
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

            {!isFulfilled ? (
              <>
                <p className="mt-8 text-sm text-[#111827]">
                  Receive the order to continue updating its delivery status.
                </p>
                <button
                  type="button"
                  onClick={() => setModal("receive")}
                  className="mt-5 h-14 w-full max-w-[300px] rounded-xl bg-primary text-sm font-medium text-white transition hover:bg-primary-dark"
                >
                  Receive Order
                </button>
              </>
            ) : liveStatus !== "completed" && !installationConfirmed ? (
              <>
                <p className="mt-8 text-sm text-[#111827]">
                  Confirm installation to continue updating delivery status.
                </p>
                <button
                  type="button"
                  onClick={() => setInstallationConfirmed(true)}
                  className="mt-5 h-14 w-full max-w-[300px] rounded-xl bg-primary text-sm font-medium text-white transition hover:bg-primary-dark"
                >
                  Confirm installation
                </button>
              </>
            ) : (
              <div className="mt-8 rounded-xl bg-[#D9FBE7] p-5">
                <p className="flex items-center gap-2 text-sm font-medium text-[#16A34A]">
                  <CheckCircle2 size={18} />
                  {liveStatus === "completed"
                    ? "Order completed. Escrow has been released to your balance."
                    : "Installation confirmed. Awaiting buyer confirmation to release escrow."}
                </p>
              </div>
            )}

            {fulfillError ? (
              <p className="mt-4 rounded-lg border border-[#E33C13] bg-[#FFF5F3] px-4 py-3 text-sm text-[#E33C13]">
                {fulfillError}
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

            {modal === "receive" ? (
              <div className="mt-1">
                <h2 className="text-lg font-semibold text-[#111827]">
                  Update tracking details
                </h2>
                <p className="mt-2 text-sm text-[#6B7280]">
                  When delivery status is updated, the buyer gets notified and the
                  tracking status is updated.
                </p>
                <p className="mt-6 text-sm text-[#111827]">
                  Receive order to continue updating delivery status.
                </p>
                <button
                  type="button"
                  onClick={() => setModal("deliver")}
                  className="mt-5 h-12 w-full rounded-xl bg-primary text-sm font-medium text-white"
                >
                  Receive Order
                </button>
              </div>
            ) : modal === "deliver" ? (
              <div className="mt-1">
                <h2 className="text-lg font-semibold text-[#111827]">
                  Update tracking details
                </h2>
                <p className="mt-2 text-sm text-[#6B7280]">
                  When delivery status is updated, the buyer gets notified and the
                  tracking status is updated.
                </p>

                <p className="mt-6 text-sm text-[#111827]">
                  Upload images of packed product ready for delivery
                </p>
                <label className="mt-2 flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#DDE0E5] text-xs text-[#6B7280]">
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

                {actionError ? (
                  <p className="mt-4 rounded-lg border border-[#E33C13] bg-[#FFF5F3] px-4 py-3 text-sm text-[#E33C13]">
                    {actionError}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleStartDelivery()}
                  disabled={isFulfilling}
                  className="mt-5 h-12 w-full rounded-xl bg-primary text-sm font-medium text-white disabled:opacity-60"
                >
                  {isFulfilling ? "Starting delivery…" : "Start Delivery"}
                </button>
              </div>
            ) : (
              <div className="pt-2 text-center">
                <CheckCircle2 size={44} className="mx-auto text-[#16A34A]" />
                <h2 className="mt-4 text-lg font-medium text-[#111827]">
                  Congratulations
                </h2>
                <p className="mt-2 text-sm text-[#6B7280]">
                  Order has been sent out for delivery. The buyer has been notified.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    setEvidence([]);
                    if (demoOrder) {
                      setNotice(
                        "Delivery started (demo). No backend status was changed for this sample order.",
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
