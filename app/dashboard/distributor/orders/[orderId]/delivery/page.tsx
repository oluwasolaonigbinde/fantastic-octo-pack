"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Info } from "lucide-react";

import Header from "../../../../component/header";
import { Skeleton } from "@/components/base";
import {
  distributorDemoMilestones,
  distributorDemoOrders,
  distributorDemoOrderMeta,
  getOrderStatusTone,
} from "@/constants/demoDistributorOrders";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchOrderDetail } from "@/store/slices/order-slice";
import type { Order } from "@/types/order";

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

export default function DistributorDeliveryStatusPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentOrder, isLoading } = useAppSelector((state) => state.order);
  const { data: authData } = useAppSelector((state) => state.auth);
  const [notice, setNotice] = useState("");

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
  const activeMilestoneCount =
    status === "cancelled_pre_payment"
      ? 1
      : status === "created_pending_payment"
        ? 3
        : 1;

  return (
    <div>
      <Header
        title="Orders & Disputes"
        description="View all quote request from customers"
      />

      <main className="space-y-5 p-4 md:p-6">
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
              <OrderStat
                label="Unit price"
                value={formatCurrency(unitPrice)}
              />
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
        </section>

        {notice ? (
          <p className="rounded-xl border border-[#DDEBFF] bg-[#F4F9FF] px-4 py-3 text-sm text-primary">
            {notice}
          </p>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="min-h-[520px] rounded-2xl border border-[#DDE0E5] bg-white p-8">
            <h2 className="text-lg font-medium text-[#111827]">
              Update tracking details
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[#111827]">
              When delivery status is updated, buyer get notified and tracking status
              is updated.
            </p>
            <p className="mt-8 text-sm text-[#111827]">
              Receive order to continue updating delivery status
            </p>
            <button
              type="button"
              onClick={() =>
                setNotice(
                  "Receive Order is demo-only in this slice. No backend delivery status was changed.",
                )
              }
              className="mt-5 h-14 w-full max-w-[300px] rounded-xl bg-primary text-sm font-medium text-white transition hover:bg-primary-dark"
            >
              Receive Order
            </button>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#DDE0E5] bg-white p-6">
              <h2 className="text-lg font-medium text-[#111827]">Escrow Status</h2>
              <div className="mt-5 rounded-xl bg-[#FFF0E4] p-4">
                <p className="text-xl font-medium text-[#FF6B00]">
                  {distributorDemoOrderMeta.escrow.remaining}{" "}
                  <span className="text-sm text-[#111827]">remaining</span>
                </p>
                <p className="mt-2 text-xs text-[#6B7280]">
                  Dispute option will unlock if items are not delivered in time
                </p>
              </div>
              <div className="mt-4 rounded-xl bg-[#DFF5F5] p-4">
                <p className="text-xs text-[#6B7280]">Expected by:</p>
                <p className="mt-1 text-sm text-[#111827]">
                  {distributorDemoOrderMeta.escrow.expectedBy}
                </p>
              </div>
              <p className="mt-5 text-sm font-medium text-[#FF6B00]">
                Awaiting buyer confirmation
              </p>
              <div className="mt-5 rounded-xl bg-[#D9FBE7] p-4">
                <p className="text-xs text-[#6B7280]">Product Status:</p>
                <p className="mt-1 text-sm font-medium text-[#16A34A]">
                  {distributorDemoOrderMeta.escrow.productStatus}
                </p>
              </div>
              <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-primary">
                <Info size={14} className="mt-0.5 shrink-0" />
                {distributorDemoOrderMeta.escrow.note}
              </p>
            </section>

            <section className="rounded-2xl border border-[#DDE0E5] bg-white p-6">
              <h2 className="text-lg font-medium text-[#111827]">Delivery Address</h2>
              <p className="mt-5 text-sm font-medium text-[#111827]">
                {distributorDemoOrderMeta.buyer.name}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#111827]">
                {distributorDemoOrderMeta.deliveryAddress}
              </p>
              <p className="mt-4 flex items-center gap-2 text-xs text-primary">
                <Info size={14} />
                Default address
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
