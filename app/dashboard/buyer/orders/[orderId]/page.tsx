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
  ReceiptText,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

import Header from "../../../component/header";
import { Skeleton } from "@/components/base";
import {
  buyerDemoOrderMeta,
  buyerDemoOrders,
  buyerMobileMilestones,
  buyerOrderMilestones,
  getBuyerOrderStatusTone,
  getOrderDisplayId,
  getOrderProductImage,
  getPersonName,
  toBuyerOrderRow,
  type BuyerOrderRow,
  type BuyerOrderStage,
} from "@/constants/demoBuyerOrders";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchOrderDetail } from "@/store/slices/order-slice";
import type { Order } from "@/types/order";

type ModalKind = "payment" | "delivery" | "installation" | "dispute" | null;

const paymentMethods = [
  "BAIY trade assurance",
  "Paystack",
  "Flutterwave",
  "Google Pay",
  "Apple Pay",
  "Bank wallet",
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

const milestoneCountByStage: Record<BuyerOrderStage, number> = {
  ongoing: 1,
  payment: 2,
  delivery: 3,
  installation: 4,
  completed: 5,
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
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="relative h-20 w-36 rounded-full bg-gradient-to-br from-[#DCE7EF] via-white to-[#B8C8D6] shadow-inner">
          <div className="absolute left-5 top-5 h-7 w-24 rounded-full bg-white/80 shadow" />
        </div>
      )}
    </div>
  );
}

function DeliveryStepper({
  activeCount,
  compact = false,
}: {
  activeCount: number;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="space-y-3">
        {buyerMobileMilestones.map((milestone, index) => {
          const active = index < Math.min(activeCount + 3, buyerMobileMilestones.length);
          return (
            <div key={milestone} className="flex items-center gap-3">
              <span
                className={`flex size-4 items-center justify-center rounded-sm ${
                  active ? "bg-[#16A34A] text-white" : "bg-[#DDE0E5] text-white"
                }`}
              >
                <Check size={11} />
              </span>
              <span className={`text-xs ${active ? "text-[#16A34A]" : "text-[#4B5563]"}`}>
                {milestone}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-10 grid grid-cols-5 gap-0">
      {buyerOrderMilestones.map((milestone, index) => {
        const active = index < activeCount;
        return (
          <div key={milestone} className="relative flex flex-col items-center gap-4">
            {index < buyerOrderMilestones.length - 1 ? (
              <span
                className={`absolute left-1/2 top-[10px] h-px w-full ${
                  index < activeCount - 1 ? "bg-[#16A34A]" : "bg-[#DDE0E5]"
                }`}
              />
            ) : null}
            <span
              className={`relative z-[1] flex size-5 items-center justify-center rounded-sm ${
                active ? "bg-[#16A34A] text-white" : "bg-[#DDE0E5] text-white"
              }`}
            >
              <Check size={13} />
            </span>
            <span className={`text-center text-sm ${active ? "text-[#16A34A]" : "text-[#4B5563]"}`}>
              {milestone}
            </span>
          </div>
        );
      })}
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

function ActionNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-[#DDEBFF] bg-[#F4F9FF] px-4 py-3 text-sm text-primary">
      {children}
    </p>
  );
}

export default function BuyerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { currentOrder, isLoading, isError, message } = useAppSelector((state) => state.order);
  const { data: authData } = useAppSelector((state) => state.auth);
  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0]);
  const [modal, setModal] = useState<ModalKind>(null);
  const [notice, setNotice] = useState("");

  const orderId = params.orderId as string;
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

  const stage = stageFromQuery(searchParams.get("view"), order?.status);
  const activeMilestoneCount = milestoneCountByStage[stage];
  const statusTone = getBuyerOrderStatusTone(stage === "completed" ? "completed" : order?.status);
  const productImage = order?.productImage || getOrderProductImage(liveOrder);
  const supplierName =
    order?.supplierName || getPersonName(liveOrder?.seller, buyerDemoOrderMeta.supplier.name);
  const buyerName = getPersonName(liveOrder?.buyer, buyerDemoOrderMeta.deliveryAddress.name);
  const buyerEmail =
    liveOrder?.buyer && typeof liveOrder.buyer === "object"
      ? liveOrder.buyer.email
      : buyerDemoOrderMeta.deliveryAddress.email;
  const deliveryAddressText =
    liveOrder?.deliveryAddress?.trim() || buyerDemoOrderMeta.deliveryAddress.address;

  const navigateStage = (nextStage: BuyerOrderStage) => {
    router.push(`/dashboard/buyer/orders/${orderId}?view=${nextStage}`);
  };

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

  const paymentStatus =
    stage === "ongoing" && order.status !== "completed" ? "Not Paid" : buyerDemoOrderMeta.paymentStatus;

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

        <div className="flex flex-wrap gap-2 md:hidden">
          {(["ongoing", "payment", "delivery", "installation", "completed"] as BuyerOrderStage[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => navigateStage(item)}
                className={`h-9 rounded-full px-3 text-xs capitalize ${
                  stage === item ? "bg-primary text-white" : "border border-[#DDE0E5] bg-white text-[#4B5563]"
                }`}
              >
                {item}
              </button>
            ),
          )}
        </div>

        {stage === "payment" ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
              <h1 className="text-lg font-medium text-[#111827]">Payment</h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                Select a payment option to continue. This is a frontend preview until
                the payment provider is decided.
              </p>

              <div className="mt-6 rounded-2xl border border-[#DDE0E5]">
                {paymentMethods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedPayment(method)}
                    className="flex w-full items-center justify-between border-b border-[#EEF2F7] px-5 py-4 text-left last:border-b-0"
                  >
                    <span className="flex items-center gap-3 text-sm text-[#111827]">
                      <span
                        className={`flex size-4 items-center justify-center rounded-full border ${
                          selectedPayment === method ? "border-primary" : "border-[#DDE0E5]"
                        }`}
                      >
                        {selectedPayment === method ? (
                          <span className="size-2 rounded-full bg-primary" />
                        ) : null}
                      </span>
                      {method}
                    </span>
                    <CreditCard size={18} className="text-[#6B7280]" />
                  </button>
                ))}
              </div>

              <p className="mt-5 text-xs leading-5 text-[#6B7280]">
                Secure payments with BAIY trade assurance are mocked in this pass. No
                real payment request will be sent.
              </p>

              <button
                type="button"
                onClick={() => setModal("payment")}
                className="mt-6 h-12 w-full rounded-xl bg-primary text-sm font-medium text-white md:max-w-[260px]"
              >
                Submit payment
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
                      value={paymentStatus}
                      valueClassName={paymentStatus === "Paid" ? "text-[#16A34A]" : "text-[#F59E0B]"}
                    />
                    <DetailStat label="Payment method" value={buyerDemoOrderMeta.paymentMethod} />
                  </div>

                  <span
                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium ${statusTone.badgeClassName}`}
                  >
                    {stage === "completed" ? <Check size={15} /> : null}
                    {stage === "completed" ? "Delivered" : statusTone.label}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {stage === "ongoing" ? (
                  <button
                    type="button"
                    onClick={() => navigateStage("payment")}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] px-6 text-sm font-medium text-white"
                  >
                    <CreditCard size={16} />
                    Make payment
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigateStage(stage === "installation" ? "installation" : "delivery")}
                  className="inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-primary bg-[#F5FAFF] px-6 text-sm font-medium text-primary"
                >
                  View delivery status
                  <ArrowRight size={17} />
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5 md:p-6">
              <h2 className="text-lg font-medium text-[#111827]">Delivery status</h2>
              <div className="hidden md:block">
                <DeliveryStepper activeCount={activeMilestoneCount} />
              </div>
              <div className="mt-5 md:hidden">
                <DeliveryStepper activeCount={activeMilestoneCount} compact />
              </div>
            </section>

            {notice ? <ActionNotice>{notice}</ActionNotice> : null}

            {stage === "ongoing" ? (
              <div className="grid gap-4 xl:grid-cols-3">
                <InfoCard title="Payment Information">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <DetailStat label="Payment Method" value={buyerDemoOrderMeta.paymentType} />
                    <DetailStat
                      label="Payment Status"
                      value={paymentStatus}
                      valueClassName="text-[#F59E0B]"
                    />
                    <DetailStat label="Payment Reference" value={buyerDemoOrderMeta.paymentReference} />
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
                    <DetailStat label="Role" value={buyerDemoOrderMeta.supplier.role} />
                    <DetailStat label="Phone number" value={buyerDemoOrderMeta.supplier.phone} />
                    <DetailStat label="Email address" value={buyerDemoOrderMeta.supplier.email} />
                  </div>
                </InfoCard>
              </div>
            ) : null}

            {stage === "delivery" || stage === "installation" ? (
              <div className="grid gap-5 xl:grid-cols-[1fr_340px_280px]">
                <InfoCard title="Saved Delivery Address">
                  <p className="text-sm font-medium text-[#111827]">
                    {buyerName}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#111827]">
                    {deliveryAddressText}
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-xs text-primary">
                    <Info size={14} />
                    Default address
                  </p>
                  <button className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 text-sm text-white">
                    <Phone size={15} />
                    Call supplier
                  </button>
                </InfoCard>

                <InfoCard title="Escrow Status">
                  <div className="rounded-xl bg-[#FFF0E4] p-4">
                    <p className="text-xl font-medium text-[#FF6B00]">
                      {buyerDemoOrderMeta.escrow.remaining}{" "}
                      <span className="text-sm text-[#111827]">remaining</span>
                    </p>
                    <p className="mt-2 text-xs text-[#6B7280]">
                      Dispute option will unlock if items are not delivered in time
                    </p>
                  </div>
                  <div className="mt-4 rounded-xl bg-[#DFF5F5] p-4">
                    <p className="text-xs text-[#6B7280]">Expected by:</p>
                    <p className="mt-1 text-sm text-[#111827]">
                      {buyerDemoOrderMeta.escrow.expectedBy}
                    </p>
                  </div>
                  <p className="mt-4 text-sm font-medium text-[#FF6B00]">
                    {buyerDemoOrderMeta.escrow.currentStatus}
                  </p>
                  <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-primary">
                    <Info size={14} className="mt-0.5 shrink-0" />
                    {buyerDemoOrderMeta.escrow.note}
                  </p>
                </InfoCard>

                <InfoCard title="Evidence upload">
                  <div className="grid grid-cols-2 gap-2">
                    {buyerDemoOrderMeta.evidenceImages.map((image) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={image}
                        src={image}
                        alt="Delivery evidence"
                        className="h-20 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </InfoCard>

                <div className="flex flex-col gap-3 xl:col-span-3 xl:max-w-[700px] xl:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setModal(stage === "delivery" ? "delivery" : "installation");
                    }}
                    className="h-12 flex-1 rounded-xl bg-primary text-sm font-medium text-white"
                  >
                    {stage === "delivery" ? "Confirm delivery" : "Confirm installation"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal("dispute")}
                    className="h-12 flex-1 rounded-xl border border-[#FF6B00] text-sm font-medium text-[#FF6B00]"
                  >
                    Raise dispute
                  </button>
                </div>
              </div>
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
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="ml-auto flex size-8 items-center justify-center rounded-full border border-[#DDE0E5]"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            {modal === "dispute" ? (
              <DisputeForm
                order={order}
                onSubmit={() => {
                  setModal(null);
                  setNotice("Dispute request submitted for frontend preview.");
                }}
              />
            ) : modal === "payment" ? (
              <ReceiptPreview
                order={order}
                onTrack={() => {
                  setModal(null);
                  navigateStage("delivery");
                }}
              />
            ) : (
              <SuccessState
                title="Congratulations"
                body={
                  modal === "delivery"
                    ? "Order delivery has been confirmed."
                    : "Order installation has been confirmed."
                }
                onDone={() => {
                  setModal(null);
                  navigateStage(modal === "delivery" ? "installation" : "completed");
                }}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
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

function ReceiptPreview({
  order,
  onTrack,
}: {
  order: BuyerOrderRow;
  onTrack: () => void;
}) {
  return (
    <div className="text-left">
      <div className="text-center">
        <ReceiptText size={32} className="mx-auto text-primary" />
        <p className="mt-3 text-xs text-[#6B7280]">Transaction receipt</p>
        <h2 className="mt-2 text-xl font-semibold text-[#111827]">
          {formatCurrency(order.totalPrice)}
        </h2>
        <p className="text-sm text-[#16A34A]">Successful</p>
      </div>
      <div className="mt-5 space-y-3 rounded-xl bg-[#F8FAFC] p-4 text-xs">
        <div className="flex justify-between gap-3">
          <span className="text-[#6B7280]">Product name</span>
          <span className="text-right text-[#111827]">{order.productName}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[#6B7280]">Order ID</span>
          <span className="text-right text-[#111827]">{order.id}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[#6B7280]">Transaction ID</span>
          <span className="text-right text-[#111827]">{buyerDemoOrderMeta.transactionId}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[#6B7280]">Payment method</span>
          <span className="text-right text-[#111827]">{buyerDemoOrderMeta.paymentType}</span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onTrack}
          className="h-11 rounded-xl bg-primary text-sm font-medium text-white"
        >
          Track delivery
        </button>
        <button
          type="button"
          className="h-11 rounded-xl border border-[#FF6B00] text-sm font-medium text-[#FF6B00]"
        >
          Open chat
        </button>
      </div>
    </div>
  );
}

function DisputeForm({
  order,
  onSubmit,
}: {
  order: BuyerOrderRow;
  onSubmit: () => void;
}) {
  return (
    <form
      className="mt-2 text-left"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h2 className="text-lg font-medium text-[#111827]">Flag dispute</h2>
      <div className="mt-4 space-y-3">
        <input
          value={order.id}
          readOnly
          className="h-11 w-full rounded-xl border border-[#DDE0E5] px-3 text-sm text-[#111827]"
        />
        <input
          value={order.productName}
          readOnly
          className="h-11 w-full rounded-xl border border-[#DDE0E5] px-3 text-sm text-[#111827]"
        />
        <select className="h-11 w-full rounded-xl border border-[#DDE0E5] px-3 text-sm text-[#111827]">
          <option>Reason for dispute</option>
          <option>Item not delivered</option>
          <option>Wrong item delivered</option>
          <option>Installation issue</option>
        </select>
        <textarea
          placeholder="Add description"
          className="min-h-[88px] w-full rounded-xl border border-[#DDE0E5] px-3 py-3 text-sm text-[#111827] outline-none"
        />
        <label className="flex h-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#DDE0E5] text-xs text-[#FF6B00]">
          <Upload size={18} />
          Click to upload document
          <input type="file" className="sr-only" />
        </label>
      </div>
      <button
        type="submit"
        className="mt-4 h-11 w-full rounded-xl bg-primary text-sm font-medium text-white"
      >
        Submit request
      </button>
    </form>
  );
}
