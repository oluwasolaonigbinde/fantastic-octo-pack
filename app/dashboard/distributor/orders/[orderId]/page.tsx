"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Download, Eye, FileText } from "lucide-react";

import Header from "../../../component/header";
import { Skeleton } from "@/components/base";
import {
  distributorDemoOrders,
  distributorDemoOrderMeta,
  getOrderStatusTone,
} from "@/constants/demoDistributorOrders";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchOrderDetail } from "@/store/slices/order-slice";
import type { Order } from "@/types/order";
import type { ProductRef, UserRef } from "@/types/rfq";

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
) => {
  if (person && typeof person === "object") {
    const name = [person.firstName, person.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return name || person.email || fallback;
  }
  return fallback;
};

const getProductImage = (order: Order | null) => {
  const product = order?.product ?? order?.items?.[0]?.product;
  if (product && typeof product === "object") {
    return (product as ProductRef).images?.[0]?.url;
  }
  return undefined;
};

const getOrderDisplayId = (order: Order) =>
  order._id ? `ORD-${order._id.slice(-6).toUpperCase()}` : "Order ID";

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
  const dispatch = useAppDispatch();
  const { currentOrder, isLoading, isError, message } = useAppSelector(
    (state) => state.order,
  );
  const { data: authData } = useAppSelector((state) => state.auth);
  const [notice, setNotice] = useState("");

  const orderId = params.orderId as string;
  const demoOrder = useMemo(
    () => distributorDemoOrders.find((item) => item.id === orderId),
    [orderId],
  );

  useEffect(() => {
    if (authData?.tokens?.accessToken && orderId && !demoOrder) {
      dispatch(
        fetchOrderDetail({ token: authData.tokens.accessToken, orderId }),
      );
    }
  }, [authData?.tokens?.accessToken, demoOrder, dispatch, orderId]);

  const order = currentOrder;
  const productImage = useMemo(() => getProductImage(order), [order]);

  if (isLoading || (!order && !demoOrder)) {
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

  const status = order?.status || demoOrder?.status;
  const statusTone = getOrderStatusTone(status);
  const displayId =
    demoOrder?.id || (order ? getOrderDisplayId(order) : orderId);
  const quantity =
    demoOrder?.quantity || order?.quantity || order?.items?.[0]?.quantity || 1;
  const productName =
    demoOrder?.productName ||
    order?.productName ||
    order?.items?.[0]?.productName ||
    "Product name";
  const totalPrice = demoOrder?.totalPrice || order?.totalPrice || 0;
  const unitPrice = demoOrder?.unitPrice || totalPrice / quantity;
  const createdAt =
    demoOrder?.createdAt || order?.createdAt || new Date().toISOString();
  const buyerName =
    demoOrder?.buyerName ||
    getPersonName(order?.buyer, distributorDemoOrderMeta.buyer.name);

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
                {/* to be updated to real values  */}
                <DetailStat
                  label="Payment status"
                  value={"Paid"}
                  valueClassName="text-[#F59E0B]"
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
        </section>

        {notice ? (
          <p className="rounded-xl border border-[#DDEBFF] bg-[#F4F9FF] px-4 py-3 text-sm text-primary">
            {notice}
          </p>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-3">
          <InfoCard title="Payment Information">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm text-[#6B7280]">Payment Method</p>
                <p className="mt-2 text-sm font-medium text-[#111827]">
                  {distributorDemoOrderMeta.paymentType}
                </p>
                <div className="mt-5 space-y-2">
                  <p className="text-sm text-[#6B7280]">Payment Details</p>
                  {distributorDemoOrderMeta.paymentDetails.map((item) => (
                    <p key={item.label} className="text-sm text-[#111827]">
                      {item.label}: {item.value}
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Documents</p>
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <span className="inline-flex size-7 items-center justify-center rounded-md bg-[#D9FBE7] text-[#16A34A]">
                    <FileText size={15} />
                  </span>
                  <span className="text-[#111827]">
                    {distributorDemoOrderMeta.invoiceName}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setNotice(
                        "Document preview is demo-only until order documents are available.",
                      )
                    }
                    className="ml-auto text-[#FF6B00]"
                    aria-label="Preview document"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNotice(
                        "Document download is demo-only until backend files are available.",
                      )
                    }
                    className="text-[#FF6B00]"
                    aria-label="Download document"
                  >
                    <Download size={15} />
                  </button>
                </div>
              </div>
            </div>
          </InfoCard>

          <InfoCard title="Delivery Address">
            <p className="text-sm leading-7 text-[#111827]">
              {order?.deliveryAddress?.address}
            </p>
          </InfoCard>

          <InfoCard title="Buyer Information">
            <div className="grid gap-6 sm:grid-cols-2">
              <DetailStat label="Full name" value={buyerName} />
              <DetailStat
                label="Role"
                value={distributorDemoOrderMeta.buyer.role}
              />
              <DetailStat
                label="Phone number"
                value={
                  order && typeof order.buyer === "object"
                    ? order.buyer.phoneNumber ||
                      distributorDemoOrderMeta.buyer.phone
                    : distributorDemoOrderMeta.buyer.phone
                }
              />
              <DetailStat
                label="Email address"
                value={
                  order && typeof order.buyer === "object"
                    ? order.buyer.email || distributorDemoOrderMeta.buyer.email
                    : distributorDemoOrderMeta.buyer.email
                }
              />
            </div>
          </InfoCard>
        </div>
      </main>
    </div>
  );
}
