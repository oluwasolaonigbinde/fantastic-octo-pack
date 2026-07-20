"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Plus,
  PlusSquare,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import Header from "../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";
import { useWallet } from "@/hooks/useWallet";
import { useWalletTopup } from "@/hooks/useWalletTopup";
import { useEscrowSummary } from "@/hooks/useEscrowSummary";
import { useMyPayments } from "@/hooks/usePayments";
import {
  TopUpDrawer,
  TopUpReturnBanner,
} from "@/components/wallet/wallet-topup";
import { PayoutDialog } from "@/components/wallet/payout-dialog";
import { formatKobo, formatNaira, koboToNaira } from "@/lib/wallet-format";
import {
  channelLabel,
  formatTransactionDateTime,
  intentLabel,
  statusColor,
} from "@/lib/payment-display";

export default function EngineerWallet() {
  const { wallet, isLoading: walletLoading } = useWallet();
  const { summary: escrowSummary, isLoading: escrowLoading } =
    useEscrowSummary();
  const { payments, isLoading: paymentsLoading } = useMyPayments();
  const {
    open: topUpOpen,
    openTopUp,
    returnStatus,
    dismissReturnStatus,
    panelProps,
  } = useWalletTopup({ callbackPath: "/dashboard/engineer/wallet" });

  const [payoutOpen, setPayoutOpen] = useState(false);

  const [filterRef, setFilterRef] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterApplied, setFilterApplied] = useState(false);

  const availableLabel = wallet
    ? formatKobo(wallet.availableBalance)
    : walletLoading
      ? "…"
      : "—";
  const escrowLabel = escrowSummary
    ? formatKobo(escrowSummary.expectedNetKobo)
    : escrowLoading
      ? "…"
      : "—";

  const filteredTransactions = useMemo(() => {
    if (!payments) return [];
    if (!filterApplied) return payments;
    return payments.filter((tx) => {
      const matchRef =
        !filterRef ||
        tx.reference.toLowerCase().includes(filterRef.toLowerCase());
      const matchType =
        !filterType ||
        (intentLabel[tx.intent] ?? tx.intent)
          .toLowerCase()
          .includes(filterType.toLowerCase());
      const matchDate = !filterDate || tx.createdAt.startsWith(filterDate);
      return matchRef && matchType && matchDate;
    });
  }, [payments, filterApplied, filterRef, filterType, filterDate]);

  const resetFilters = () => {
    setFilterRef("");
    setFilterType("");
    setFilterDate("");
    setFilterApplied(false);
  };

  return (
    <ProtectedRoute requiredRole={UserRole.ENGINEER}>
      <div>
        <Header
          title="Wallet"
          description="Review and manage your incoming service requests"
        />

        <div className="min-h-[calc(100vh-100px)] space-y-4 bg-[#F5F7FA] p-3 md:p-6">
          <TopUpReturnBanner
            status={returnStatus}
            onDismiss={dismissReturnStatus}
          />
          {/* Balance cards sit at a fixed width rather than stretching, so they
              stay compact on wide screens as in the design. */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <article className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:w-[380px] sm:shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[#6B7280]">Available earnings</p>
                  <p className="mt-2 text-[28px] font-semibold leading-none text-[#111827]">
                    {availableLabel}
                  </p>
                  <p className="mt-4 text-xs text-[#9CA3AF]">
                    Earnings from processed orders
                  </p>
                </div>
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF]">
                  <Users className="size-5 text-primary" strokeWidth={1.5} />
                </span>
              </div>
            </article>

            <article className="w-full rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] sm:w-[380px] sm:shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[#6B7280]">ESCROW balance</p>
                  <p className="mt-2 text-[28px] font-semibold leading-none text-[#111827]">
                    {escrowLabel}
                  </p>
                  <p className="mt-4 text-xs text-[#9CA3AF]">
                    Funds pending release
                  </p>
                </div>
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF1E5]">
                  <Users className="size-5 text-[#F08C2E]" strokeWidth={1.5} />
                </span>
              </div>
            </article>
          </div>

          {/* Payout and top-up are separate cards side by side. */}
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-2xl border border-[#B3D4FC] bg-[#F0F7FF] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#DDEBFF]">
                  <ShieldCheck className="size-4 text-primary" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-[#111827]">Payout</p>
                  <p className="text-sm text-[#4B5563]">
                    You can only request payments on your available earnings.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayoutOpen(true)}
                className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-medium text-white"
              >
                Request payout
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-[#E6ECF2] bg-[#FAFAFA] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#DDEBFF]">
                  <PlusSquare className="size-4 text-primary" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-[#111827]">Top Up</p>
                  <p className="text-sm text-[#4B5563]">
                    You can only request payments on your available earnings.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openTopUp()}
                className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-medium text-white"
              >
                <Plus className="size-4" aria-hidden />
                Top up
              </button>
            </div>
          </div>

          <section className="rounded-3xl border border-[#E6ECF2] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-xl font-semibold text-[#111827]">
              Transaction history
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">Filter table list by:</p>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_190px_150px_110px]">
              <input
                aria-label="Reference ID filter"
                type="text"
                placeholder="Enter reference ID"
                value={filterRef}
                onChange={(e) => setFilterRef(e.target.value)}
                className="h-11 rounded-xl border border-[#E6ECF2] px-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:ring-1 focus:ring-primary"
              />
              <input
                aria-label="Transaction type filter"
                type="text"
                placeholder="Enter transaction type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-11 rounded-xl border border-[#E6ECF2] px-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:ring-1 focus:ring-primary"
              />
              <div className="relative">
                <input
                  aria-label="Transaction date filter"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 pr-10 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:ring-1 focus:ring-primary"
                />
                <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
              </div>
              <button
                type="button"
                onClick={() => setFilterApplied(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white"
              >
                <SlidersHorizontal className="size-4" aria-hidden />
                Filter
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] px-5 text-sm font-semibold text-[#4B5563]"
              >
                Reset
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              {paymentsLoading ? (
                <div className="flex h-40 items-center justify-center text-sm text-[#6B7280]">
                  Loading transactions…
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-[#6B7280]">
                  No transactions found.
                </div>
              ) : (
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-[#E6ECF2] text-left text-[#6B7280]">
                      <th className="pb-3 pr-4 font-medium">Transaction ID</th>
                      <th className="pb-3 pr-4 font-medium">Description</th>
                      <th className="pb-3 pr-4 font-medium">
                        Transaction type
                      </th>
                      <th className="pb-3 pr-4 font-medium">Channel</th>
                      <th className="pb-3 pr-4 font-medium">Amount</th>
                      <th className="pb-3 pr-4 font-medium whitespace-nowrap">
                        Date &amp; Time
                      </th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr
                        key={tx._id}
                        className="border-b border-[#E6ECF2] last:border-0"
                      >
                        <td className="py-3 pr-4 text-[#111827]">
                          {tx.reference}
                        </td>
                        <td className="py-3 pr-4 text-[#4B5563]">
                          {tx.description ?? "-"}
                        </td>
                        <td className="py-3 pr-4 text-[#4B5563]">
                          {intentLabel[tx.intent] ?? tx.intent}
                        </td>
                        <td className="py-3 pr-4 text-[#4B5563]">
                          {tx.channel
                            ? (channelLabel[tx.channel] ?? tx.channel)
                            : "-"}
                        </td>
                        <td className="py-3 pr-4 font-medium text-[#111827]">
                          {formatNaira(koboToNaira(tx.amount))}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap text-[#6B7280]">
                          {formatTransactionDateTime(tx.createdAt)}
                        </td>
                        <td
                          className={`py-3 font-medium capitalize ${
                            statusColor[tx.status] ?? "text-[#111827]"
                          }`}
                        >
                          {tx.status.replace(/_/g, " ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>

      <TopUpDrawer open={topUpOpen} panelProps={panelProps} />
      <PayoutDialog
        open={payoutOpen}
        onOpenChange={setPayoutOpen}
        availableLabel={availableLabel}
      />
    </ProtectedRoute>
  );
}
