"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import Header from "../../../component/header";
import { Skeleton } from "@/components/base";
import { getOrderStatusTone } from "@/constants/demoDistributorOrders";
import { useOrderQuery } from "@/hooks/queries/orders";
import type { Order } from "@/types/order";
import {
  getOrderReference,
  getPaymentStatusDisplay,
  isPaidOrderStatus,
} from "@/types/order";
import type { ProductRef, UserRef } from "@/types/rfq";
import { getPartyDisplayName } from "@/utils/partyDisplayName";

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

const getPersonName = (
  person: string | UserRef | undefined,
  fallback: string,
) => getPartyDisplayName(person, fallback);

const getProductImage = (order: Order | null) => {
  const product = order?.product ?? order?.items?.[0]?.product;
  if (product && typeof product === "object") {
    return (product as ProductRef).images?.[0]?.url;
  }
  return undefined;
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
      <p className={`mt-1 break-words text-sm font-medium ${valueClassName}`}>{value}</p>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <h2 className="text-lg font-medium text-[#111827]">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function DistributorOrderDetailPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = params.orderId as string;

  const {
    data: currentOrder,
    isLoading,
    isError,
    error,
  } = useOrderQuery(orderId);
  const message = error instanceof Error ? error.message : "";

  const order = currentOrder ?? null;
  const productImage = useMemo(() => getProductImage(order), [order]);

  if (isLoading || !order) {
    return (
      <div>
        <Header
          title="Orders & Disputes"
          description="View all quote request from customers"
        />
        <main className="space-y-4 p-4 md:p-6">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-48" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          {isError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {message || "Unable to load order detail."}
            </p>
          ) : null}
        </main>
      </div>
    );
  }

  const status = order?.status;
  const statusTone = getOrderStatusTone(status);
  const paid = isPaidOrderStatus(status);
  // Delivery flow is only meaningful once escrow is funded; stays visible
  // through completion but hides for refunded (`closed`) and pre-payment states.
  const showDeliveryButton = paid;
  const paymentStatus = getPaymentStatusDisplay(status, paid);
  const payReference = order?.paymentReference || "—";
  const displayId = getOrderReference(order ?? { _id: orderId });
  const quantity = order?.quantity || order?.items?.[0]?.quantity || 1;
  const productName =
    order?.productName || order?.items?.[0]?.productName || "Product name";
  const totalPrice = order?.totalPrice || 0;
  const unitPrice = totalPrice / quantity;
  const createdAt = order?.createdAt || new Date().toISOString();
  const buyerName = getPersonName(order?.buyer, "Buyer");

  return (
    <div>
      <Header
        title="Orders & Disputes"
        description="View all quote request from customers"
      />

      <main className="space-y-5 p-4 md:p-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard/distributor/orders")}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#111827]"
        >
          <ArrowLeft size={17} />
          Go Back
        </button>

        <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
          <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
            <div className="flex h-[150px] items-center justify-center overflow-hidden rounded-xl border border-[#E9EEF5] bg-[#F8FAFC]">
              {productImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={productImage}
                  alt={productName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-20 w-28 rounded-full bg-gradient-to-br from-[#DDE7F0] to-[#F8FAFC] shadow-inner" />
              )}
            </div>

            <div className="grid content-start gap-5 xl:grid-cols-[1fr_auto]">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                <DetailStat label="Order ID" value={displayId} />
                <DetailStat label="Name of product" value={productName} />
                <DetailStat label="Quantity" value={String(quantity)} />
                <DetailStat
                  label="Unit price"
                  value={formatCurrency(unitPrice)}
                />
                <DetailStat
                  label="Total price"
                  value={formatCurrency(totalPrice)}
                />
                <DetailStat
                  label="Payment status"
                  value={paymentStatus.label}
                  valueClassName={paymentStatus.className}
                />
                <DetailStat
                  label="Date created"
                  value={formatDate(createdAt)}
                />
                <DetailStat
                  label="Status"
                  value={statusTone.label}
                  valueClassName={statusTone.textClassName}
                />
              </div>

              <span
                className={`inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-medium ${statusTone.className}`}
              >
                {statusTone.label}
              </span>
            </div>
          </div>

          {showDeliveryButton ? (
            <button
              type="button"
              onClick={() =>
                router.push(`/dashboard/distributor/orders/${orderId}/delivery`)
              }
              className="mt-5 inline-flex h-14 min-w-[214px] items-center justify-center gap-3 rounded-xl border border-primary bg-[#F5FAFF] px-6 text-sm font-medium text-primary transition hover:bg-[#EAF4FF]"
            >
              View delivery status
              <ArrowRight size={17} />
            </button>
          ) : null}
        </section>

        <div className="grid gap-4 xl:grid-cols-3">
          <InfoCard title="Payment Information">
            <div className="grid gap-6 sm:grid-cols-2">
              <DetailStat label="Payment Method" value="ESCROW" />
              <DetailStat
                label="Payment Status"
                value={paymentStatus.label}
                valueClassName={paymentStatus.className}
              />
              <DetailStat label="Payment Reference" value={payReference} />
            </div>
          </InfoCard>

          <InfoCard title="Delivery Address">
            <p className="text-sm leading-7 text-[#111827]">
              {order?.deliveryAddress?.address || "—"}
            </p>
          </InfoCard>

          <InfoCard title="Buyer Information">
            <div className="grid gap-6 sm:grid-cols-2">
              <DetailStat label="Full name" value={buyerName} />
              <DetailStat label="Role" value="Buyer" />
              <DetailStat
                label="Phone number"
                value={
                  (order && typeof order.buyer === "object"
                    ? order.buyer.phoneNumber
                    : "") || "—"
                }
              />
              <DetailStat
                label="Email address"
                value={
                  (order && typeof order.buyer === "object"
                    ? order.buyer.email
                    : "") || "—"
                }
              />
            </div>
          </InfoCard>
        </div>
      </main>
    </div>
  );
}
