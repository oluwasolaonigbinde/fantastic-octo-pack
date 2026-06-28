"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  ClipboardList,
  Eye,
  Filter,
  Loader2,
  UsersRound,
} from "lucide-react";

import Header from "../../component/header";
import { Button, Input, RightSlider, SummaryCard } from "@/components/base";
import { ADMIN_RFQS_ORDERS_FIGMA_FALLBACK } from "@/constants/adminFigmaFallbacks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/hooks/useAppSelector";
import adminService, {
  type AdminOrderRow,
  type AdminPagination,
  type AdminRfqsOrdersSummary,
} from "@/services/adminService";
import { fetchOrderDetail } from "@/services/orderService";
import type { Order } from "@/types/order";
import { ORDER_STATUS_LABELS } from "@/types/order";

const POLL_INTERVAL_MS = 30_000;
const PAGE_SIZE = 20;

const FIGMA_DETAIL_FALLBACK = {
  distributorName: "Oluwatobiloba Babatunde",
  distributorPhone: "08130000000",
  distributorEmail: "oluwatunde@gmail.com",
  productName: "The name of the product",
  quantity: "12",
  unitPrice: 60028,
  totalPrice: 780070,
  orderDateTime: "12/09/2025 - 12:20am",
  requestDate: "12/09/2025",
} as const;

const EMPTY_SUMMARY: AdminRfqsOrdersSummary = {
  rfqs: { totalRequests: 0, totalQuotesSent: 0 },
  orders: {
    total: 0,
    createdPendingPayment: 0,
    cancelledPrePayment: 0,
    processing: 0,
    shipped: 0,
    deliveredCompleted: 0,
  },
};

const emptyPage = <T,>(): AdminPagination<T> => ({
  docs: [],
  totalDocs: 0,
  limit: PAGE_SIZE,
  totalPages: 1,
  page: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
});

const moneyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const wholeNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const decimalNumberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value?: number | null): string {
  if (typeof value !== "number") return "Not available";
  return moneyFormatter.format(value);
}

function formatDate(value?: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-GB");
}

function formatDateTimeUtc(value?: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  const hours24 = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const period = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 || 12;

  return `${day}/${month}/${year} - ${hours12}:${minutes}${period}`;
}

function formatWholeNumber(value?: number | null): string {
  return typeof value === "number" ? wholeNumberFormatter.format(value) : "0";
}

function formatDecimalNumber(value?: number | null): string {
  return typeof value === "number" ? decimalNumberFormatter.format(value) : "0.00";
}

function formatQuantity(value?: number | null): string {
  return typeof value === "number" ? String(value) : "Not available";
}

function pickFirstText(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function presentText(value: string | undefined, fallback: string): string {
  return value && value !== "Not available" ? value : fallback;
}

function presentDateTime(
  value?: string | null,
  fallback = FIGMA_DETAIL_FALLBACK.orderDateTime
): string {
  const formatted = formatDateTimeUtc(value);
  return formatted !== "Not available" ? formatted : fallback;
}

type StatusTone = "warning" | "success" | "danger" | "primary";

function getOrderStatusTone(status: string): StatusTone {
  if (status === "delivered" || status === "completed") return "success";
  if (status === "shipped") return "primary";
  if (status === "cancelled_pre_payment") return "danger";
  return "warning";
}

function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    created_pending_payment: "Pending",
    cancelled_pre_payment: "Cancelled",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    completed: "Delivered",
  };
  return labels[status] ?? ORDER_STATUS_LABELS[status] ?? status;
}

function getOrderPaymentStatus(order?: Order): string {
  if (order?.paymentStatus) return order.paymentStatus;
  if (order?.status && order.status !== "created_pending_payment") return "YES";
  return "Not available";
}

function getOrderProposedDeliveryDate(order?: Order): string {
  return formatDate(order?.proposedDeliveryDate ?? order?.createdAt);
}

function getOrderProductName(order?: Order, fallback = "Not available"): string {
  const item = order?.items?.[0];
  if (!item) return fallback;
  if (item.product && typeof item.product === "object") return item.product.name;
  return item.productName || fallback;
}

interface UserRef {
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  distributorStoreProfile?: { businessName?: string };
}

function isUserRef(value: unknown): value is UserRef {
  return Boolean(value && typeof value === "object" && "email" in value);
}

function getUserName(value: unknown, fallback = "Not available"): string {
  if (!isUserRef(value)) return fallback;
  return (
    value.distributorStoreProfile?.businessName?.trim() ||
    value.businessName?.trim() ||
    `${value.firstName ?? ""} ${value.lastName ?? ""}`.trim() ||
    value.email ||
    fallback
  );
}

function getUserEmail(
  value: unknown,
  fallback = FIGMA_DETAIL_FALLBACK.distributorEmail
): string {
  return isUserRef(value) && value.email ? value.email : fallback;
}

function getUserPhone(
  value: unknown,
  fallback = FIGMA_DETAIL_FALLBACK.distributorPhone
): string {
  return isUserRef(value) && value.phoneNumber ? value.phoneNumber : fallback;
}

function AdminDateChip({ label }: { label: string }) {
  return (
    <div className="inline-flex h-[60px] items-center gap-4 rounded-[18px] border border-gray5 bg-white px-5 text-[15px] font-medium text-gray1">
      <span>{label}</span>
      <CalendarDays size={18} className="text-gray2" />
    </div>
  );
}

type StatusToneProps = { children: ReactNode; tone?: StatusTone };

function StatusText({ children, tone = "warning" }: StatusToneProps) {
  const className =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-danger"
        : tone === "primary"
          ? "text-primary"
          : "text-warning";
  return <span className={`text-base font-normal ${className}`}>{children}</span>;
}

function PlainAction({
  children,
  icon,
  onClick,
  tone = "primary",
}: {
  children: ReactNode;
  icon: ReactNode;
  onClick?: () => void;
  tone?: "primary" | "success" | "muted";
}) {
  const toneClass =
    tone === "success" ? "text-success" : tone === "muted" ? "text-gray3" : "text-primary";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center gap-2 text-base font-medium ${toneClass} disabled:cursor-not-allowed`}
    >
      {icon}
      {children}
    </button>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-16 text-center text-gray3">
        No records match the current filters.
      </TableCell>
    </TableRow>
  );
}

function DetailField({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-normal leading-5 text-gray3">{label}</p>
      <p className="break-words text-base font-normal leading-6 text-gray1">
        {value || "Not available"}
      </p>
    </div>
  );
}

function DetailStatusBanner({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#FFE079] bg-[#FFF6D9] px-6 py-4 sm:px-8 sm:py-5">
      <p className="text-sm font-medium text-[#272B36] sm:text-lg">{label}</p>
      <span className="inline-flex rounded-lg bg-[#FFC000] px-4 py-2 text-sm font-normal text-white sm:px-[18px] sm:py-[11px] sm:text-lg">
        {value}
      </span>
    </div>
  );
}

type DetailTarget = { kind: "order"; row: AdminOrderRow };
type DetailData = { kind: "order"; data: Order };

export default function AdminOrdersPage() {
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [ordersPage, setOrdersPage] = useState<AdminPagination<AdminOrderRow>>(
    emptyPage<AdminOrderRow>()
  );
  const [draftFilters, setDraftFilters] = useState({ productName: "", distributorName: "" });
  const [appliedFilters, setAppliedFilters] = useState(draftFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    const params = {
      productName: appliedFilters.productName.trim() || undefined,
      distributorName: appliedFilters.distributorName.trim() || undefined,
      page,
      limit: PAGE_SIZE,
    };
    try {
      const [nextSummary, nextOrders] = await Promise.all([
        adminService.getRfqsOrdersSummary(token),
        adminService.getOrders(token, params),
      ]);
      setSummary(nextSummary);
      setOrdersPage(nextOrders as AdminPagination<AdminOrderRow>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, token]);

  useEffect(() => {
    if (!token) return;
    const initialId = window.setTimeout(() => void loadData(), 0);
    const intervalId = window.setInterval(() => void loadData(), POLL_INTERVAL_MS);
    const onFocus = () => void loadData();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(initialId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadData, token]);

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  };

  const openDetail = async (target: DetailTarget) => {
    setDetailTarget(target);
    setDetailData(null);
    setDetailError("");
    if (!token) return;
    setDetailLoading(true);
    try {
      const response = await fetchOrderDetail(token, target.row.id);
      setDetailData({ kind: "order", data: response.data });
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Unable to load order detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailTarget(null);
    setDetailData(null);
    setDetailError("");
  };

  return (
    <div>
      <Header
        title="RFQs and Orders"
        description="View all RFQs and orders on the platform"
      />

      <div className="space-y-4 p-5 pt-2 lg:p-6 lg:pt-2">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <AdminDateChip label={ADMIN_RFQS_ORDERS_FIGMA_FALLBACK.dateRangeLabel} />

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total pending orders"
            value={formatWholeNumber(summary.orders.createdPendingPayment)}
            icon={<UsersRound size={18} className="text-primary" />}
            iconBg="bg-[#E7F1FF]"
          />
          <SummaryCard
            title="Total processing orders"
            value={formatWholeNumber(summary.orders.processing)}
            icon={<ClipboardList size={18} className="text-[#C04FE0]" />}
            iconBg="bg-[#F8E8FF]"
          />
          <SummaryCard
            title="Total delivered/completed"
            value={formatWholeNumber(summary.orders.deliveredCompleted)}
            icon={<ClipboardList size={18} className="text-[#F6B90A]" />}
            iconBg="bg-[#FFF5DB]"
          />
        </div>

        <section className="rounded-2xl border border-gray5 bg-white p-5">
          <h3 className="text-xl font-semibold leading-8 text-gray1">All Orders requested</h3>
          <p className="mt-6 text-sm font-medium text-gray2">Filter table list by:</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-[250px_250px_auto]">
            <Input
              label="Product name"
              placeholder="Enter product name"
              value={draftFilters.productName}
              onChange={(e) =>
                setDraftFilters((prev) => ({ ...prev, productName: e.target.value }))
              }
            />
            <Input
              label="Distributor name"
              placeholder="Enter distributor name"
              value={draftFilters.distributorName}
              onChange={(e) =>
                setDraftFilters((prev) => ({ ...prev, distributorName: e.target.value }))
              }
            />
            <Button
              title="Filter"
              iconLeft={<Filter size={16} />}
              className="h-[60px] rounded-[14px] lg:self-end"
              type="button"
              onClick={applyFilters}
              isBusy={loading}
            />
          </div>

          <div className="mt-6 overflow-x-auto overflow-y-hidden">
            <Table className="min-w-[1080px]">
              <TableHeader className="[&_tr]:bg-white">
                <TableRow>
                  <TableHead>Buyer&apos;s name</TableHead>
                  <TableHead>Product&apos;s name</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit price</TableHead>
                  <TableHead>Total price</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersPage.docs.length === 0 ? (
                  <EmptyRow colSpan={8} />
                ) : (
                  ordersPage.docs.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="min-w-[180px]">
                        <div className="flex items-center gap-3">
                          <span className="size-8 shrink-0 rounded-full bg-gray5" />
                          <span className="font-medium text-gray1">{row.distributorName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{row.productName}</TableCell>
                      <TableCell>{formatQuantity(row.quantity)}</TableCell>
                      <TableCell>{formatMoney(row.unitPrice)}</TableCell>
                      <TableCell>{formatMoney(row.totalPrice)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(row.date)}</TableCell>
                      <TableCell>
                        <StatusText tone={getOrderStatusTone(row.status)}>
                          {getOrderStatusLabel(row.status)}
                        </StatusText>
                      </TableCell>
                      <TableCell>
                        <PlainAction
                          icon={<Eye size={16} />}
                          onClick={() => void openDetail({ kind: "order", row })}
                          tone="success"
                        >
                          View
                        </PlainAction>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <div className="flex items-center justify-between text-sm text-gray3">
          <span>
            Page {ordersPage.page} of {ordersPage.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              title="Previous"
              variant="secondaryLight"
              size="sm"
              disabled={!ordersPage.hasPreviousPage}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="w-auto"
            />
            <Button
              title="Next"
              size="sm"
              disabled={!ordersPage.hasNextPage}
              onClick={() => setPage((prev) => prev + 1)}
              className="w-auto"
            />
          </div>
        </div>
      </div>

      <RightSlider
        title="Order Details"
        open={Boolean(detailTarget)}
        onClose={closeDetail}
        contentClassName="left-0 right-0 w-screen max-w-none overflow-y-auto [&>button]:!right-10 [&>button]:!top-[34px] [&_[data-slot=sheet-header]]:!h-[93px] [&_[data-slot=sheet-header]]:!justify-start [&_[data-slot=sheet-header]]:!px-5 [&_[data-slot=sheet-header]]:!pb-0 [&_[data-slot=sheet-header]]:!pt-9 sm:left-auto sm:right-0 sm:w-full sm:max-w-[500px] sm:[&_[data-slot=sheet-header]]:!px-10"
        bodyClassName="px-5 pb-10 pt-6 sm:px-10 sm:pt-10"
      >
        {detailLoading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Loader2 className="animate-spin text-gray3" size={28} />
          </div>
        ) : detailTarget ? (
          <OrderDetailPanel
            row={detailTarget.row}
            order={detailData?.kind === "order" ? detailData.data : undefined}
            error={detailError}
          />
        ) : null}
      </RightSlider>
    </div>
  );
}

function OrderDetailPanel({
  row,
  order,
  error,
}: {
  row: AdminOrderRow;
  order?: Order;
  error: string;
}) {
  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <DetailStatusBanner
        label="Request Status"
        value={order ? getOrderStatusLabel(order.status) : getOrderStatusLabel(row.status)}
      />
      <DetailField
        label="Distributor's name"
        value={getUserName(
          order?.seller,
          row.distributorName || FIGMA_DETAIL_FALLBACK.distributorName
        )}
      />
      <DetailField label="Distributor's phone number" value={getUserPhone(order?.seller)} />
      <DetailField label="Distributor's email" value={getUserEmail(order?.seller)} />
      <DetailField
        label="Product name"
        value={getOrderProductName(order, row.productName || FIGMA_DETAIL_FALLBACK.productName)}
      />
      <DetailField
        label="Quantity"
        value={presentText(
          formatQuantity(order?.items?.[0]?.quantity ?? row.quantity),
          FIGMA_DETAIL_FALLBACK.quantity
        )}
      />
      <DetailField
        label="Unit price"
        value={formatMoney(row.unitPrice ?? FIGMA_DETAIL_FALLBACK.unitPrice)}
      />
      <DetailField
        label="Total price"
        value={formatMoney(order?.totalPrice ?? row.totalPrice ?? FIGMA_DETAIL_FALLBACK.totalPrice)}
      />
      <DetailField
        label="Date of order placed"
        value={presentDateTime(order?.createdAt ?? row.date)}
      />
      <DetailField label="Proposed delivery date" value={getOrderProposedDeliveryDate(order)} />
      <DetailField
        label="Payment status"
        value={<span className="text-success">{getOrderPaymentStatus(order)}</span>}
      />
      <DetailField
        label="Additional note"
        value={
          pickFirstText(order?.items?.[0]?.notes, order?.cancellationReason) ?? "Not available"
        }
      />
    </div>
  );
}
