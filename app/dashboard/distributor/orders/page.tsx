"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Filter,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  Users,
  WalletCards,
} from "lucide-react";

import Header from "../../component/header";
import { EmptyState, Skeleton } from "@/components/base";
import {
  distributorDemoDisputes,
  distributorDemoOrders,
  getOrderStatusTone,
} from "@/constants/demoDistributorOrders";
import {
  getDisputeStatusTone,
  toDistributorDisputeRow,
  type BuyerDisputeRow,
} from "@/lib/order-dispute-presenter";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { useOrderDisputes } from "@/hooks/useOrderDisputes";
import { fetchOrders } from "@/store/slices/order-slice";
import type { Order } from "@/types/order";

type ActiveTab = "orders" | "disputes";
type OrderRow = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  status: string;
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
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};

const toOrderRow = (order: Order): OrderRow => {
  const quantity = order.quantity ?? order.items?.[0]?.quantity ?? 1;
  return {
    id: order._id,
    productName:
      order.productName || order.items?.[0]?.productName || "Name of the product",
    quantity,
    unitPrice: order.totalPrice / quantity,
    totalPrice: order.totalPrice,
    createdAt: order.createdAt,
    status: order.status,
  };
};

function MetricCard({
  title,
  value,
  icon,
  iconClassName,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="flex min-h-[104px] flex-col justify-between rounded-2xl border border-[#DDE0E5] bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#111827]">{title}</p>
          <p className="mt-2 text-lg font-medium text-[#111827]">{value}</p>
        </div>
        <span className={`flex size-10 items-center justify-center rounded-lg ${iconClassName}`}>
          {icon}
        </span>
      </div>
      <p className="text-xs text-[#6B7280]">This month</p>
    </div>
  );
}

function FilterInput({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: "text" | "date";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-[#111827]">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="h-14 w-full rounded-xl border border-[#DDE0E5] bg-white px-4 text-sm text-[#111827] outline-none placeholder:text-[#B9C0CC] focus:border-primary"
      />
    </label>
  );
}

function MobileOrderList({
  orders,
  onView,
}: {
  orders: OrderRow[];
  onView: (order: OrderRow) => void;
}) {
  return (
    <div className="mt-6 space-y-3 md:hidden">
      {orders.map((order) => {
        const statusTone = getOrderStatusTone(order.status);
        const orderId = order.id.startsWith("ORD-")
          ? order.id
          : `ORD-${order.id.slice(-6).toUpperCase()}`;
        return (
          <article
            key={order.id}
            className="rounded-2xl border border-[#DDE0E5] bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[#6B7280]">{orderId}</p>
                <h3 className="mt-1 text-sm font-medium text-[#111827]">
                  {order.productName}
                </h3>
              </div>
              <span className={`text-xs ${statusTone.textClassName}`}>
                {statusTone.label}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#6B7280]">
              <p>
                Quantity
                <span className="mt-1 block text-sm text-[#111827]">
                  {order.quantity}
                </span>
              </p>
              <p>
                Total price
                <span className="mt-1 block text-sm text-[#111827]">
                  {formatCurrency(order.totalPrice)}
                </span>
              </p>
              <p>
                Unit price
                <span className="mt-1 block text-sm text-[#111827]">
                  {formatCurrency(order.unitPrice)}
                </span>
              </p>
              <p>
                Date
                <span className="mt-1 block text-sm text-[#111827]">
                  {formatDate(order.createdAt)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onView(order)}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary text-sm font-medium text-primary"
            >
              <Eye size={16} />
              View
            </button>
          </article>
        );
      })}
    </div>
  );
}

function MobileDisputeList({
  disputes,
  onView,
}: {
  disputes: BuyerDisputeRow[];
  onView: (dispute: BuyerDisputeRow) => void;
}) {
  return (
    <div className="mt-6 space-y-3 md:hidden">
      {disputes.map((dispute) => {
        const statusTone = getDisputeStatusTone(
          dispute.status,
          dispute.resolutionOutcome,
          "seller",
        );
        return (
          <article
            key={dispute.sourceId}
            className="rounded-2xl border border-[#DDE0E5] bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[#6B7280]">{dispute.id}</p>
                <h3 className="mt-1 text-sm font-medium text-[#111827]">
                  {dispute.reason}
                </h3>
              </div>
              <span className={`text-xs ${statusTone.textClassName}`}>
                {statusTone.label}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#6B7280]">
              <p>
                Order ID
                <span className="mt-1 block text-sm text-[#111827]">
                  {dispute.orderId}
                </span>
              </p>
              <p>
                Amount
                <span className="mt-1 block text-sm text-[#111827]">
                  {formatCurrency(dispute.amount)}
                </span>
              </p>
              <p>
                Item name
                <span className="mt-1 block text-sm text-[#111827]">
                  {dispute.itemName}
                </span>
              </p>
              <p>
                Against
                <span className="mt-1 block text-sm text-[#111827]">
                  {dispute.against}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onView(dispute)}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary text-sm font-medium text-primary"
            >
              <Eye size={16} />
              View
            </button>
          </article>
        );
      })}
    </div>
  );
}

export default function DistributorOrdersPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { orders, isLoading } = useAppSelector((state) => state.order);
  const { data: authData } = useAppSelector((state) => state.auth);
  const { disputes } = useOrderDisputes();
  const [activeTab, setActiveTab] = useState<ActiveTab>("orders");

  useEffect(() => {
    if (authData?.tokens?.accessToken && !orders) {
      dispatch(fetchOrders(authData.tokens.accessToken));
    }
  }, [dispatch, authData?.tokens?.accessToken, orders]);

  const orderList = useMemo(() => (Array.isArray(orders) ? orders : []), [orders]);
  const displayOrders = orderList.length > 0 ? orderList.map(toOrderRow) : distributorDemoOrders;

  const displayDisputes = useMemo<BuyerDisputeRow[]>(() => {
    if (Array.isArray(disputes) && disputes.length > 0) {
      return disputes.map(toDistributorDisputeRow);
    }
    // Visual fallback while no live disputes exist for the account.
    return distributorDemoDisputes.map((dispute) => ({
      id: dispute.id,
      sourceId: dispute.id,
      orderId: dispute.orderId,
      orderSourceId: dispute.orderId,
      amount: dispute.amount,
      itemName: dispute.itemName,
      reason: dispute.reason,
      against: dispute.against,
      status: dispute.status,
      resolutionOutcome:
        dispute.status === "resolved" ? "refund_buyer" : undefined,
      createdAt: dispute.createdAt,
    }));
  }, [disputes]);

  const orderMetrics = {
    total: String(displayOrders.length).padStart(2, "0"),
    delivered: String(
      displayOrders.filter((order) => String(order.status) === "completed").length || 10,
    ).padStart(2, "0"),
    pending: String(
      displayOrders.filter((order) => order.status === "created_pending_payment").length,
    ).padStart(2, "0"),
    cancelled: String(
      displayOrders.filter((order) => order.status === "cancelled_pre_payment").length || 10,
    ).padStart(2, "0"),
  };

  const disputeMetrics = {
    flagged: String(displayDisputes.length).padStart(2, "0"),
    resolved: String(
      displayDisputes.filter((dispute) => dispute.status === "resolved").length,
    ).padStart(2, "0"),
    ongoing: String(
      displayDisputes.filter(
        (dispute) =>
          dispute.status === "under_review" ||
          dispute.status === "awaiting_evidence" ||
          dispute.status === "ongoing",
      ).length,
    ).padStart(2, "0"),
    rejected: String(
      displayDisputes.filter(
        (dispute) =>
          dispute.status === "rejected" ||
          (dispute.status === "resolved" &&
            dispute.resolutionOutcome === "release_to_seller"),
      ).length,
    ).padStart(2, "0"),
  };

  const viewOrder = (order: OrderRow) =>
    router.push(`/dashboard/distributor/orders/${order.id}`);

  const viewDispute = (dispute: BuyerDisputeRow) =>
    router.push(
      `/dashboard/distributor/orders/${
        dispute.orderSourceId || dispute.sourceId
      }/disputes/${dispute.sourceId}`,
    );

  return (
    <div>
      <Header
        title="Orders & Disputes"
        description="View all quote request from customers"
      />

      <main className="space-y-5 p-4 md:p-6">
        <div className="grid grid-cols-2 overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`h-[58px] text-sm transition ${
              activeTab === "orders"
                ? "bg-primary text-white"
                : "bg-white text-[#111827] hover:bg-[#F3F7FD]"
            }`}
          >
            All orders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("disputes")}
            className={`h-[58px] text-sm transition ${
              activeTab === "disputes"
                ? "bg-primary text-white"
                : "bg-white text-[#111827] hover:bg-[#F3F7FD]"
            }`}
          >
            All disputes
          </button>
        </div>

        {activeTab === "orders" ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total orders created"
                value={orderMetrics.total}
                icon={<Users size={19} className="text-primary" />}
                iconClassName="bg-[#D7EDFF]"
              />
              <MetricCard
                title="Total orders delivered"
                value={orderMetrics.delivered}
                icon={<PackageCheck size={19} className="text-[#D946EF]" />}
                iconClassName="bg-[#F9D7FF]"
              />
              <MetricCard
                title="Total pending orders"
                value={orderMetrics.pending}
                icon={<WalletCards size={19} className="text-[#16A34A]" />}
                iconClassName="bg-[#DCFCE7]"
              />
              <MetricCard
                title="Total cancelled orders"
                value={orderMetrics.cancelled}
                icon={<ReceiptText size={19} className="text-[#F59E0B]" />}
                iconClassName="bg-[#FEF3C7]"
              />
            </div>

            <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
              <h2 className="text-lg font-medium text-[#111827]">All Orders</h2>
              <p className="mt-7 text-xs font-medium text-[#111827]">
                Filter table list by:
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr]">
                <FilterInput label="Order ID" placeholder="Enter order ID" />
                <FilterInput label="Delivery status" placeholder="Select status" />
                <FilterInput label="Date created" placeholder="DD/MM/YY" type="date" />
                <button
                  type="button"
                  className="mt-6 inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm text-white transition hover:bg-primary-dark"
                >
                  <Filter size={16} />
                  Filter
                </button>
              </div>

              {isLoading ? (
                <div className="mt-8 space-y-3">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : displayOrders.length === 0 ? (
                <div className="mt-8">
                  <EmptyState
                    icon={<ShoppingBag />}
                    title="No orders yet"
                    description="When a buyer places an order from your quote, it will appear here."
                  />
                </div>
              ) : (
                <>
                  <div className="mt-8 hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[940px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#EEF2F7] text-xs text-[#6B7280]">
                        <th className="py-3 pr-4 font-medium">Order ID</th>
                        <th className="py-3 pr-4 font-medium">Product&apos;s name</th>
                        <th className="py-3 pr-4 font-medium">Quantity</th>
                        <th className="py-3 pr-4 font-medium">Unit price</th>
                        <th className="py-3 pr-4 font-medium">Total price</th>
                        <th className="py-3 pr-4 font-medium">Date</th>
                        <th className="py-3 pr-4 font-medium">Delivery status</th>
                        <th className="py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayOrders.map((order) => {
                        const statusTone = getOrderStatusTone(order.status);
                        return (
                          <tr key={order.id} className="border-b border-[#F3F4F6]">
                            <td className="py-4 pr-4 text-[#111827]">
                              {order.id.startsWith("ORD-")
                                ? order.id
                                : `ORD-${order.id.slice(-6).toUpperCase()}`}
                            </td>
                            <td className="py-4 pr-4 text-[#111827]">
                              {order.productName}
                            </td>
                            <td className="py-4 pr-4 text-[#111827]">
                              {order.quantity}
                            </td>
                            <td className="py-4 pr-4 text-[#111827]">
                              {formatCurrency(order.unitPrice)}
                            </td>
                            <td className="py-4 pr-4 text-[#111827]">
                              {formatCurrency(order.totalPrice)}
                            </td>
                            <td className="py-4 pr-4 text-[#111827]">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className={`py-4 pr-4 ${statusTone.textClassName}`}>
                              {statusTone.label}
                            </td>
                            <td className="py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(`/dashboard/distributor/orders/${order.id}`)
                                }
                                className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                              >
                                <Eye size={15} />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    </table>
                  </div>
                  <MobileOrderList orders={displayOrders} onView={viewOrder} />
                </>
              )}
            </section>
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total flagged disputes"
                value={disputeMetrics.flagged}
                icon={<Users size={19} className="text-primary" />}
                iconClassName="bg-[#D7EDFF]"
              />
              <MetricCard
                title="Total resolved disputes"
                value={disputeMetrics.resolved}
                icon={<PackageCheck size={19} className="text-[#D946EF]" />}
                iconClassName="bg-[#F9D7FF]"
              />
              <MetricCard
                title="Ongoing disputes"
                value={disputeMetrics.ongoing}
                icon={<WalletCards size={19} className="text-[#16A34A]" />}
                iconClassName="bg-[#DCFCE7]"
              />
              <MetricCard
                title="Total rejected"
                value={disputeMetrics.rejected}
                icon={<ReceiptText size={19} className="text-[#F59E0B]" />}
                iconClassName="bg-[#FEF3C7]"
              />
            </div>

            <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
              <h2 className="text-lg font-medium text-[#111827]">All Disputes</h2>
              <p className="mt-7 text-xs font-medium text-[#111827]">
                Filter table list by:
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr]">
                <FilterInput label="Status" placeholder="Select status" />
                <FilterInput label="Date raised" placeholder="DD/MM/YY" type="date" />
                <FilterInput label="Dispute ID" placeholder="Enter ID" />
                <button
                  type="button"
                  className="mt-6 inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm text-white transition hover:bg-primary-dark"
                >
                  <Filter size={16} />
                  Filter
                </button>
              </div>

              <div className="mt-8 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[940px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#EEF2F7] text-xs text-[#6B7280]">
                      <th className="py-3 pr-4 font-medium">Dispute ID</th>
                      <th className="py-3 pr-4 font-medium">Order ID</th>
                      <th className="py-3 pr-4 font-medium">Amount</th>
                      <th className="py-3 pr-4 font-medium">Item name</th>
                      <th className="py-3 pr-4 font-medium">Reason for dispute</th>
                      <th className="py-3 pr-4 font-medium">Against</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayDisputes.map((dispute) => {
                      const statusTone = getDisputeStatusTone(
                        dispute.status,
                        dispute.resolutionOutcome,
                        "seller",
                      );
                      return (
                        <tr
                          key={dispute.sourceId}
                          className="border-b border-[#F3F4F6]"
                        >
                          <td className="py-4 pr-4 text-[#111827]">{dispute.id}</td>
                          <td className="py-4 pr-4 text-[#111827]">
                            {dispute.orderId}
                          </td>
                          <td className="py-4 pr-4 text-[#111827]">
                            {formatCurrency(dispute.amount)}
                          </td>
                          <td className="py-4 pr-4 text-[#111827]">
                            {dispute.itemName}
                          </td>
                          <td className="py-4 pr-4 text-[#111827]">
                            {dispute.reason}
                          </td>
                          <td className="py-4 pr-4 text-[#111827]">
                            {dispute.against}
                          </td>
                          <td className={`py-4 pr-4 ${statusTone.textClassName}`}>
                            {statusTone.label}
                          </td>
                          <td className="py-4">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/dashboard/distributor/orders/${
                                    dispute.orderSourceId || dispute.sourceId
                                  }/disputes/${dispute.sourceId}`,
                                )
                              }
                              className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                            >
                              <Eye size={15} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <MobileDisputeList disputes={displayDisputes} onView={viewDispute} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
