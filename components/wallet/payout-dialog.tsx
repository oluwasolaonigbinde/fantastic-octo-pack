"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { useBanksQuery } from "@/hooks/queries/payments";
import { useWithdrawFromWalletMutation } from "@/hooks/queries/wallet";
import { queryKeys } from "@/lib/query-keys";
import paymentService from "@/services/paymentService";
import { Button, Input } from "@/components/base";
import { Modal } from "@/components/base/Modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Bank } from "@/types/payment";

export type PayoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Formatted available balance, e.g. "₦150,000". */
  availableLabel: string;
};

/**
 * Wallet payout request flow — bank lookup, account-name resolution and the
 * withdrawal mutation — shared by every role's wallet screen so payouts behave
 * identically across dashboards.
 */
export function PayoutDialog({
  open,
  onOpenChange,
  availableLabel,
}: PayoutDialogProps) {
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-[400px] space-y-4 p-6 rounded-2xl">
          {/* Mounted only while open so every re-open starts from a clean form. */}
          {open && (
            <PayoutForm
              availableLabel={availableLabel}
              onCancel={() => onOpenChange(false)}
              onSuccess={() => {
                onOpenChange(false);
                setSuccessOpen(true);
              }}
              onError={() => {
                onOpenChange(false);
                setErrorOpen(true);
              }}
            />
          )}
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
          onOpenChange(true);
        }}
        onClose={() => setErrorOpen(false)}
      />
    </>
  );
}

type PayoutFormProps = {
  availableLabel: string;
  onCancel: () => void;
  onSuccess: () => void;
  onError: () => void;
};

function PayoutForm({
  availableLabel,
  onCancel,
  onSuccess,
  onError,
}: PayoutFormProps) {
  const queryClient = useQueryClient();
  const token = useAppSelector((s) => s.auth.data?.tokens?.accessToken);
  const withdrawMutation = useWithdrawFromWalletMutation();
  const { data: banks = [], isLoading: banksLoading } = useBanksQuery();

  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);

  // Bank selection
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [bankSearch, setBankSearch] = useState("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const bankBoxRef = useRef<HTMLDivElement>(null);

  // Account resolution
  const [resolvedName, setResolvedName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const resolveReqRef = useRef(0);

  // Close the bank dropdown when clicking outside of it.
  useEffect(() => {
    if (!bankDropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        bankBoxRef.current &&
        !bankBoxRef.current.contains(e.target as Node)
      ) {
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

  // Resolve the account name once a bank and a 10-digit account number exist.
  // Called from the input/select handlers; stale responses are discarded.
  const resolveAccount = (accountNumber: string, bank: Bank | null) => {
    setResolvedName("");
    setResolveError("");
    if (!token || !bank || accountNumber.length !== 10) {
      setResolving(false);
      return;
    }

    const reqId = ++resolveReqRef.current;
    setResolving(true);
    paymentService
      .resolveBankAccount(token, { accountNumber, bankCode: bank.code })
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

  const submitPayout = async () => {
    if (!token || !amount || !selectedBank || !resolvedName) return;
    if (account.length !== 10) return;
    const amountKobo = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountKobo) || amountKobo <= 0) return;

    setBusy(true);
    try {
      await withdrawMutation.mutateAsync({
        amount: amountKobo,
        accountNumber: account,
        bankCode: selectedBank.code,
        accountName: resolvedName,
      });

      onSuccess();
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    } catch {
      onError();
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    !!amount &&
    account.length === 10 &&
    !!selectedBank &&
    !!resolvedName &&
    !resolving &&
    !busy;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base font-semibold text-gray1">
          Request for payout
        </DialogTitle>
        <p className="text-sm text-gray3">
          Transfer money to your bank account
        </p>
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
          value={amount}
          onValueChange={setAmount}
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
                            resolveAccount(account, bank);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray1 hover:bg-gray-50"
                        >
                          {bank.name}
                          {selectedBank?.code === bank.code && (
                            <Check
                              size={14}
                              className="text-primary shrink-0"
                            />
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
            value={account}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 10);
              setAccount(v);
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
          onClick={onCancel}
          className="flex-1"
        />
        <Button
          title="Request payout"
          size="sm"
          isBusy={busy}
          disabled={!canSubmit}
          onClick={submitPayout}
          className="flex-1"
        />
      </div>
    </>
  );
}
