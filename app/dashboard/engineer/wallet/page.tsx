"use client";

import {
  ArrowRight,
  CalendarDays,
  Plus,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import Header from "../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";
import { useWallet } from "@/hooks/useWallet";
import { useWalletTopup } from "@/hooks/useWalletTopup";
import { useEscrowSummary } from "@/hooks/useEscrowSummary";
import { TopUpDrawer, TopUpReturnBanner } from "@/components/wallet/wallet-topup";
import { formatKobo } from "@/lib/wallet-format";

type TxRow = {
  id: string;
  description: string;
  txType: string;
  amount: string;
  balance: string;
  dateTime: string;
  status: "Successful" | "Failed";
};

/** Placeholder rows aligned with Figma “lorem” table styling; visual test stays close to reference PNGs. */
const MOCK_ROW_BASE: TxRow = {
  id: "Transaction ID",
  description: "Transaction description",
  txType: "ESCROW",
  amount: "₦0",
  balance: "₦0",
  dateTime: "00/00/0000",
  status: "Successful",
};

const MOCK_ROWS: TxRow[] = Array.from({ length: 6 }, () => ({ ...MOCK_ROW_BASE }));

export default function EngineerWallet() {
  const { wallet, isLoading: walletLoading } = useWallet();
  const { summary: escrowSummary, isLoading: escrowLoading } =
    useEscrowSummary();
  const {
    open: topUpOpen,
    openTopUp,
    returnStatus,
    dismissReturnStatus,
    panelProps,
  } = useWalletTopup({ callbackPath: "/dashboard/engineer/wallet" });

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

  return (
    <ProtectedRoute requiredRole={UserRole.ENGINEER}>
      <div>
        <Header
          title="Wallet"
          description="Review and manage your incoming service requests"
        />

        <div className="min-h-[calc(100vh-100px)] space-y-4 bg-[#F5F7FA] p-3 md:p-6">
          <TopUpReturnBanner status={returnStatus} onDismiss={dismissReturnStatus} />
          <div className="grid grid-cols-2 gap-3">
            <article className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[#6B7280]">Available earnings</p>
                  <p className="mt-2 text-[28px] font-semibold leading-none text-[#111827]">
                    {availableLabel}
                  </p>
                  <p className="mt-2 text-xs text-[#9CA3AF]">Earnings from processed orders</p>
                </div>
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#FFF4E8]">
                  <Users className="size-6 text-[#D97627]" strokeWidth={1.5} />
                </span>
              </div>
            </article>

            <article className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[#6B7280]">ESCROW balance</p>
                  <p className="mt-2 text-[28px] font-semibold leading-none text-[#111827]">
                    {escrowLabel}
                  </p>
                  <p className="mt-2 text-xs text-[#9CA3AF]">Funds pending release</p>
                </div>
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#D1FAE5]">
                  <Users className="size-6 text-[#059669]" strokeWidth={1.5} />
                </span>
              </div>
            </article>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-[#B3D4FC] bg-[#F0F7FF] p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <Shield className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="font-semibold text-[#111827]">Payout</p>
                <p className="text-sm text-[#4B5563]">
                  You can only request payments on your available earnings.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={openTopUp}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-white px-5 text-sm font-semibold text-primary"
              >
                <Plus className="size-4" aria-hidden />
                Top up
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white"
              >
                Request payout
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <section className="rounded-3xl border border-[#E6ECF2] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-xl font-semibold text-[#111827]">Transaction history</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Filter table list by:</p>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_190px_150px]">
              <input
                aria-label="Reference ID filter"
                type="text"
                placeholder="Enter reference ID"
                readOnly
                className="h-11 rounded-xl border border-[#E6ECF2] px-4 text-sm text-[#9CA3AF] outline-none"
              />
              <input
                aria-label="Transaction type filter"
                type="text"
                placeholder="Enter transaction type"
                readOnly
                className="h-11 rounded-xl border border-[#E6ECF2] px-4 text-sm text-[#9CA3AF] outline-none"
              />
              <div className="relative">
                <input
                  aria-label="Transaction date filter"
                  type="text"
                  placeholder="DD/MM/YY"
                  readOnly
                  className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 pr-10 text-sm text-[#9CA3AF] outline-none"
                />
                <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
              </div>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white"
              >
                <SlidersHorizontal className="size-4" aria-hidden />
                Filter
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E6ECF2] text-left text-[#6B7280]">
                    <th className="pb-3 pr-4 font-medium">Transaction ID</th>
                    <th className="pb-3 pr-4 font-medium">Description</th>
                    <th className="hidden md:table-cell pb-3 pr-4 font-medium">Transaction type</th>
                    <th className="hidden md:table-cell pb-3 pr-4 font-medium">Amount</th>
                    <th className="hidden md:table-cell pb-3 pr-4 font-medium">Balance</th>
                    <th className="hidden md:table-cell pb-3 pr-4 font-medium whitespace-nowrap">Date &amp; Time</th>
                    <th className="hidden md:table-cell pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ROWS.map((row, i) => (
                    <tr key={i} className="border-b border-[#E6ECF2] last:border-0">
                      <td className="py-3 pr-4 text-[#111827]">{row.id}</td>
                      <td className="py-3 pr-4 text-[#4B5563]">{row.description}</td>
                      <td className="hidden md:table-cell py-3 pr-4 text-[#4B5563]">{row.txType}</td>
                      <td className="hidden md:table-cell py-3 pr-4 font-medium text-[#111827]">{row.amount}</td>
                      <td className="hidden md:table-cell py-3 pr-4 font-medium text-[#111827]">{row.balance}</td>
                      <td className="hidden md:table-cell py-3 pr-4 whitespace-nowrap text-[#6B7280]">{row.dateTime}</td>
                      <td className="hidden md:table-cell py-3">
                        <span
                          className={
                            row.status === "Successful"
                              ? "font-medium text-[#34A853]"
                              : "font-medium text-[#DC2626]"
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <TopUpDrawer open={topUpOpen} panelProps={panelProps} />
    </ProtectedRoute>
  );
}
