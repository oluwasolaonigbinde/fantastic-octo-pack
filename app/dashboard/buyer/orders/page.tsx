"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  Eye,
  Filter,
  PackageCheck,
  ReceiptText,
  Users,
  WalletCards,
} from "lucide-react";

import Header from "../../component/header";
import { EmptyState, Skeleton } from "@/components/base";
import {
  buyerDemoOrderDisputes,
} from "@/constants/demoBuyerOrderDisputes";
import {
  buyerDemoOrders,
  getBuyerOrderStatusTone,
  toBuyerOrderRow,
  type BuyerOrderRow,
} from "@/constants/demoBuyerOrders";
import {
  getDisputeStatusTone,
  toBuyerDisputeRow,
  type BuyerDisputeRow,
} from "@/lib/order-dispute-presenter";
import { useOrdersQuery } from "@/hooks/queries/orders";
import { useOrderDisputes } from "@/hooks/useOrderDisputes";

type ActiveTab = "orders" | "disputes";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
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

function FilterField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "date";
}) {
  return (
    <label className="block">
      <span className="mb-2 block px-4 text-sm text-[#111827]">{label}</span>
      <span className="flex h-[60px] items-center rounded-xl border border-[#DDE0E5] bg-white px-4">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#C4C8CE]"
        />
        {type === "date" ? <CalendarDays size={20} className="text-[#6B7280]" /> : null}
      </span>
    </label>
  );
}

function OrderTable({
  orders,
  onView,
}: {
  orders: BuyerOrderRow[];
  onView: (order: BuyerOrderRow) => void;
}) {
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[1090px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#F3F4F6] text-[#6B7280]">
            <th className="py-3 pr-4 font-medium">Order ID</th>
            <th className="py-3 pr-4 font-medium">Product&apos;s name</th>
            <th className="py-3 pr-4 font-medium">Quantity</th>
            <th className="py-3 pr-4 font-medium">Unit price</th>
            <th className="py-3 pr-4 font-medium">Total price</th>
            <th className="py-3 pr-4 font-medium">Date</th>
            <th className="py-3 pr-4 font-medium">Order status</th>
            <th className="py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const statusTone = getBuyerOrderStatusTone(order.status);
            return (
              <tr key={order.sourceId} className="border-b border-[#F3F4F6]">
                <td className="py-4 pr-4 text-[#111827]">{order.id}</td>
                <td className="py-4 pr-4 text-[#111827]">{order.productName}</td>
                <td className="py-4 pr-4 text-[#111827]">{order.quantity}</td>
                <td className="py-4 pr-4 text-[#111827]">
                  {formatCurrency(order.unitPrice)}
                </td>
                <td className="py-4 pr-4 text-[#111827]">
                  {formatCurrency(order.totalPrice)}
                </td>
                <td className="py-4 pr-4 text-[#111827]">
                  {formatDate(order.createdAt)} (1 week)
                </td>
                <td className={`py-4 pr-4 ${statusTone.textClassName}`}>
                  {statusTone.label}
                </td>
                <td className="py-4">
                  <button
                    type="button"
                    onClick={() => onView(order)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                  >
                    <Eye size={17} />
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MobileOrderList({
  orders,
  onView,
}: {
  orders: BuyerOrderRow[];
  onView: (order: BuyerOrderRow) => void;
}) {
  return (
    <div className="mt-6 space-y-3 md:hidden">
      {orders.map((order) => {
        const statusTone = getBuyerOrderStatusTone(order.status);
        return (
          <article
            key={order.sourceId}
            className="rounded-2xl border border-[#DDE0E5] bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[#6B7280]">{order.id}</p>
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
                <span className="mt-1 block text-sm text-[#111827]">{order.quantity}</span>
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

function DisputeTable({
  disputes,
  onView,
}: {
  disputes: BuyerDisputeRow[];
  onView: (dispute: BuyerDisputeRow) => void;
}) {
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[1090px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#F3F4F6] text-[#6B7280]">
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
          {disputes.map((dispute) => {
            const statusTone = getDisputeStatusTone(
              dispute.status,
              dispute.resolutionOutcome,
            );
            return (
              <tr key={dispute.sourceId} className="border-b border-[#F3F4F6]">
                <td className="py-4 pr-4 text-[#111827]">{dispute.id}</td>
                <td className="py-4 pr-4 text-[#111827]">{dispute.orderId}</td>
                <td className="py-4 pr-4 text-[#111827]">
                  {formatCurrency(dispute.amount)}
                </td>
                <td className="py-4 pr-4 text-[#111827]">{dispute.itemName}</td>
                <td className="py-4 pr-4 text-[#111827]">{dispute.reason}</td>
                <td className="py-4 pr-4 text-[#111827]">{dispute.against}</td>
                <td className={`py-4 pr-4 ${statusTone.textClassName}`}>
                  {statusTone.label}
                </td>
                <td className="py-4">
                  <button
                    type="button"
                    onClick={() => onView(dispute)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                  >
                    <Eye size={17} />
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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

export default function BuyerOrders() {
  const router = useRouter();
  const { data: orders, isLoading } = useOrdersQuery();
  const { disputes, isLoading: disputesLoading } = useOrderDisputes();
  const [activeTab, setActiveTab] = useState<ActiveTab>("orders");
  const [orderIdQuery, setOrderIdQuery] = useState("");
  const [statusQuery, setStatusQuery] = useState("");
  const [dateQuery, setDateQuery] = useState("");

  const realOrders = useMemo(() => (Array.isArray(orders) ? orders.map(toBuyerOrderRow) : []), [orders]);
  const displayOrders = realOrders.length > 0 ? realOrders : buyerDemoOrders;

  const filteredOrders = useMemo(() => {
    return displayOrders.filter((order) => {
      const matchesId = order.id.toLowerCase().includes(orderIdQuery.toLowerCase().trim());
      const matchesStatus = getBuyerOrderStatusTone(order.status)
        .label.toLowerCase()
        .includes(statusQuery.toLowerCase().trim());
      const matchesDate =
        !dateQuery || new Date(order.createdAt).toISOString().startsWith(dateQuery);
      return matchesId && matchesStatus && matchesDate;
    });
  }, [dateQuery, displayOrders, orderIdQuery, statusQuery]);

  const displayDisputes = useMemo<BuyerDisputeRow[]>(() => {
    if (Array.isArray(disputes) && disputes.length > 0) {
      return disputes.map(toBuyerDisputeRow);
    }
    // Visual fallback while no live disputes exist for the account.
    return buyerDemoOrderDisputes.map((dispute) => ({
      id: dispute.id,
      sourceId: dispute.id,
      orderId: dispute.orderId,
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

  const filteredDisputes = useMemo(() => {
    return displayDisputes.filter((dispute) => {
      const statusTone = getDisputeStatusTone(
        dispute.status,
        dispute.resolutionOutcome,
      );
      const matchesId = dispute.id.toLowerCase().includes(orderIdQuery.toLowerCase().trim());
      const matchesStatus = statusTone.label
        .toLowerCase()
        .includes(statusQuery.toLowerCase().trim());
      const matchesDate =
        !dateQuery || new Date(dispute.createdAt).toISOString().startsWith(dateQuery);
      return matchesId && matchesStatus && matchesDate;
    });
  }, [dateQuery, displayDisputes, orderIdQuery, statusQuery]);

  const disputeMetrics = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const resolved = displayDisputes.filter((d) => d.status === "resolved");
    const ongoing = displayDisputes.filter(
      (d) => d.status === "under_review" || d.status === "awaiting_evidence" || d.status === "ongoing",
    );
    const rejected = displayDisputes.filter(
      (d) =>
        d.status === "rejected" ||
        (d.status === "resolved" && d.resolutionOutcome === "release_to_seller"),
    );
    return {
      flagged: pad(displayDisputes.length),
      resolved: pad(resolved.length),
      ongoing: pad(ongoing.length),
      rejected: pad(rejected.length),
    };
  }, [displayDisputes]);

  const metrics = {
    total: String(displayOrders.length).padStart(2, "0"),
    delivered: String(
      displayOrders.filter((order) => order.status === "completed").length || 0,
    ).padStart(2, "0"),
    pending: String(
      displayOrders.filter((order) =>
        ["created_pending_payment", "not_paid"].includes(order.status),
      ).length,
    ).padStart(2, "0"),
    cancelled: String(
      displayOrders.filter((order) => order.status === "cancelled_pre_payment").length,
    ).padStart(2, "0"),
  };

  const viewOrder = (order: BuyerOrderRow) => {
    router.push(`/dashboard/buyer/orders/${order.sourceId}`);
  };

  const viewDispute = (dispute: BuyerDisputeRow) => {
    router.push(`/dashboard/buyer/orders/disputes/${dispute.sourceId}`);
  };

  return (
    <div>
      <Header title="My Orders" description="Manage and track all orders" />

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title={activeTab === "orders" ? "Total orders" : "Total flagged disputes"}
            value={activeTab === "orders" ? metrics.total : disputeMetrics.flagged}
            icon={<Users size={19} className="text-primary" />}
            iconClassName="bg-[#D7EDFF]"
          />
          <MetricCard
            title={activeTab === "orders" ? "Total orders delivered" : "Total resolved disputes"}
            value={activeTab === "orders" ? metrics.delivered : disputeMetrics.resolved}
            icon={<PackageCheck size={19} className="text-[#D946EF]" />}
            iconClassName="bg-[#F9D7FF]"
          />
          <MetricCard
            title={activeTab === "orders" ? "Total pending orders" : "Ongoing disputes"}
            value={activeTab === "orders" ? metrics.pending : disputeMetrics.ongoing}
            icon={<WalletCards size={19} className="text-[#16A34A]" />}
            iconClassName="bg-[#DCFCE7]"
          />
          <MetricCard
            title={activeTab === "orders" ? "Total cancelled orders" : "Total rejected"}
            value={activeTab === "orders" ? metrics.cancelled : disputeMetrics.rejected}
            icon={<ReceiptText size={19} className="text-[#F59E0B]" />}
            iconClassName="bg-[#FEF3C7]"
          />
        </div>

        <section className="rounded-2xl border border-[#DDE0E5] bg-white p-4 md:p-5">
          <h2 className="text-xl font-medium text-[#111827]">
            {activeTab === "orders" ? "All Orders" : "All Disputes"}
          </h2>
          <p className="mt-7 text-sm font-medium text-[#111827]">Filter table list by:</p>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr]">
            {activeTab === "orders" ? (
              <>
                <FilterField
                  label="Order ID"
                  value={orderIdQuery}
                  onChange={setOrderIdQuery}
                  placeholder="Enter order ID"
                />
                <FilterField
                  label="Order status"
                  value={statusQuery}
                  onChange={setStatusQuery}
                  placeholder="Select status"
                />
                <FilterField
                  label="Date created"
                  value={dateQuery}
                  onChange={setDateQuery}
                  placeholder="DD/MM/YY"
                  type="date"
                />
              </>
            ) : (
              <>
                <FilterField
                  label="Status"
                  value={statusQuery}
                  onChange={setStatusQuery}
                  placeholder="Select status"
                />
                <FilterField
                  label="Date raised"
                  value={dateQuery}
                  onChange={setDateQuery}
                  placeholder="DD/MM/YY"
                  type="date"
                />
                <FilterField
                  label="Dispute ID"
                  value={orderIdQuery}
                  onChange={setOrderIdQuery}
                  placeholder="Enter dispute ID"
                />
              </>
            )}
            <button
              type="button"
              className="mt-6 inline-flex h-[60px] items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm text-white transition hover:bg-primary-dark"
            >
              <Filter size={17} />
              Filter
            </button>
          </div>

          {(activeTab === "orders" ? isLoading : disputesLoading) ? (
            <div className="mt-8 space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : activeTab === "orders" ? (
            filteredOrders.length > 0 ? (
              <>
                <div className="hidden md:block">
                  <OrderTable orders={filteredOrders} onView={viewOrder} />
                </div>
                <MobileOrderList orders={filteredOrders} onView={viewOrder} />
              </>
            ) : (
              <EmptyState
                icon={<ClipboardList />}
                title="No orders found"
                description="Orders created from quotes or direct purchases will appear here."
              />
            )
          ) : (
            filteredDisputes.length > 0 ? (
              <>
                <div className="hidden md:block">
                  <DisputeTable disputes={filteredDisputes} onView={viewDispute} />
                </div>
                <MobileDisputeList disputes={filteredDisputes} onView={viewDispute} />
              </>
            ) : (
              <EmptyState
                icon={<ClipboardList />}
                title="No disputes found"
                description="Order disputes raised against distributors will appear here."
              />
            )
          )}
        </section>
      </main>
    </div>
  );
}
