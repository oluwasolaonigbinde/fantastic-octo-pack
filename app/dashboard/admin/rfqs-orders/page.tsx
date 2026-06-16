"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CircleDollarSign,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Filter,
  Loader2,
  UsersRound,
} from "lucide-react";

import Header from "../../component/header";
import { Button, Input, RightSlider, SummaryCard } from "@/components/base";
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
  type AdminQuoteRow,
  type AdminRfqRow,
  type AdminRfqsOrdersSummary,
} from "@/services/adminService";
import { fetchOrderDetail } from "@/services/orderService";
import { fetchQuoteDetail, fetchRfqDetail } from "@/services/rfqService";
import type { Order } from "@/types/order";
import { ORDER_STATUS_LABELS } from "@/types/order";
import type { Quote, Rfq, RfqDetailResponse, UserRef } from "@/types/rfq";
import { QUOTE_STATUS_LABELS, RFQ_STATUS_LABELS } from "@/types/rfq";

const POLL_INTERVAL_MS = 30_000;
const PAGE_SIZE = 20;
const FIELD_PENDING = "Pending backend field";
const ORDER_DATE_DURATION_FALLBACK = "1 week";

type TopTab = "rfqs" | "orders";
type RfqSubTab = "requests" | "quotes";
type DetailTarget =
  | { kind: "rfq"; row: AdminRfqRow }
  | { kind: "quote"; row: AdminQuoteRow }
  | { kind: "order"; row: AdminOrderRow };
type DetailData =
  | { kind: "rfq"; data: RfqDetailResponse }
  | { kind: "quote"; data: Quote }
  | { kind: "order"; data: Order };

const EMPTY_SUMMARY: AdminRfqsOrdersSummary = {
  rfqs: {
    totalRequests: 0,
    totalQuotesSent: 0,
  },
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

function formatOrderTableDate(value?: string | null): string {
  const formattedDate = formatDate(value);
  if (formattedDate === "Not available") return formattedDate;
  return `${formattedDate} (${ORDER_DATE_DURATION_FALLBACK})`;
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

function isUserRef(value: unknown): value is UserRef {
  return Boolean(value && typeof value === "object" && "email" in value);
}

function getUserName(value: unknown, fallback = "Not available"): string {
  if (!isUserRef(value)) return fallback;
  return (
    value.distributorStoreProfile?.businessName?.trim() ||
    value.businessName?.trim() ||
    `${value.firstName ?? ""} ${value.lastName ?? ""}`.trim() ||
    value.email
  );
}

function getUserEmail(value: unknown): string {
  return isUserRef(value) ? value.email : "Not available";
}

function getUserPhone(value: unknown): string {
  return isUserRef(value) && value.phoneNumber ? value.phoneNumber : FIELD_PENDING;
}

function getFirstRfqItem(rfq?: Rfq) {
  return rfq?.items?.[0];
}

function getItemProductName(rfq?: Rfq, fallback = "Not available"): string {
  const item = getFirstRfqItem(rfq);
  if (!item) return fallback;
  if (item.product && typeof item.product === "object") return item.product.name;
  return item.productName || fallback;
}

function getItemUnitPrice(rfq?: Rfq, fallback?: number | null): string {
  const item = getFirstRfqItem(rfq);
  if (item?.product && typeof item.product === "object") {
    return formatMoney(item.product.pricePerUnit ?? fallback);
  }
  return formatMoney(fallback);
}

function getOrderProductName(order?: Order, fallback = "Not available"): string {
  const item = order?.items?.[0];
  if (!item) return fallback;
  if (item.product && typeof item.product === "object") return item.product.name;
  return item.productName || fallback;
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

type StatusTone = "warning" | "success" | "danger" | "primary";

function StatusText({ children, tone = "warning" }: { children: ReactNode; tone?: StatusTone }) {
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

function getOrderStatusTone(status: string): StatusTone {
  if (status === "delivered" || status === "completed") return "success";
  if (status === "shipped") return "primary";
  if (status === "cancelled_pre_payment") return "danger";
  return "warning";
}

function getOrderStatusLabel(status: string): string {
  const adminLabels: Record<string, string> = {
    created_pending_payment: "Pending",
    cancelled_pre_payment: "Cancelled",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    completed: "Delivered",
  };

  return adminLabels[status] ?? ORDER_STATUS_LABELS[status] ?? status;
}

function getOrderPaymentStatus(order?: Order): string {
  if (order?.paymentStatus) return order.paymentStatus;
  return order?.status && order.status !== "created_pending_payment" ? "YES" : "NO";
}

function getOrderProposedDeliveryDate(order?: Order): string {
  return formatDate(order?.proposedDeliveryDate ?? order?.createdAt);
}

export default function AdminRfqsOrdersPage() {
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);
  const [topTab, setTopTab] = useState<TopTab>("rfqs");
  const [rfqSub, setRfqSub] = useState<RfqSubTab>("requests");
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [rfqsPage, setRfqsPage] = useState<AdminPagination<AdminRfqRow>>(
    emptyPage<AdminRfqRow>()
  );
  const [quotesPage, setQuotesPage] = useState<AdminPagination<AdminQuoteRow>>(
    emptyPage<AdminQuoteRow>()
  );
  const [ordersPage, setOrdersPage] = useState<AdminPagination<AdminOrderRow>>(
    emptyPage<AdminOrderRow>()
  );
  const [draftFilters, setDraftFilters] = useState({
    productName: "",
    distributorName: "",
  });
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
      const [nextSummary, nextPage] = await Promise.all([
        adminService.getRfqsOrdersSummary(token),
        topTab === "orders"
          ? adminService.getOrders(token, params)
          : rfqSub === "quotes"
            ? adminService.getQuotes(token, params)
            : adminService.getRfqs(token, params),
      ]);

      setSummary(nextSummary);
      if (topTab === "orders") {
        setOrdersPage(nextPage as AdminPagination<AdminOrderRow>);
      } else if (rfqSub === "quotes") {
        setQuotesPage(nextPage as AdminPagination<AdminQuoteRow>);
      } else {
        setRfqsPage(nextPage as AdminPagination<AdminRfqRow>);
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to load RFQs and orders."
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, rfqSub, token, topTab]);

  useEffect(() => {
    if (!token) return;

    const initialLoadId = window.setTimeout(() => void loadData(), 0);
    const intervalId = window.setInterval(() => void loadData(), POLL_INTERVAL_MS);
    const onFocus = () => void loadData();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadData, token]);

  const activePage =
    topTab === "orders" ? ordersPage : rfqSub === "quotes" ? quotesPage : rfqsPage;

  const detailTitle = useMemo(() => {
    if (!detailTarget) return "Details";
    if (detailTarget.kind === "rfq") return "RFQ Details";
    if (detailTarget.kind === "quote") return "Quote Details";
    return "Order Details";
  }, [detailTarget]);

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
      if (target.kind === "rfq") {
        const response = await fetchRfqDetail(token, target.row.id);
        setDetailData({ kind: "rfq", data: response.data });
      } else if (target.kind === "quote") {
        const response = await fetchQuoteDetail(token, target.row.id);
        setDetailData({ kind: "quote", data: response.data });
      } else {
        const response = await fetchOrderDetail(token, target.row.id);
        setDetailData({ kind: "order", data: response.data });
      }
    } catch (nextError) {
      setDetailError(
        nextError instanceof Error ? nextError.message : "Unable to load detail."
      );
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

        <div className="grid h-14 grid-cols-2 gap-3 overflow-hidden border-b border-gray6 lg:gap-0">
          {(
            [
              ["rfqs", "RFQs"],
              ["orders", "Orders"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTopTab(key);
                setPage(1);
              }}
              className={`h-14 text-center text-base font-normal transition lg:rounded-none ${
                topTab === key
                  ? "rounded-lg bg-gray5 text-gray2 lg:bg-primary lg:text-white"
                  : "bg-gray7 text-gray1 hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {topTab === "rfqs" && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <SummaryCard
                title="Total request for quote"
                value={String(summary.rfqs.totalRequests)}
                icon={<FileText size={18} className="text-primary" />}
                iconBg="bg-[#E7F1FF]"
                className="rounded-2xl"
              />
              <SummaryCard
                title="Total quote sent"
                value={String(summary.rfqs.totalQuotesSent)}
                icon={<FileText size={18} className="text-[#E07B00]" />}
                iconBg="bg-[#FFF3E0]"
                className="rounded-2xl"
              />
            </div>

            <div className="flex overflow-x-auto border-b border-gray5">
              {(
                [
                  ["requests", "Request For Quotes"],
                  ["quotes", "Quotes Sent"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setRfqSub(key);
                    setPage(1);
                  }}
                  className={`shrink-0 pb-4 pr-5 text-base font-medium transition first:pl-0 sm:text-xl lg:text-base ${
                    rfqSub === key
                      ? "border-b-2 border-primary text-primary"
                      : "text-gray3 hover:text-gray1"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <section className="rounded-2xl border border-gray5 bg-white p-5 lg:min-h-[1180px]">
              <h3 className="text-xl font-semibold leading-8 text-gray1">
                {rfqSub === "quotes" ? "All Quotes Sent" : "All Request For Quotes"}
              </h3>
              <p className="mt-6 text-sm font-medium text-gray2">
                Filter table list by:
              </p>
              <div className="mt-3 grid gap-3 lg:grid-cols-[250px_250px_250px]">
                <Input
                  label="Product name"
                  placeholder="Enter product name"
                  value={draftFilters.productName}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      productName: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Distributor name"
                  placeholder="Enter distributor name"
                  value={draftFilters.distributorName}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      distributorName: event.target.value,
                    }))
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
                  <TableHeader>
                    <TableRow>
                      <TableHead>Distributors&apos; name</TableHead>
                      <TableHead>Product&apos;s name</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit price</TableHead>
                      <TableHead>Total price</TableHead>
                      <TableHead>
                        {rfqSub === "quotes" ? "Date received" : "Delivery time"}
                      </TableHead>
                      {rfqSub === "requests" && <TableHead>Status</TableHead>}
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfqSub === "requests" &&
                      (rfqsPage.docs.length === 0 ? (
                        <EmptyRow colSpan={8} />
                      ) : (
                        rfqsPage.docs.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="min-w-[180px]">
                              <div className="flex items-center gap-3">
                                <span className="size-8 shrink-0 rounded-full bg-gray5" />
                                <span className="font-medium text-gray1">
                                  {row.distributorName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{row.productName}</TableCell>
                            <TableCell>{formatQuantity(row.quantity)}</TableCell>
                            <TableCell>{formatMoney(row.unitPrice)}</TableCell>
                            <TableCell>{formatMoney(row.totalPrice)}</TableCell>
                            <TableCell>{row.deliveryTime ?? "Not available"}</TableCell>
                            <TableCell>
                              <StatusText>
                                {RFQ_STATUS_LABELS[row.status] ?? row.status}
                              </StatusText>
                            </TableCell>
                            <TableCell>
                              <PlainAction
                                icon={<Eye size={16} />}
                                onClick={() => void openDetail({ kind: "rfq", row })}
                                tone="success"
                              >
                                View
                              </PlainAction>
                            </TableCell>
                          </TableRow>
                        ))
                      ))}

                    {rfqSub === "quotes" &&
                      (quotesPage.docs.length === 0 ? (
                        <EmptyRow colSpan={7} />
                      ) : (
                        quotesPage.docs.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="min-w-[180px]">
                              <div className="flex items-center gap-3">
                                <span className="size-8 shrink-0 rounded-full bg-gray5" />
                                <span className="font-medium text-gray1">
                                  {row.distributorName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{row.productName}</TableCell>
                            <TableCell>{formatQuantity(row.quantity)}</TableCell>
                            <TableCell>{formatMoney(row.unitPrice)}</TableCell>
                            <TableCell>{formatMoney(row.totalPrice)}</TableCell>
                            <TableCell>{formatDate(row.dateReceived)}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-4">
                                <PlainAction
                                  icon={<Eye size={16} />}
                                  onClick={() => void openDetail({ kind: "quote", row })}
                                >
                                  View
                                </PlainAction>
                                {row.downloadUrl ? (
                                  <a
                                    href={row.downloadUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-base font-medium text-success"
                                  >
                                    <Download size={16} />
                                    Download
                                  </a>
                                ) : (
                                  <PlainAction icon={<Download size={16} />} tone="success">
                                    Download
                                  </PlainAction>
                                )}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </>
        )}

        {topTab === "orders" && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                title="Total shipped orders"
                value={formatDecimalNumber(summary.orders.shipped)}
                icon={<CircleDollarSign size={18} className="text-[#13A83B]" />}
                iconBg="bg-[#E8FAEE]"
              />
              <SummaryCard
                title="Total delivered/completed"
                value={formatWholeNumber(summary.orders.deliveredCompleted)}
                icon={<ClipboardList size={18} className="text-[#F6B90A]" />}
                iconBg="bg-[#FFF5DB]"
              />
            </div>

            <section className="rounded-2xl border border-gray5 bg-white p-5 lg:min-h-[1110px]">
              <h3 className="text-xl font-semibold leading-8 text-gray1">
                All Orders requested
              </h3>
              <p className="mt-6 text-sm font-medium text-gray2">
                Filter table list by:
              </p>
              <div className="mt-3 grid gap-3 lg:grid-cols-[250px_250px_250px]">
                <Input
                  label="Product name"
                  placeholder="Enter product name"
                  value={draftFilters.productName}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      productName: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Distributor name"
                  placeholder="Enter distributor name"
                  value={draftFilters.distributorName}
                  onChange={(event) =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      distributorName: event.target.value,
                    }))
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
                      <TableHead>Distributors&apos; name</TableHead>
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
                              <span className="font-medium text-gray1">
                                {row.distributorName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{row.productName}</TableCell>
                          <TableCell>{formatQuantity(row.quantity)}</TableCell>
                          <TableCell>{formatMoney(row.unitPrice)}</TableCell>
                          <TableCell>{formatMoney(row.totalPrice)}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatOrderTableDate(row.date)}
                          </TableCell>
                          <TableCell>
                            <StatusText tone={getOrderStatusTone(row.status)}>
                              {getOrderStatusLabel(row.status)}
                            </StatusText>
                          </TableCell>
                          <TableCell>
                            <PlainAction
                              icon={<Eye size={16} />}
                              onClick={() => void openDetail({ kind: "order", row })}
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
          </>
        )}

        <div className="flex items-center justify-between text-sm text-gray3">
          <span>
            Page {activePage.page} of {activePage.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              title="Previous"
              variant="secondaryLight"
              size="sm"
              disabled={!activePage.hasPreviousPage}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="w-auto"
            />
            <Button
              title="Next"
              size="sm"
              disabled={!activePage.hasNextPage}
              onClick={() => setPage((prev) => prev + 1)}
              className="w-auto"
            />
          </div>
        </div>
      </div>

      <RightSlider
        title={detailTitle}
        open={Boolean(detailTarget)}
        onClose={closeDetail}
        contentClassName="left-0 right-0 w-screen max-w-none overflow-y-auto [&>button]:!right-10 [&>button]:!top-[34px] [&_[data-slot=sheet-header]]:!h-[93px] [&_[data-slot=sheet-header]]:!justify-start [&_[data-slot=sheet-header]]:!px-5 [&_[data-slot=sheet-header]]:!pb-0 [&_[data-slot=sheet-header]]:!pt-9 sm:left-auto sm:right-0 sm:w-full sm:max-w-[500px] sm:[&_[data-slot=sheet-header]]:!px-10"
        bodyClassName="px-5 pb-10 pt-6 sm:px-10 sm:pt-10"
      >
        {detailLoading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Loader2 className="animate-spin text-gray3" size={28} />
          </div>
        ) : (
          <DetailPanel
            target={detailTarget}
            data={detailData}
            error={detailError}
          />
        )}
      </RightSlider>
    </div>
  );
}

function DetailPanel({
  target,
  data,
  error,
}: {
  target: DetailTarget | null;
  data: DetailData | null;
  error: string;
}) {
  if (!target) return null;

  if (target.kind === "rfq") {
    const rfq = data?.kind === "rfq" ? data.data.rfq : undefined;
    const distributor = rfq?.targetDistributors?.[0];

    return (
      <div className="space-y-6">
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <DetailStatusBanner
          label="Request Status"
          value={rfq ? RFQ_STATUS_LABELS[rfq.status] ?? rfq.status : RFQ_STATUS_LABELS[target.row.status] ?? target.row.status}
        />
        <DetailField
          label="Distributor's name"
          value={getUserName(distributor, target.row.distributorName)}
        />
        <DetailField label="Distributor's phone number" value={getUserPhone(distributor)} />
        <DetailField label="Distributor's email" value={getUserEmail(distributor)} />
        <DetailField
          label="Product name"
          value={getItemProductName(rfq, target.row.productName)}
        />
        <DetailField
          label="Quantity"
          value={formatQuantity(getFirstRfqItem(rfq)?.quantity ?? target.row.quantity)}
        />
        <DetailField
          label="Unit price"
          value={getItemUnitPrice(rfq, target.row.unitPrice)}
        />
        <DetailField label="Total price" value={formatMoney(target.row.totalPrice)} />
        <DetailField
          label="Date of request"
          value={formatDate(rfq?.createdAt ?? target.row.createdAt)}
        />
        <DetailField
          label="Proposed delivery date"
          value={rfq?.deliveryLocation || target.row.deliveryTime || FIELD_PENDING}
        />
        <DetailField
          label="Additional note"
          value={rfq?.additionalNotes || getFirstRfqItem(rfq)?.notes || "No additional note."}
        />
      </div>
    );
  }

  if (target.kind === "quote") {
    const quote = data?.kind === "quote" ? data.data : undefined;
    const rfq = quote && typeof quote.rfq === "object" ? quote.rfq : undefined;

    return (
      <div className="space-y-6">
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <DetailStatusBanner
          label="Quote Status"
          value={quote ? QUOTE_STATUS_LABELS[quote.status] ?? quote.status : "Responded"}
        />
        <DetailField
          label="Distributor's name"
          value={getUserName(quote?.distributor, target.row.distributorName)}
        />
        <DetailField label="Distributor's phone number" value={getUserPhone(quote?.distributor)} />
        <DetailField label="Distributor's email" value={getUserEmail(quote?.distributor)} />
        <DetailField
          label="Product name"
          value={getItemProductName(rfq, target.row.productName)}
        />
        <DetailField
          label="Quantity"
          value={formatQuantity(quote?.quantity ?? target.row.quantity)}
        />
        <DetailField
          label="Unit price"
          value={formatMoney(quote?.pricePerUnit ?? target.row.unitPrice)}
        />
        <DetailField
          label="Total price"
          value={formatMoney(quote?.totalPrice ?? target.row.totalPrice)}
        />
        <DetailField
          label="Date received"
          value={formatDate(quote?.updatedAt ?? target.row.dateReceived)}
        />
        <DetailField
          label="Proposed delivery date"
          value={quote?.leadTimeDays ? `${quote.leadTimeDays} days` : FIELD_PENDING}
        />
        <DetailField label="Additional note" value={quote?.notes || quote?.terms || "No additional note."} />
      </div>
    );
  }

  const order = data?.kind === "order" ? data.data : undefined;

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <DetailStatusBanner
        label="Request Status"
        value={order ? getOrderStatusLabel(order.status) : getOrderStatusLabel(target.row.status)}
      />
      <DetailField
        label="Distributor's name"
        value={getUserName(order?.seller, target.row.distributorName)}
      />
      <DetailField label="Distributor's phone number" value={getUserPhone(order?.seller)} />
      <DetailField label="Distributor's email" value={getUserEmail(order?.seller)} />
      <DetailField
        label="Product name"
        value={getOrderProductName(order, target.row.productName)}
      />
      <DetailField
        label="Quantity"
        value={formatQuantity(order?.items?.[0]?.quantity ?? target.row.quantity)}
      />
      <DetailField label="Unit price" value={formatMoney(target.row.unitPrice)} />
      <DetailField
        label="Total price"
        value={formatMoney(order?.totalPrice ?? target.row.totalPrice)}
      />
      <DetailField
        label="Date of order placed"
        value={formatDate(order?.createdAt ?? target.row.date)}
      />
      <DetailField
        label="Proposed delivery date"
        value={getOrderProposedDeliveryDate(order)}
      />
      <DetailField
        label="Payment status"
        value={
          <span className="text-success">
            {getOrderPaymentStatus(order)}
          </span>
        }
      />
      <DetailField
        label="Additional note"
        value={order?.items?.[0]?.notes || order?.cancellationReason || "No additional note."}
      />
    </div>
  );
}
