"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Check, Clock, Info, Loader2, Search, Wallet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import { useWithdrawFromWalletMutation } from "@/hooks/queries/wallet";
import { useWallet } from "@/hooks/useWallet";
import { useEscrowSummary } from "@/hooks/useEscrowSummary";
import { useMyPayments } from "@/hooks/usePayments";
import paymentService from "@/services/paymentService";
import { formatKobo, koboToNaira, formatNaira } from "@/lib/wallet-format";
import Header from "../../component/header";
import { Button, Input } from "@/components/base";
import { Modal } from "@/components/base/Modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Bank, PaymentIntent, PaymentStatus } from "@/types/payment";

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()} - ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}pm`;
};

const intentLabel: Record<PaymentIntent, string> = {
  order_payment: "ESCROW",
  wallet_topup: "Top-up",
  service_payment: "Service",
  withdrawal: "Withdrawal",
  escrow_release: "Reversal",
  refund: "Refund",
};

const statusColor: Record<PaymentStatus, string> = {
  success: "text-[#13A83B]",
  failed: "text-[#E33C13]",
  rejected: "text-[#E33C13]",
  abandoned: "text-[#E33C13]",
  pending_approval: "text-[#F5A400]",
  pending: "text-[#F5A400]",
  refunded: "text-[#F5A400]",
};

export default function DistributorPayments() {
  const queryClient = useQueryClient();
  const token = useAppSelector((s) => s.auth.data?.tokens?.accessToken);
  const withdrawMutation = useWithdrawFromWalletMutation();

  const { wallet, isLoading: walletLoading } = useWallet();
  const { summary: escrowSummary, isLoading: escrowLoading } = useEscrowSummary();
  const { payments, isLoading: paymentsLoading } = useMyPayments();

  const [filterRef, setFilterRef] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterApplied, setFilterApplied] = useState(false);

  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [payoutBusy, setPayoutBusy] = useState(false);

  // Bank selection
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [bankSearch, setBankSearch] = useState("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const bankBoxRef = useRef<HTMLDivElement>(null);

  // Account resolution
  const [resolvedName, setResolvedName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const resolveReqRef = useRef(0);

  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  // Close the bank dropdown when clicking outside of it.
  useEffect(() => {
    if (!bankDropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (bankBoxRef.current && !bankBoxRef.current.contains(e.target as Node)) {
        setBankDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [bankDropdownOpen]);

  const filteredBanks = useMemo(() => {
    const q = bankSearch.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter((b) => b.name.toLowerCase().includes(q));
  }, [banks, bankSearch]);

  // Fetch the supported banks the first time the payout modal is opened.
  const loadBanks = () => {
    if (!token || banks.length > 0 || banksLoading) return;
    setBanksLoading(true);
    paymentService
      .fetchBanks(token, { currency: "NGN", country: "nigeria" })
      .then(setBanks)
      .catch(() => setBanks([]))
      .finally(() => setBanksLoading(false));
  };

  // Resolve the account name once a bank and a 10-digit account number exist.
  // Called from the input/select handlers; stale responses are discarded.
  const resolveAccount = (account: string, bank: Bank | null) => {
    setResolvedName("");
    setResolveError("");
    if (!token || !bank || account.length !== 10) {
      setResolving(false);
      return;
    }

    const reqId = ++resolveReqRef.current;
    setResolving(true);
    paymentService
      .resolveBankAccount(token, {
        accountNumber: account,
        bankCode: bank.code,
      })
      .then((name) => {
        if (resolveReqRef.current === reqId) setResolvedName(name);
      })
      .catch((err) => {
        if (resolveReqRef.current === reqId)
          setResolveError(
            err instanceof Error ? err.message : "Could not resolve account",
          );
      })
      .finally(() => {
        if (resolveReqRef.current === reqId) setResolving(false);
      });
  };

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

  const openPayout = () => {
    setPayoutAmount("");
    setPayoutAccount("");
    setSelectedBank(null);
    setBankSearch("");
    setBankDropdownOpen(false);
    setResolvedName("");
    setResolveError("");
    setPayoutOpen(true);
    loadBanks();
  };

  const submitPayout = async () => {
    if (!token || !payoutAmount || !selectedBank || !resolvedName) return;
    if (payoutAccount.length !== 10) return;
    const amountKobo = Math.round(parseFloat(payoutAmount) * 100);
    if (isNaN(amountKobo) || amountKobo <= 0) return;

    setPayoutBusy(true);
    try {
      await withdrawMutation.mutateAsync({
        amount: amountKobo,
        accountNumber: payoutAccount,
        bankCode: selectedBank.code,
        accountName: resolvedName,
      });

      setPayoutOpen(false);
      setSuccessOpen(true);
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    } catch {
      setPayoutOpen(false);
      setErrorOpen(true);
    } finally {
      setPayoutBusy(false);
    }
  };

  const canSubmitPayout =
    !!payoutAmount &&
    payoutAccount.length === 10 &&
    !!selectedBank &&
    !!resolvedName &&
    !resolving &&
    !payoutBusy;

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
                <p className="text-xl font-bold text-gray1 mt-1">{availableLabel}</p>
                <p className="text-xs text-gray3 mt-1">Earnings from processed orders</p>
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
                <p className="text-xl font-bold text-gray1 mt-1">{escrowLabel}</p>
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
            onClick={openPayout}
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
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray5 text-gray3">
                    <th className="py-3 pr-5 font-medium">Transaction ID</th>
                    <th className="py-3 pr-5 font-medium">Description</th>
                    <th className="py-3 pr-5 font-medium">Transaction type</th>
                    <th className="py-3 pr-5 font-medium">Amount</th>
                    <th className="py-3 pr-5 font-medium whitespace-nowrap">Date &amp; Time</th>
                    <th className="py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-gray5 last:border-0">
                      <td className="py-4 pr-5 text-gray1">{tx.reference}</td>
                      <td className="py-4 pr-5 text-gray1">
                        {intentLabel[tx.intent] ?? tx.intent} transaction
                      </td>
                      <td className="py-4 pr-5 text-gray1">
                        {intentLabel[tx.intent] ?? tx.intent}
                      </td>
                      <td className="py-4 pr-5 font-medium text-gray1">
                        {formatNaira(koboToNaira(tx.amount))}
                      </td>
                      <td className="py-4 pr-5 text-gray3 whitespace-nowrap">
                        {formatDateTime(tx.createdAt)}
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

      {/* Payout dialog */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="w-full max-w-[400px] space-y-4 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray1">
              Request for payout
            </DialogTitle>
            <p className="text-sm text-gray3">Transfer money to your bank account</p>
          </DialogHeader>

          {/* Available balance box */}
          <div className="rounded-lg border border-success/40 bg-success/5 p-4">
            <p className="text-xs text-gray3 mb-1">Available</p>
            <p className="text-xl font-bold text-success">{availableLabel}</p>
          </div>

          <div className="space-y-3">
            <Input
              id="payoutAmount"
              label="Amount to request"
              type="number"
              placeholder="Enter amount to request"
              value={payoutAmount}
              onValueChange={setPayoutAmount}
            />

            {/* Searchable bank picker */}
            <div className="space-y-1" ref={bankBoxRef}>
              <label className="text-sm text-gray3">Select bank</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBankDropdownOpen((o) => !o)}
                  className="flex w-full h-12 items-center justify-between rounded-lg border border-gray5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                >
                  <span className={selectedBank ? "text-gray1" : "text-gray3"}>
                    {selectedBank
                      ? selectedBank.name
                      : banksLoading
                        ? "Loading banks…"
                        : "Choose a bank"}
                  </span>
                  <Search size={16} className="text-gray3 shrink-0" />
                </button>

                {bankDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray5 bg-white shadow-lg">
                    <div className="p-2 border-b border-gray5">
                      <div className="flex items-center gap-2 rounded-md border border-gray5 px-2">
                        <Search size={14} className="text-gray3 shrink-0" />
                        <input
                          autoFocus
                          placeholder="Search banks"
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          className="h-9 w-full text-sm text-gray1 focus:outline-none bg-transparent"
                        />
                      </div>
                    </div>
                    <ul className="max-h-56 overflow-y-auto py-1">
                      {banksLoading ? (
                        <li className="px-3 py-2 text-sm text-gray3">
                          Loading banks…
                        </li>
                      ) : filteredBanks.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-gray3">
                          No banks found
                        </li>
                      ) : (
                        filteredBanks.map((bank) => (
                          <li key={`${bank.code}-${bank.name}`}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBank(bank);
                                setBankDropdownOpen(false);
                                setBankSearch("");
                                resolveAccount(payoutAccount, bank);
                              }}
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray1 hover:bg-gray-50"
                            >
                              {bank.name}
                              {selectedBank?.code === bank.code && (
                                <Check size={14} className="text-primary shrink-0" />
                              )}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Account number */}
            <div className="space-y-1">
              <label htmlFor="payoutAccount" className="text-sm text-gray3">
                Account number
              </label>
              <input
                id="payoutAccount"
                inputMode="numeric"
                placeholder="Account number (10 digits)"
                value={payoutAccount}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPayoutAccount(v);
                  resolveAccount(v, selectedBank);
                }}
                maxLength={10}
                className="w-full h-12 rounded-lg border border-gray5 px-3 text-sm text-gray1 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
              />
            </div>

            {/* Resolution feedback */}
            {resolving && (
              <div className="flex items-center gap-2 text-sm text-gray3">
                <Loader2 size={14} className="animate-spin" />
                Verifying account…
              </div>
            )}
            {!resolving && resolvedName && (
              <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/5 px-3 py-2">
                <Check size={16} className="text-success shrink-0" />
                <span className="text-sm font-medium text-success capitalize">
                  {resolvedName.toLowerCase()}
                </span>
              </div>
            )}
            {!resolving && resolveError && (
              <p className="text-sm text-danger">{resolveError}</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              title="Cancel"
              variant="secondaryLight"
              size="sm"
              onClick={() => setPayoutOpen(false)}
              className="flex-1"
            />
            <Button
              title="Request payout"
              size="sm"
              isBusy={payoutBusy}
              disabled={!canSubmitPayout}
              onClick={submitPayout}
              className="flex-1"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Success modal */}
      <Modal
        open={successOpen}
        type="success"
        title="Congratulations"
        description="Payout request successful"
        primaryButtonText="Okay"
        onClose={() => setSuccessOpen(false)}
      />

      {/* Error modal */}
      <Modal
        open={errorOpen}
        type="warning"
        title="Payout request failed."
        description="Click here to try again"
        variant="two-buttons"
        primaryButtonText="Try again"
        secondaryButtonText="Cancel"
        onPrimaryAction={() => {
          setErrorOpen(false);
          setPayoutOpen(true);
        }}
        onClose={() => setErrorOpen(false)}
      />
    </div>
  );
}
