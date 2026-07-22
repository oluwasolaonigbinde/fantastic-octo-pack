"use client";

import { useState, useMemo } from "react";
import { Clock, Info, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useEscrowSummary } from "@/hooks/useEscrowSummary";
import { useMyPayments } from "@/hooks/usePayments";
import { formatKobo, koboToNaira, formatNaira } from "@/lib/wallet-format";
import {
  channelLabel,
  formatTransactionDateTime,
  intentLabel,
  statusColor,
} from "@/lib/payment-display";
import Header from "../../component/header";
import { Button } from "@/components/base";
import { PayoutDialog } from "@/components/wallet/payout-dialog";

export default function DistributorPayments() {
  const { wallet, isLoading: walletLoading } = useWallet();
  const { summary: escrowSummary, isLoading: escrowLoading } =
    useEscrowSummary();
  const { payments, isLoading: paymentsLoading } = useMyPayments();

  const [filterRef, setFilterRef] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterApplied, setFilterApplied] = useState(false);

  const [payoutOpen, setPayoutOpen] = useState(false);

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
    <div>
      <Header title="Wallet & Payment" description="Track all payments" />

      <div className="p-4 md:p-6 space-y-4">
        {/* Top balance cards */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="card-shadow p-4 w-full sm:w-[362px] sm:shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray3">Available earnings</p>
                <p className="text-xl font-bold text-gray1 mt-1">
                  {availableLabel}
                </p>
                <p className="text-xs text-gray3 mt-1">
                  Earnings from processed orders
                </p>
              </div>
              <div className="size-8 bg-info-light rounded-lg flex items-center justify-center shrink-0">
                <Wallet size={14} className="text-info" />
              </div>
            </div>
          </div>

          <div className="card-shadow p-4 w-full sm:w-[362px] sm:shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray3">ESCROW balance</p>
                <p className="text-xl font-bold text-gray1 mt-1">
                  {escrowLabel}
                </p>
                <p className="text-xs text-gray3 mt-1">Funds pending release</p>
              </div>
              <div className="size-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                <Clock size={14} className="text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Payout CTA banner */}
        <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Info size={16} className="text-primary" />
            </div>
            <div>
              <p className="font-medium text-gray1 text-sm">Payout</p>
              <p className="text-sm text-gray3">
                You can only request payments on your available earnings
              </p>
            </div>
          </div>
          <Button
            title="Request payout →"
            size="sm"
            onClick={() => setPayoutOpen(true)}
            className="w-full sm:w-auto shrink-0"
          />
        </div>

        {/* Transaction history */}
        <div className="card">
          <h3 className="medium3 mb-4">Transaction history</h3>

          {/* Filter row */}
          <p className="text-sm text-gray3 mb-2">Filter table list by:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end gap-3 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray3">Reference ID</label>
              <input
                placeholder="Enter reference ID"
                value={filterRef}
                onChange={(e) => setFilterRef(e.target.value)}
                className="h-10 rounded-lg border border-gray5 px-3 text-sm text-gray1 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray3">Transaction type</label>
              <input
                placeholder="Enter transaction type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-10 rounded-lg border border-gray5 px-3 text-sm text-gray1 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray3">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="h-10 rounded-lg border border-gray5 px-3 text-sm text-gray1 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                title="→ Filter"
                size="sm"
                className="flex-1 h-10"
                onClick={() => setFilterApplied(true)}
              />
              <Button
                title="Reset"
                variant="secondaryLight"
                size="sm"
                className="flex-1 h-10"
                onClick={resetFilters}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {paymentsLoading ? (
              <div className="flex h-40 items-center justify-center text-sm text-gray3">
                Loading transactions…
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-gray3">
                No transactions found.
              </div>
            ) : (
              <table className="min-w-[1050px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray5 text-gray3">
                    <th className="py-3 pr-5 font-medium">Transaction ID</th>
                    <th className="py-3 pr-5 font-medium">Description</th>
                    <th className="py-3 pr-5 font-medium">Transaction type</th>
                    <th className="py-3 pr-5 font-medium">Channel</th>
                    <th className="py-3 pr-5 font-medium">Amount</th>
                    <th className="py-3 pr-5 font-medium whitespace-nowrap">
                      Date &amp; Time
                    </th>
                    <th className="py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx._id}
                      className="border-b border-gray5 last:border-0"
                    >
                      <td className="py-4 pr-5 text-gray1">{tx.reference}</td>
                      <td className="py-4 pr-5 text-gray1">
                        {tx.description ?? "-"}
                      </td>
                      <td className="py-4 pr-5 text-gray1">
                        {intentLabel[tx.intent] ?? tx.intent}
                      </td>
                      <td className="py-4 pr-5 text-gray1">
                        {tx.channel
                          ? (channelLabel[tx.channel] ?? tx.channel)
                          : "-"}
                      </td>
                      <td className="py-4 pr-5 font-medium text-gray1">
                        {formatNaira(koboToNaira(tx.amount))}
                      </td>
                      <td className="py-4 pr-5 text-gray3 whitespace-nowrap">
                        {formatTransactionDateTime(tx.createdAt)}
                      </td>
                      <td
                        className={`py-4 font-medium capitalize ${
                          statusColor[tx.status] ?? "text-gray1"
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
        </div>
      </div>

      <PayoutDialog
        open={payoutOpen}
        onOpenChange={setPayoutOpen}
        availableLabel={availableLabel}
      />
    </div>
  );
}
