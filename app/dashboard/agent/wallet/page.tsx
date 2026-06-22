"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BadgeDollarSign, Layers3, Percent, Users, ArrowDownLeft, ArrowUpRight, CreditCard, X, ArrowRight, PhoneCall, Coins } from "lucide-react";

import Header from "../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";
import { useWallet } from "@/hooks/useWallet";
import { useEscrowSummary } from "@/hooks/useEscrowSummary";
import { formatKobo } from "@/lib/wallet-format";
import { agentWalletTransactions } from "../mockdata";

function WithdrawModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold text-[#111827]">Withdraw Funds</p>
          <button type="button" onClick={onClose} className="text-[#6B7280]">
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-xs text-[#6B7280]">Transfer money to your bank account</p>

        {/* Available balance pill */}
        <div className="mb-4 rounded-xl border-2 border-[#059669] bg-[#F0FDF4] px-4 py-3 text-center">
          <p className="text-xs text-[#6B7280]">Available:</p>
          <p className="text-xl font-bold text-[#111827]">₦150,000</p>
        </div>

        <label className="mb-1 block text-sm text-[#374151]">Amount to withdraw</label>
        <input
          type="number"
          placeholder="Enter amount to withdraw"
          className="mb-4 w-full rounded-xl border border-[#DDE0E5] px-4 py-2.5 text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0669D9]/30"
        />

        <label className="mb-1 block text-sm text-[#374151]">Withdraw to</label>
        <input
          type="text"
          defaultValue="GT Bank - 004475839"
          className="mb-6 w-full rounded-xl border border-[#DDE0E5] px-4 py-2.5 text-sm text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0669D9]/30"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#F97316] px-4 py-2.5 text-sm font-medium text-[#F97316]"
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-[#0669D9] px-4 py-2.5 text-sm font-medium text-white"
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentWalletPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const queryShowsWithdraw = searchParams.get("modal") === "withdraw";

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

  const closeWithdraw = () => {
    setShowWithdraw(false);
    if (queryShowsWithdraw) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("modal");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  };

  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      {(showWithdraw || queryShowsWithdraw) && (
        <WithdrawModal onClose={closeWithdraw} />
      )}

      <Header
        title="Wallet & Earnings"
        description="Wednesday 10th September, 2025"
        mobileChrome="profile"
      />
      <main className="min-h-[1373px] space-y-4 bg-[#F5F7FA] px-3 py-4 md:min-h-[calc(100vh-100px)] md:p-4">

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Available balance", value: availableLabel, meta: "Ready to withdraw", icon: <BadgeDollarSign size={18} className="text-[#F97316]" />, bg: "#FFE6D6" },
            { label: "Pending balance", value: escrowLabel, meta: "Commissions not yet released", icon: <Layers3 size={18} className="text-[#10B981]" />, bg: "#D7FBE1" },
            { label: "Total earnings", value: "₦150,000", meta: "Your earnings", icon: <Percent size={20} className="text-[#F59E0B]" />, bg: "#FFF1C2" },
            { label: "Number of withdrawals", value: "05", meta: "Withdrawal count", icon: <Layers3 size={18} className="text-[#0D8BFF]" />, bg: "#E4F5FF" },
          ].map((card) => (
            <div
              key={card.label}
                className="flex min-h-[120px] flex-col justify-between overflow-hidden rounded-[14px] border border-[#DDE0E5] bg-white"
              >
                <div className="flex items-start justify-between gap-2 px-3 pb-2 pt-5 md:px-5 md:pt-7">
                  <div>
                    <p className="text-xs text-[#6B7280]">{card.label}</p>
                    <p className="mt-2 text-[17px] font-medium text-[#111827] md:text-xl">{card.value}</p>
                  </div>
                  <span
                    className="flex size-8 items-center justify-center rounded-lg md:size-11"
                    style={{ backgroundColor: card.bg }}
                  >
                    {card.icon}
                  </span>
                </div>
                <p className="bg-[#FCFCFD] px-3 py-3 text-[11px] text-[#003B88] md:px-5 md:text-sm">{card.meta}</p>
            </div>
          ))}
        </div>

        {/* Earnings breakdown */}
        <div className="rounded-[12px] border border-[#E9EDF3] bg-white p-4 md:p-5">
          <p className="mb-1 text-lg font-medium text-[#111827]">Earnings Breakdown</p>
          <p className="mb-4 text-xs text-[#6B7280]">Your income sources</p>
          <div className="grid gap-4 md:grid-cols-3 md:gap-0">
            <div className="flex items-center gap-3 md:pr-12">
              <span className="flex size-11 items-center justify-center rounded-lg bg-[#EAF8FF]">
                <Users size={16} className="text-[#0669D9]" />
              </span>
              <div>
                <p className="text-xs text-[#6B7280]">Subscription commissions</p>
                <p className="font-semibold text-[#111827]">₦150,000</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:border-l md:border-[#DDE0E5] md:px-14">
              <span className="flex size-11 items-center justify-center rounded-lg bg-[#FFF7ED]">
                <PhoneCall size={16} className="text-[#F97316]" />
              </span>
              <div>
                <p className="text-xs text-[#6B7280]">Escrow commissions</p>
                <p className="font-semibold text-[#111827]">₦150,000</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:border-l md:border-[#DDE0E5] md:px-14">
              <span className="flex size-11 items-center justify-center rounded-lg bg-[#FEF3C7]">
                <Coins size={16} className="text-[#F59E0B]" />
              </span>
              <div>
                <p className="text-xs text-[#6B7280]">Bonuses & rewards</p>
                <p className="font-semibold text-[#111827]">₦150,000</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bank accounts */}
        <div className="rounded-[12px] bg-white p-4 md:min-h-[272px] md:p-5">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-7">
            <div>
              <p className="text-lg font-medium text-[#111827]">Bank Accounts</p>
              <p className="text-xs text-[#6B7280]">Manage your withdrawal accounts.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowWithdraw(true)}
              className="inline-flex h-[48px] w-full items-center justify-center gap-3 rounded-[10px] bg-[#0669D9] px-5 text-base font-medium text-white md:h-[60px] md:w-[250px]"
            >
              Withdraw
              <ArrowRight size={22} />
            </button>
          </div>

          <div className="mt-4 flex min-h-[112px] flex-col items-start justify-center gap-4 rounded-[14px] border border-[#E5E7EB] bg-[#FAFBFC] px-4 py-5 md:mt-[60px] md:min-h-[110px] md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg bg-[#EAF8FF]">
                <CreditCard size={20} className="text-[#0D8BFF]" />
              </span>
              <div>
                <p className="text-sm font-medium text-[#111827]">GT Bank</p>
                <p className="text-xs text-[#6B7280]">0056789000 | Samuel Smart</p>
              </div>
            </div>
            <span className="inline-flex h-7 w-28 items-center justify-center rounded-lg bg-[#FEF3C7] text-xs font-medium text-[#F0A500]">
              Primary
            </span>
          </div>
        </div>

        {/* Transaction history */}
        <div className="hidden rounded-[12px] bg-white p-5 md:block">
          <p className="mb-1 text-lg font-medium text-[#111827]">Transaction History</p>
          <p className="mb-4 text-xs text-[#6B7280]">All your wallet activities</p>
          <ul>
            {agentWalletTransactions.map((tx) => (
              <li key={tx.id} className="flex items-center gap-4 border-b border-[#EEF0F3] px-6 py-6 last:border-b-0">
                <span
                  className={`flex size-[62px] items-center justify-center rounded-[10px] ${
                    tx.type === "credit" ? "bg-[#D1FAE5]" : "bg-[#FEE2E2]"
                  }`}
                >
                  {tx.type === "credit" ? (
                    <ArrowDownLeft size={18} className="text-[#059669]" />
                  ) : (
                    <ArrowUpRight size={18} className="text-[#DC2626]" />
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-base font-medium text-[#111827]">{tx.description}</p>
                  <p className="text-xs text-[#6B7280]">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-semibold ${
                      tx.type === "credit" ? "text-[#059669]" : "text-[#DC2626]"
                    }`}
                  >
                    {tx.amount}
                  </p>
                  <span className="rounded-full bg-[#D1FAE5] px-2 py-0.5 text-xs text-[#059669]">
                    {tx.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

      </main>
    </ProtectedRoute>
  );
}
