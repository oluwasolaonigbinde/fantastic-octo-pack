"use client";

import { useState } from "react";
import { Ban, BadgeCheck, Building2, CheckCircle2, User } from "lucide-react";
import { Button, RightSlider, Textarea } from "@/components/base";
import type { PaymentTransaction } from "@/types/payment";
import {
  formatDateTime,
  formatKobo,
  getAvailableBalanceKobo,
  getPayoutUser,
  getUserName,
  getUserPhone,
  getUserType,
  payoutStatusClass,
  payoutStatusLabel,
} from "./payout-helpers";

interface PayoutDetailDrawerProps {
  transaction: PaymentTransaction | null;
  open: boolean;
  onClose: () => void;
  onApprove: (transaction: PaymentTransaction) => Promise<void>;
  onReject: (transaction: PaymentTransaction, note: string) => Promise<void>;
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs uppercase tracking-[0.08em] text-gray3">{label}</span>
    <span className="text-sm font-medium text-gray1">{value}</span>
  </div>
);

export function PayoutDetailDrawer({
  transaction,
  open,
  onClose,
  onApprove,
  onReject,
}: PayoutDetailDrawerProps) {
  const [mode, setMode] = useState<"idle" | "rejecting">("idle");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  if (!transaction) return null;

  const user = getPayoutUser(transaction);
  const availableBalance = getAvailableBalanceKobo(transaction);
  const userType = getUserType(transaction);
  const phone = getUserPhone(transaction);
  const bank = transaction.destinationBank;
  const isPending =
    transaction.status === "pending_approval" || transaction.status === "pending";

  const runApprove = async () => {
    setBusy("approve");
    setError("");
    try {
      await onApprove(transaction);
      onClose();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Failed to approve payout.",
      );
    } finally {
      setBusy(null);
    }
  };

  const runReject = async () => {
    setBusy("reject");
    setError("");
    try {
      await onReject(transaction, note.trim());
      onClose();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Failed to reject payout.",
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <RightSlider
      open={open}
      onClose={onClose}
      title={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xl font-medium text-gray1">
              Payout Request Details
            </span>
            <span className="text-xs font-normal text-gray3">
              Request Reference: {transaction.reference}
            </span>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${payoutStatusClass(
              transaction.status,
            )}`}
          >
            {payoutStatusLabel[transaction.status]}
          </span>
        </div>
      }
      contentClassName="overflow-hidden"
      bodyClassName="flex-1 overflow-y-auto space-y-6 px-6 pb-10 pt-6"
    >
      {/* Requested amount */}
      <div className="rounded-2xl bg-[#F3F7FF] p-5">
        <p className="text-xs uppercase tracking-[0.08em] text-gray3">
          Requested amount
        </p>
        <p className="mt-1 text-3xl font-semibold text-gray1">
          {formatKobo(transaction.amount, transaction.currency)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <InfoRow label="Request date" value={formatDateTime(transaction.createdAt)} />
          <InfoRow
            label="Current status"
            value={payoutStatusLabel[transaction.status]}
          />
        </div>
      </div>

      {/* User information */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gray1">
          <User size={16} className="text-primary" />
          <h4 className="text-sm font-semibold uppercase tracking-[0.06em]">
            User information
          </h4>
        </div>
        <div className="rounded-2xl border border-gray5 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#E7F1FF] text-primary">
              <Building2 size={18} />
            </span>
            <div>
              <p className="text-sm font-medium text-gray1">{getUserName(user)}</p>
              {userType ? (
                <span className="mt-1 inline-block rounded bg-[#E7F1FF] px-2 py-0.5 text-[11px] font-medium uppercase text-primary">
                  {userType}
                </span>
              ) : null}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray6 pt-4">
            <InfoRow label="Email address" value={user?.email ?? "-"} />
            <InfoRow label="Phone number" value={phone ?? "-"} />
            {availableBalance !== undefined ? (
              <InfoRow
                label="Available balance"
                value={formatKobo(availableBalance, transaction.currency)}
              />
            ) : null}
          </div>
        </div>
      </section>

      {/* Settlement bank details */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-gray1">
          <Building2 size={16} className="text-primary" />
          <h4 className="text-sm font-semibold uppercase tracking-[0.06em]">
            Settlement bank details
          </h4>
        </div>
        <div className="rounded-2xl border border-gray5 p-4">
          {bank ? (
            <>
              <InfoRow label="Account name" value={bank.accountName || "-"} />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <InfoRow label="Bank name" value={bank.bankName || "-"} />
                <InfoRow label="Account number" value={bank.accountNumber || "-"} />
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#E8FAEE] p-3">
                <BadgeCheck size={16} className="mt-0.5 shrink-0 text-[#13A83B]" />
                <p className="text-xs text-[#0F7A2C]">
                  Settlement account details on file. Confirm the name matches the
                  user&apos;s identity records before releasing funds.
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray3">
              No settlement bank details were provided with this request.
            </p>
          )}
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {/* Actions */}
      {isPending ? (
        mode === "rejecting" ? (
          <div className="space-y-3 border-t border-gray6 pt-4">
            <Textarea
              label="Reason for rejection"
              placeholder="Add a note explaining why this payout is being rejected (optional)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
            />
            <div className="flex gap-3">
              <Button
                title="Cancel"
                variant="secondaryLight"
                type="button"
                onClick={() => setMode("idle")}
                disabled={busy !== null}
              />
              <Button
                title="Confirm rejection"
                variant="secondary"
                type="button"
                iconLeft={<Ban size={16} />}
                onClick={runReject}
                isBusy={busy === "reject"}
                disabled={busy !== null}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 border-t border-gray6 pt-4">
            <Button
              title="Approve Payout Request"
              type="button"
              iconLeft={<CheckCircle2 size={18} />}
              onClick={runApprove}
              isBusy={busy === "approve"}
              disabled={busy !== null}
            />
            <Button
              title="Reject Request"
              variant="secondaryLight"
              type="button"
              iconLeft={<Ban size={18} />}
              className="border border-danger text-danger"
              onClick={() => setMode("rejecting")}
              disabled={busy !== null}
            />
            <p className="text-center text-xs text-gray3">
              Approving this request will trigger a bank transfer through the payment
              gateway.
            </p>
          </div>
        )
      ) : (
        <p className="border-t border-gray6 pt-4 text-center text-sm text-gray3">
          This payout request has already been {payoutStatusLabel[
            transaction.status
          ].toLowerCase()}.
        </p>
      )}
    </RightSlider>
  );
}
