"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  Search,
  Wallet,
  XCircle,
} from "lucide-react";
import Header from "../../../component/header";
import { Button, Select, SummaryCard } from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useApproveWithdrawalMutation,
  useRejectWithdrawalMutation,
  useWithdrawalRequestsQuery,
} from "@/hooks/queries/payments";
import type { PaymentStatus, PaymentTransaction } from "@/types/payment";
import { PayoutDetailDrawer } from "./PayoutDetailDrawer";
import {
  formatDateTime,
  formatKobo,
  getAvailableBalanceKobo,
  getPayoutUser,
  getUserName,
  getUserType,
  isToday,
  payoutStatusClass,
  payoutStatusLabel,
} from "./payout-helpers";

const PAGE_SIZE = 10;
const SUMMARY_LIMIT = 200;

const STATUS_OPTIONS: { label: string; value: string; status?: PaymentStatus }[] = [
  { label: "Status: All", value: "all" },
  { label: "Pending", value: "pending", status: "pending_approval" },
  { label: "Approved", value: "approved", status: "success" },
  { label: "Rejected", value: "rejected", status: "rejected" },
];

const TABS = [
  { label: "Transaction", href: "/dashboard/admin/payment" },
  { label: "Escrow", href: "/dashboard/admin/payment" },
  { label: "Wallet", href: "/dashboard/admin/payment" },
  { label: "Payout Requests", href: "/dashboard/admin/payment/payouts", active: true },
];

const StatusPill = ({ status }: { status: PaymentStatus }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${payoutStatusClass(
      status,
    )}`}
  >
    {payoutStatusLabel[status]}
  </span>
);

export default function AdminPayoutRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PaymentTransaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedStatus = useMemo(
    () => STATUS_OPTIONS.find((option) => option.value === statusFilter)?.status,
    [statusFilter],
  );

  // Table data — paginated + status-filtered server side.
  const tableQuery = useWithdrawalRequestsQuery({
    status: selectedStatus,
    page,
    limit: PAGE_SIZE,
  });

  // Summary data — a wider unfiltered slice used to compute the header cards.
  const summaryQuery = useWithdrawalRequestsQuery({ limit: SUMMARY_LIMIT });

  const approveMutation = useApproveWithdrawalMutation();
  const rejectMutation = useRejectWithdrawalMutation();

  const pagination = tableQuery.data?.page;
  const rows = useMemo(() => {
    const docs = pagination?.docs ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return docs;
    return docs.filter((transaction) => {
      const user = getPayoutUser(transaction);
      const haystack = [
        getUserName(user),
        user?.email,
        transaction.reference,
        transaction.destinationBank?.bankName,
        transaction.destinationBank?.accountNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [pagination, search]);

  const summary = useMemo(() => {
    const docs = summaryQuery.data?.page.docs ?? [];
    const pending = docs.filter(
      (t) => t.status === "pending_approval" || t.status === "pending",
    );
    const pendingAmount = pending.reduce((sum, t) => sum + (t.amount ?? 0), 0);
    const approvedToday = docs.filter(
      (t) => t.status === "success" && isToday(t.updatedAt),
    ).length;
    const rejectedToday = docs.filter(
      (t) =>
        (t.status === "rejected" || t.status === "failed") && isToday(t.updatedAt),
    ).length;
    const currency = docs[0]?.currency ?? "NGN";
    return {
      pendingCount: pending.length,
      pendingAmount,
      approvedToday,
      rejectedToday,
      currency,
    };
  }, [summaryQuery.data]);

  const openDetail = (transaction: PaymentTransaction) => {
    setSelected(transaction);
    setDrawerOpen(true);
  };

  const handleApprove = async (transaction: PaymentTransaction) => {
    await approveMutation.mutateAsync(transaction._id);
  };

  const handleReject = async (transaction: PaymentTransaction, note: string) => {
    await rejectMutation.mutateAsync({
      transactionId: transaction._id,
      note: note || undefined,
    });
  };

  const errorMessage =
    tableQuery.error instanceof Error ? tableQuery.error.message : "";

  return (
    <div>
      <Header
        title="Payment and Commission"
        description="Review and approve withdrawal requests before funds are released."
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray5 bg-white p-1">
          {TABS.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                tab.active
                  ? "bg-primary text-white"
                  : "text-gray3 hover:bg-gray6"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div>
          <h2 className="medium3 text-gray1">Payout Requests</h2>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Pending Requests"
            value={String(summary.pendingCount)}
            icon={<ClipboardList size={18} className="text-primary" />}
            iconBg="bg-[#E7F1FF]"
          />
          <SummaryCard
            title="Approved Today"
            value={String(summary.approvedToday)}
            icon={<CheckCircle2 size={18} className="text-[#13A83B]" />}
            iconBg="bg-[#E8FAEE]"
          />
          <SummaryCard
            title="Rejected Today"
            value={String(summary.rejectedToday)}
            icon={<XCircle size={18} className="text-danger" />}
            iconBg="bg-[#FDE8E8]"
          />
          <SummaryCard
            title="Total Pending Amount"
            value={formatKobo(summary.pendingAmount, summary.currency)}
            subtitle="Live balance"
            icon={<Wallet size={18} className="text-primary" />}
            iconBg="bg-[#E7F1FF]"
            className="!bg-primary [&_*]:!text-white"
          />
        </div>

        {/* Table card */}
        <section className="card space-y-4">
          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray4"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search Requests (User, Reference, Bank...)"
                className="h-11 w-full rounded-xl border border-gray5 bg-transparent pl-9 pr-4 text-sm text-gray1 placeholder-gray4 focus:border-gray2 focus:outline-none"
              />
            </div>
            <Select
              label=""
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              options={STATUS_OPTIONS.map(({ label, value }) => ({ label, value }))}
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Available Balance</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-gray3">
                      Loading payout requests...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-gray3">
                      No payout requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((transaction) => {
                    const user = getPayoutUser(transaction);
                    const balance = getAvailableBalanceKobo(transaction);
                    const bank = transaction.destinationBank;
                    return (
                      <TableRow
                        key={transaction._id}
                        className="cursor-pointer"
                        onClick={() => openDetail(transaction)}
                      >
                        <TableCell className="whitespace-nowrap text-gray1">
                          {formatDateTime(transaction.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium text-gray1">
                          {getUserName(user)}
                        </TableCell>
                        <TableCell className="capitalize text-gray3">
                          {getUserType(transaction) ?? "-"}
                        </TableCell>
                        <TableCell className="font-medium text-gray1">
                          {formatKobo(transaction.amount, transaction.currency)}
                        </TableCell>
                        <TableCell className="text-gray3">
                          {balance !== undefined
                            ? formatKobo(balance, transaction.currency)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {bank ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray1">
                                {bank.bankName}
                              </span>
                              <span className="text-xs text-gray3">
                                ····{bank.accountNumber?.slice(-4)}
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusPill status={transaction.status} />
                        </TableCell>
                        <TableCell>
                          <Button
                            title="View"
                            variant="primaryLight"
                            size="sm"
                            iconLeft={<Eye size={14} />}
                            className="w-auto"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDetail(transaction);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {pagination ? (
            <div className="flex items-center justify-between text-sm text-gray3">
              <span>
                Showing {rows.length} of {pagination.totalDocs} requests
              </span>
              <div className="flex gap-2">
                <Button
                  title="Previous"
                  variant="secondaryLight"
                  size="sm"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="w-auto"
                />
                <span className="self-center px-2">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  title="Next"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="w-auto"
                />
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <PayoutDetailDrawer
        key={`${selected?._id ?? "none"}-${drawerOpen}`}
        transaction={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
