"use client";

import { useState, useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingUp, Clock, Info, SlidersHorizontal } from "lucide-react";
import Header from "../../component/header";
import { Button, RightSlider, Input } from "@/components/base";
import { useWallet } from "@/hooks/useWallet";
import { useEscrowSummary } from "@/hooks/useEscrowSummary";
import { formatKobo } from "@/lib/wallet-format";

type TxType = "credit" | "debit";

interface Transaction {
  id: string;
  description: string;
  amount: string;
  type: TxType;
  date: string;
  status: "completed" | "pending";
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "1", description: "Sale — Industrial Pump A3 × 2", amount: "NGN 720,056.00", type: "credit", date: "17/09/2025 03:56pm", status: "completed" },
  { id: "2", description: "Withdrawal to bank account", amount: "NGN 300,000.00", type: "debit", date: "15/09/2025 11:22am", status: "completed" },
  { id: "3", description: "Sale — Welding Rod Box × 5", amount: "NGN 123,500.00", type: "credit", date: "14/09/2025 09:45am", status: "completed" },
  { id: "4", description: "Platform commission fee", amount: "NGN 21,601.68", type: "debit", date: "14/09/2025 09:46am", status: "completed" },
  { id: "5", description: "Sale — Safety Gloves Pack × 10", amount: "NGN 125,000.00", type: "credit", date: "12/09/2025 02:10pm", status: "pending" },
  { id: "6", description: "Withdrawal to bank account", amount: "NGN 200,000.00", type: "debit", date: "10/09/2025 10:30am", status: "completed" },
];

export default function DistributorPayments() {
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutStep, setPayoutStep] = useState<"form" | "success" | null>(null);

  // Mobile-only transaction filter state (no API calls — filters local list)
  const [filterRef, setFilterRef] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterApplied, setFilterApplied] = useState(false);

  const { wallet, isLoading: walletLoading } = useWallet();
  const { summary: escrowSummary, isLoading: escrowLoading } =
    useEscrowSummary();

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

  const displayedTransactions = useMemo(() => {
    if (!filterApplied) return MOCK_TRANSACTIONS;
    return MOCK_TRANSACTIONS.filter((tx) => {
      const matchRef = !filterRef || tx.id.toLowerCase().includes(filterRef.toLowerCase()) || tx.description.toLowerCase().includes(filterRef.toLowerCase());
      const matchType = !filterType || tx.type.toLowerCase().includes(filterType.toLowerCase()) || tx.description.toLowerCase().includes(filterType.toLowerCase());
      const matchDate = !filterDate || tx.date.startsWith(filterDate);
      return matchRef && matchType && matchDate;
    });
  }, [filterApplied, filterRef, filterType, filterDate]);

  const openPayoutDrawer = () => {
    setPayoutOpen(true);
    setPayoutStep("form");
    setPayoutAmount("");
  };

  const closePayoutDrawer = () => {
    setPayoutOpen(false);
    setPayoutStep(null);
    setPayoutAmount("");
  };

  const submitPayoutLocalOnly = () => {
    if (!payoutAmount.trim()) return;
    setPayoutStep("success");
  };

  return (
    <div>
      <Header title="Wallet & Payment" description="Track your sales revenue and manage withdrawals" />

      <div className="p-4 md:p-6 space-y-4">
        {/* KPI cards — 2 columns on mobile (Available + ESCROW), 4 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card-shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray3">Available earnings</p>
              <div className="size-9 bg-info-light rounded-lg flex items-center justify-center">
                <Wallet size={16} className="text-info" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray1">{availableLabel}</p>
            <p className="text-xs text-gray3 mt-1">Ready to withdraw</p>
          </div>

          <div className="card-shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray3">ESCROW balance</p>
              <div className="size-9 bg-gray7 rounded-lg flex items-center justify-center">
                <Clock size={16} className="text-gray2" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray1">{escrowLabel}</p>
            <p className="text-xs text-gray3 mt-1">Held until order completion</p>
          </div>

          {/* Hidden on mobile — not shown in Figma mobile frame */}
          <div className="card-shadow p-5 hidden sm:block">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray3">Total Revenue</p>
              <div className="size-9 bg-success-light rounded-lg flex items-center justify-center">
                <TrendingUp size={16} className="text-success" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray1">NGN 968,556</p>
            <p className="text-xs text-gray3 mt-1">All time sales</p>
          </div>

          <div className="card-shadow p-5 hidden sm:block">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray3">Pending Payout</p>
              <div className="size-9 bg-warning-light rounded-lg flex items-center justify-center">
                <Clock size={16} className="text-warning" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray1">NGN 125,000</p>
            <p className="text-xs text-gray3 mt-1">1 pending sale</p>
          </div>
        </div>

        {/* Payout CTA */}
        <div className="card flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {/* Mobile: Figma-style payout info banner */}
          <div className="sm:hidden rounded-lg border border-info-light bg-info-light/20 p-3 flex items-start gap-2">
            <Info size={16} className="text-info mt-0.5 shrink-0" />
            <p className="text-sm text-gray2">
              You can only request payments on your available earnings
            </p>
          </div>
          {/* Desktop: plain description */}
          <p className="hidden sm:block text-sm text-gray3">
            Withdraw earnings to your registered bank account
          </p>
          <div className="flex flex-wrap gap-2">
            <Button title="Request payout" size="sm" onClick={openPayoutDrawer} className="w-full sm:w-auto" />
            {/* Hidden on mobile — not shown in Figma mobile frame */}
            <Button
              title="Withdraw Funds"
              variant="secondaryLight"
              size="sm"
              disabled
              className="hidden sm:inline-flex opacity-60 cursor-not-allowed"
            />
            <Button
              title="Add Bank Account"
              variant="secondaryLight"
              size="sm"
              disabled
              className="hidden sm:inline-flex opacity-60 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Mobile-only transaction filter form (no API — filters local list) */}
        <div className="sm:hidden card space-y-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-gray3" />
            <p className="text-sm font-medium text-gray2">Filter table list by:</p>
          </div>
          <Input
            id="filterRef"
            label="Reference ID"
            placeholder="Enter reference ID"
            value={filterRef}
            onValueChange={setFilterRef}
          />
          <Input
            id="filterType"
            label="Transaction type"
            placeholder="Enter transaction type"
            value={filterType}
            onValueChange={setFilterType}
          />
          <div className="space-y-1">
            <label htmlFor="filterDate" className="text-sm text-gray3">Date</label>
            <div className="relative">
              <input
                id="filterDate"
                type="date"
                className="w-full border border-gray5 rounded-lg px-3 py-2 text-sm text-gray1 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                placeholder="DD/MM/YY"
              />
            </div>
          </div>
          <Button
            title="Filter"
            variant="primary"
            className="w-full"
            onClick={() => setFilterApplied(true)}
          />
        </div>

        <div className="card overflow-x-auto">
          <h3 className="medium3 mb-4">Transaction History</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray5">
                <th className="text-left py-2 px-3 text-gray3 font-medium">Description</th>
                <th className="text-left py-2 px-3 text-gray3 font-medium whitespace-nowrap">Date</th>
                <th className="text-left py-2 px-3 text-gray3 font-medium">Status</th>
                <th className="text-right py-2 px-3 text-gray3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {displayedTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray5 last:border-0">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className={`size-7 rounded-full flex items-center justify-center shrink-0 ${tx.type === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                        {tx.type === "credit" ? (
                          <ArrowDownLeft size={13} className="text-green-700" />
                        ) : (
                          <ArrowUpRight size={13} className="text-red-700" />
                        )}
                      </div>
                      <span className="text-gray1">{tx.description}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray3 whitespace-nowrap">{tx.date}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tx.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {tx.status === "completed" ? "Completed" : "Pending"}
                    </span>
                  </td>
                  <td className={`py-3 px-3 text-right font-medium whitespace-nowrap ${tx.type === "credit" ? "text-success" : "text-danger"}`}>
                    {tx.type === "credit" ? "+" : "-"}{tx.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <RightSlider open={payoutOpen} onClose={closePayoutDrawer} title="Request For Payout">
        {payoutStep === "form" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray3">
              Payout processing is not connected yet. You can preview the form; submitting only updates this screen locally—no payment API is called.
            </p>
            <Input
              id="payoutAmount"
              label="Amount (NGN)"
              type="number"
              placeholder="Enter amount"
              value={payoutAmount}
              onValueChange={setPayoutAmount}
            />
            <div className="flex gap-2 pt-2">
              <Button title="Cancel" variant="secondaryLight" onClick={closePayoutDrawer} className="flex-1" />
              <Button
                title="Submit request"
                variant="primary"
                onClick={submitPayoutLocalOnly}
                disabled={!payoutAmount.trim()}
                className="flex-1"
              />
            </div>
          </div>
        )}
        {payoutStep === "success" && (
          <div className="space-y-4 pt-2 text-center">
            <p className="text-success font-medium">Request recorded (preview only)</p>
            <p className="text-sm text-gray3">No funds were moved. Connect payout services in a future release.</p>
            <Button title="Close" variant="primary" onClick={closePayoutDrawer} className="w-full" />
          </div>
        )}
      </RightSlider>
    </div>
  );
}
