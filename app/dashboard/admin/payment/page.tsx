"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CreditCard, Eye, Filter, Wallet } from "lucide-react";
import Header from "../../component/header";
import { Button, Input, SummaryCard } from "@/components/base";
import { ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK } from "@/constants/adminFigmaFallbacks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/hooks/useAppSelector";
import orderService from "@/services/orderService";
import paymentService from "@/services/paymentService";
import type { EscrowSummary } from "@/types/order";
import type {
  PaymentListPagination,
  PaymentStatus,
  PaymentTransaction,
} from "@/types/payment";

const PAGE_SIZE = 20;
const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending_approval",
  "pending",
  "success",
  "failed",
  "rejected",
  "abandoned",
  "refunded",
];

const statusColor: Record<PaymentStatus, string> = {
  pending_approval: "text-warning",
  pending: "text-warning",
  success: "text-success",
  failed: "text-danger",
  rejected: "text-danger",
  abandoned: "text-gray3",
  refunded: "text-primary",
};

const statusLabel: Record<PaymentStatus, string> = {
  pending_approval: "Pending approval",
  pending: "Pending",
  success: "Successful",
  failed: "Failed",
  rejected: "Rejected",
  abandoned: "Abandoned",
  refunded: "Refunded",
};

const formatKobo = (amount?: number | null, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((amount ?? 0) / 100);

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("en-GB")} - ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};

const getPartyLabel = (party?: PaymentTransaction["payer"] | null) => {
  if (!party) return "-";
  const name = `${party.firstName ?? ""} ${party.lastName ?? ""}`.trim();
  return name || party.email || party._id;
};

const getMetadataText = (
  transaction: PaymentTransaction,
  keys: string[],
  fallback: string,
) => {
  const metadata = transaction.metadata;
  if (!metadata) return fallback;

  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return fallback;
};

const normalizePayments = (
  data: PaymentTransaction[] | PaymentListPagination,
): PaymentListPagination => {
  if (!Array.isArray(data)) return data;

  return {
    docs: data,
    totalDocs: data.length,
    limit: data.length || PAGE_SIZE,
    totalPages: 1,
    page: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    nextPage: null,
    previousPage: null,
  };
};

const buildPaymentDetailHref = (transaction: PaymentTransaction) => {
  const params = new URLSearchParams({
    paymentId: transaction._id,
    orderId: transaction.entityId,
    buyerId: getPartyLabel(transaction.payer),
    sellerId: getPartyLabel(transaction.payee),
    itemName: getMetadataText(
      transaction,
      ["productName", "itemName", "equipmentName", "serviceName"],
      transaction.intent.replace(/_/g, " "),
    ),
    amount: formatKobo(transaction.amount, transaction.currency),
    status: statusLabel[transaction.status],
    dateTime: formatDateTime(transaction.createdAt),
    reference: transaction.reference,
  });

  return `/dashboard/admin/payment/escrow-detail?${params.toString()}`;
};

export default function AdminPaymentPage() {
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);
  const [paymentsPage, setPaymentsPage] = useState<PaymentListPagination | null>(null);
  const [escrowSummary, setEscrowSummary] = useState<EscrowSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draftFilters, setDraftFilters] = useState({
    status: "",
    itemName: "",
    date: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(draftFilters);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;

    let ignore = false;

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const normalizedStatus = appliedFilters.status.trim().toLowerCase();
        const status = PAYMENT_STATUSES.includes(normalizedStatus as PaymentStatus)
          ? (normalizedStatus as PaymentStatus)
          : undefined;

        const [paymentsResponse, summaryResponse] = await Promise.all([
          paymentService.fetchPayments(token, {
            status,
            from: appliedFilters.date || undefined,
            to: appliedFilters.date || undefined,
            page,
            limit: PAGE_SIZE,
          }),
          orderService.fetchEscrowSummary(token),
        ]);

        if (ignore) return;

        setPaymentsPage(normalizePayments(paymentsResponse.data));
        setEscrowSummary(summaryResponse.data);
      } catch (nextError) {
        if (ignore) return;

        setError(
          nextError instanceof Error
            ? nextError.message
            : "Failed to load payment records.",
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    void loadData();

    return () => {
      ignore = true;
    };
  }, [appliedFilters, page, token]);

  const filteredPayments = useMemo(() => {
    const docs = paymentsPage?.docs ?? [];
    const itemSearch = appliedFilters.itemName.trim().toLowerCase();
    if (!itemSearch) return docs;

    return docs.filter((transaction) =>
      getMetadataText(
        transaction,
        ["productName", "itemName", "equipmentName", "serviceName"],
        transaction.intent,
      )
        .toLowerCase()
        .includes(itemSearch),
    );
  }, [appliedFilters.itemName, paymentsPage]);

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  };

  return (
    <div>
      <Header title="Payment" description="View and track all invoice payment" />

      <div className="space-y-8 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total ESCROW balance"
            value={
              escrowSummary
                ? formatKobo(escrowSummary.expectedNetKobo, escrowSummary.currency)
                : ADMIN_PAYMENT_INVOICE_FIGMA_FALLBACK.totalAmount
            }
            icon={<Wallet size={18} className="text-primary" />}
            iconBg="bg-[#E7F1FF]"
          />
          <SummaryCard
            title="Total pending disbursements"
            value="NGN 518,886.98 (10)"
            icon={<CreditCard size={18} className="text-[#C04FE0]" />}
            iconBg="bg-[#F8E8FF]"
          />
          <SummaryCard
            title="Total disbursements"
            value="NGN 410,032,800.00 (10)"
            icon={<CreditCard size={18} className="text-[#13A83B]" />}
            iconBg="bg-[#E8FAEE]"
          />
          <SummaryCard
            title="Processed refunds"
            value="NGN 108,998.09"
            icon={<CreditCard size={18} className="text-[#F6B90A]" />}
            iconBg="bg-[#FFF5DB]"
          />
        </div>

        <section className="card space-y-4">
          <h3 className="medium3 text-gray1">All Escrow Orders</h3>
          {error ? (
            <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray3">
            Filter table list by:
          </p>
          <div className="grid gap-3 lg:grid-cols-[1.5fr_1.5fr_1fr_auto]">
            <Input
              label="Escrow status"
              placeholder="pending, success, failed"
              value={draftFilters.status}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, status: event.target.value }))
              }
            />
            <Input
              label="Name of item"
              placeholder="Enter name of item"
              value={draftFilters.itemName}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, itemName: event.target.value }))
              }
            />
            <Input
              label="Date & time"
              type="date"
              value={draftFilters.date}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, date: event.target.value }))
              }
            />
            <Button
              title="Filter"
              iconLeft={<Filter size={16} />}
              className="self-end"
              type="button"
              onClick={applyFilters}
              isBusy={loading}
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Buyer ID</TableHead>
                  <TableHead>Seller ID</TableHead>
                  <TableHead>Name of item</TableHead>
                  <TableHead>Engineer ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date & time</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !paymentsPage ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-gray3">
                      Loading payment records...
                    </TableCell>
                  </TableRow>
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-gray3">
                      No payment records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell className="font-medium text-gray1">
                        {transaction.entityId}
                      </TableCell>
                      <TableCell>{getPartyLabel(transaction.payer)}</TableCell>
                      <TableCell>{getPartyLabel(transaction.payee)}</TableCell>
                      <TableCell>
                        {getMetadataText(
                          transaction,
                          ["productName", "itemName", "equipmentName", "serviceName"],
                          transaction.intent.replace(/_/g, " "),
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.intent === "service_payment"
                          ? getPartyLabel(transaction.payee)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-medium ${statusColor[transaction.status]}`}
                        >
                          {statusLabel[transaction.status]}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(transaction.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Link href={buildPaymentDetailHref(transaction)}>
                          <Button
                            title="View"
                            variant="primaryLight"
                            size="sm"
                            iconLeft={<Eye size={14} />}
                            className="w-auto"
                            type="button"
                          />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {paymentsPage ? (
            <div className="flex items-center justify-between text-sm text-gray3">
              <span>
                Page {paymentsPage.page} of {paymentsPage.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  title="Previous"
                  variant="secondaryLight"
                  size="sm"
                  disabled={!paymentsPage.hasPreviousPage}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="w-auto"
                />
                <Button
                  title="Next"
                  size="sm"
                  disabled={!paymentsPage.hasNextPage}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="w-auto"
                />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
