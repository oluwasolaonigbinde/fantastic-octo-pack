"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  Filter,
  RotateCcw,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import Header from "../../component/header";
import { useMyPaymentsQuery } from "@/hooks/queries/payments";
import { useWallet } from "@/hooks/useWallet";
import { useWalletTopup } from "@/hooks/useWalletTopup";
import { useEscrowSummary } from "@/hooks/useEscrowSummary";
import { TopUpDrawer, TopUpReturnBanner } from "@/components/wallet/wallet-topup";
import type { PaymentIntent, PaymentStatus } from "@/types/payment";

// ─── Helpers ────────────────────────────────────────────────────────────────

const koboToNaira = (kobo: number) => kobo / 100;

const formatNaira = (naira: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} - ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const intentLabel: Record<PaymentIntent, string> = {
  order_payment: "ESCROW",
  wallet_topup: "Top-up",
  service_payment: "Service",
  withdrawal: "Withdrawal",
  escrow_release: "Reversal",
  refund: "Refunds",
};

const intentColor: Record<PaymentIntent, string> = {
  order_payment: "text-[#111827]",
  wallet_topup: "text-[#017BED]",
  service_payment: "text-[#111827]",
  withdrawal: "text-[#111827]",
  escrow_release: "text-[#13A83B]",
  refund: "text-[#FE6E00]",
};

const statusColor: Record<PaymentStatus, string> = {
  success: "text-[#13A83B]",
  failed: "text-[#E33C13]",
  rejected: "text-[#E33C13]",
  abandoned: "text-[#E33C13]",
  pending_approval: "text-[#F5A400]",
  pending: "text-[#F5A400]",
  refunded: "text-[#017BED]",
};

// ─── Subcomponents ───────────────────────────────────────────────────────────

type WalletMetric = {
  label: string;
  value: string;
  meta: string;
  icon: ReactNode;
  iconClass: string;
};

function WalletMetricCard({ metric }: { metric: WalletMetric }) {
  return (
    <article className="flex min-h-[126px] flex-col justify-between rounded-xl border border-[#DDE0E5] bg-white p-4 md:min-h-[128px] md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] leading-5 text-[#111827] md:text-sm">
            {metric.label}
          </p>
          <p className="mt-1 text-base font-medium leading-6 text-[#111827] md:text-lg">
            {metric.value}
          </p>
        </div>
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg md:size-10 ${metric.iconClass}`}
        >
          {metric.icon}
        </span>
      </div>
      <p className="text-[10px] leading-5 text-[#053782] md:text-xs md:text-[#6B7280]">
        {metric.meta}
      </p>
    </article>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BuyerPayments() {
  const {
    wallet,
    isLoading: walletLoading,
    isError: walletError,
    message: walletMessage,
  } = useWallet();

  const { data: paymentsData, isLoading: paymentsLoading } =
    useMyPaymentsQuery();
  const myPayments = paymentsData?.payments ?? null;

  const [copied, setCopied] = useState(false);

  const [referenceId, setReferenceId] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [dateCreated, setDateCreated] = useState("");

  const { summary: escrowSummary } = useEscrowSummary();

  const {
    open: topUpOpen,
    openTopUp,
    returnStatus: topupReturnStatus,
    dismissReturnStatus,
    panelProps,
  } = useWalletTopup({ callbackPath: "/dashboard/buyer/payments" });

  const walletBalanceNaira = wallet
    ? koboToNaira(wallet.availableBalance)
    : null;
  const escrowBalanceNaira = escrowSummary
    ? koboToNaira(escrowSummary.expectedNetKobo)
    : null;
  const isLowBalance = walletBalanceNaira === 0;
  const accountNumber = wallet?.dedicatedAccount?.accountNumber ?? null;
  const bankName = wallet?.dedicatedAccount?.bankName ?? "Paystack-Titan";
  //TODO get the actual data dont do this stupid calculation
  const approvedRefundsTotal = useMemo(() => {
    if (!myPayments) return 0;
    return myPayments
      .filter((p) => p.intent === "refund" && p.status === "success")
      .reduce((sum, p) => sum + p.amount, 0);
  }, [myPayments]);

  const reversedEscrowCount = useMemo(() => {
    if (!myPayments) return 0;
    return myPayments.filter((p) => p.intent === "escrow_release").length;
  }, [myPayments]);

  const walletMetrics: WalletMetric[] = [
    {
      label: "Wallet balance",
      value:
        walletBalanceNaira !== null ? formatNaira(walletBalanceNaira) : "—",
      meta: "Available balance",
      icon: <Wallet size={18} />,
      iconClass: "bg-[#E2F1FF] text-[#017BED]",
    },
    {
      label: "ESCROW balance",
      value:
        escrowBalanceNaira !== null ? formatNaira(escrowBalanceNaira) : "—",
      meta: "Amount locked in active orders",
      icon: <RotateCcw size={18} />,
      iconClass: "bg-[#FBE2FF] text-[#D90BF5]",
    },
    {
      label: "Approved refunds",
      value: formatNaira(koboToNaira(approvedRefundsTotal)),
      meta: "Admin approved refunds",
      icon: <span className="text-lg leading-none">$</span>,
      iconClass: "bg-[#D1FAE5] text-[#13A83B]",
    },
    {
      label: "Reversed ESCROWS",
      value: String(reversedEscrowCount).padStart(2, "0"),
      meta: "Number of escrow reversed/failed",
      icon: <ShieldCheck size={18} />,
      iconClass: "bg-[#FFF5DB] text-[#F5A400]",
    },
  ];

  const filteredTransactions = useMemo(() => {
    if (!myPayments) return [];
    return myPayments.filter((t) => {
      if (t.status === "pending") return false;
      const label = intentLabel[t.intent] ?? t.intent;
      const refMatches =
        !referenceId ||
        t.reference.toLowerCase().includes(referenceId.toLowerCase()) ||
        t._id.toLowerCase().includes(referenceId.toLowerCase());
      const typeMatches =
        !transactionType ||
        label.toLowerCase().includes(transactionType.toLowerCase());
      const dateMatches =
        !dateCreated || formatDateTime(t.createdAt).includes(dateCreated);
      return refMatches && typeMatches && dateMatches;
    });
  }, [myPayments, referenceId, transactionType, dateCreated]);

  const copyAccountNumber = async () => {
    if (!accountNumber) return;
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div>
      <Header
        title="Wallet & Payment"
        description="Fund and keep track of your wallet transactions."
      />

      <main className="min-h-[calc(100vh-100px)] bg-[#F5F7FA] p-4 md:p-6">
        {walletError && (
          <div className="mb-4 rounded-lg border border-[#E33C13] bg-[#FFF5F3] px-4 py-3 text-sm text-[#E33C13]">
            {walletMessage || "Failed to load wallet data."}
          </div>
        )}

        <TopUpReturnBanner
          status={topupReturnStatus}
          onDismiss={dismissReturnStatus}
        />

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {walletMetrics.map((metric) => (
            <WalletMetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="mt-4 rounded-xl border border-[#DDE0E5] bg-white p-4 md:p-5">
          <div className="grid gap-6 md:grid-cols-[1fr_306px] md:items-start">
            <div>
              <h2 className="text-xl font-medium leading-8 text-[#000000]">
                BAIY&apos;s Wallet
              </h2>
              <p className="text-sm leading-6 text-[#000000] md:text-base">
                You can top-up your wallet via bank transfer or a debit card
              </p>
            </div>

            <button
              type="button"
              onClick={() => openTopUp()}
              className="order-1 flex h-[60px] w-full items-center justify-center gap-3 rounded-lg bg-[#0669D9] text-lg text-white md:order-none"
            >
              <span className="text-2xl leading-none">+</span>
              Top up
            </button>

            <div className="order-2 rounded-xl border border-[#FE6E00] bg-[#FFF8F3] p-4 md:order-none md:mt-8 md:w-[304px]">
              <p className="text-sm font-medium leading-6 text-[#6B7280]">
                {bankName}
              </p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium leading-6 text-[#6B7280]">
                    Account number:
                  </p>
                  {walletLoading && !accountNumber ? (
                    <p className="mt-1 h-6 w-28 animate-pulse rounded bg-[#DDE0E5]" />
                  ) : (
                    <p className="text-base leading-6 text-[#111827]">
                      {accountNumber ?? "Not available"}
                    </p>
                  )}
                </div>
                {accountNumber && (
                  <button
                    type="button"
                    aria-label="Copy account number"
                    onClick={copyAccountNumber}
                    className="flex size-8 items-center justify-center rounded-lg bg-[#FFD0B0] text-[#FE6E00]"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                )}
              </div>
            </div>

            {isLowBalance && (
              <div className="order-3 flex items-start gap-2 md:order-none md:col-start-2 md:justify-end">
                <span className="mt-1 size-3 rounded-full bg-[#E33C13]" />
                <div>
                  <p className="text-base font-medium leading-7 text-[#111827]">
                    Low Balance
                  </p>
                  <p className="text-sm leading-5 text-[#111827]">
                    Top up your wallet
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-xl border border-[#DDE0E5] bg-white p-4 md:p-5">
          <h2 className="text-xl font-medium leading-8 text-[#000000]">
            Transaction History
          </h2>
          <p className="mt-8 text-sm font-medium leading-6 text-[#111827] md:mt-9">
            Filter table list by:
          </p>

          <div className="mt-4 grid w-max grid-cols-[252px_252px_252px_252px] gap-5 md:w-full md:grid-cols-[minmax(0,252px)_minmax(0,252px)_minmax(0,252px)_minmax(180px,252px)]">
            <label className="block">
              <span className="mb-2 block text-base leading-6 text-[#111827]">
                Reference ID
              </span>
              <input
                value={referenceId}
                onChange={(event) => setReferenceId(event.target.value)}
                placeholder="Enter reference ID"
                className="h-[60px] w-full rounded-xl border border-[#DDE0E5] px-4 text-base outline-none placeholder:text-[#C4C8CE]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-base leading-6 text-[#111827]">
                Transaction type
              </span>
              <div className="relative">
                <select
                  value={transactionType}
                  onChange={(event) => setTransactionType(event.target.value)}
                  className="h-[60px] w-full appearance-none rounded-xl border border-[#DDE0E5] bg-white px-4 pr-11 text-base text-[#6B7280] outline-none"
                >
                  <option value="">All types</option>
                  <option value="ESCROW">ESCROW</option>
                  <option value="Refunds">Refunds</option>
                  <option value="Reversal">Reversal</option>
                  <option value="Top-up">Top-up</option>
                  <option value="Withdrawal">Withdrawal</option>
                </select>
                <ChevronDown
                  size={20}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-base leading-6 text-[#111827]">
                Date created
              </span>
              <div className="relative">
                <input
                  value={dateCreated}
                  onChange={(event) => setDateCreated(event.target.value)}
                  placeholder="DD/MM/YY"
                  className="h-[60px] w-full rounded-xl border border-[#DDE0E5] px-4 pr-12 text-base outline-none placeholder:text-[#C4C8CE]"
                />
                <CalendarDays
                  size={20}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
                />
              </div>
            </label>
            <button
              type="button"
              onClick={() => {
                setReferenceId(referenceId);
                setTransactionType(transactionType);
                setDateCreated(dateCreated);
              }}
              className="mt-8 flex h-[60px] items-center justify-center gap-3 rounded-lg bg-[#0669D9] text-base text-white"
            >
              <Filter size={18} />
              Filter
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {paymentsLoading ? (
              <div className="flex h-40 items-center justify-center text-sm text-[#6B7280]">
                Loading transactions…
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-[#6B7280]">
                No transactions found.
              </div>
            ) : (
              <table className="min-w-[1020px] w-full text-left text-base">
                <thead>
                  <tr className="border-b border-[#F0F2F5] text-[#6B7280]">
                    <th className="py-3 pr-6 font-medium">Transaction ID</th>
                    <th className="py-3 pr-6 font-medium">Description</th>
                    <th className="py-3 pr-6 font-medium">Transaction type</th>
                    <th className="py-3 pr-6 font-medium">Amount</th>
                    <th className="py-3 pr-6 font-medium">Date &amp; Time</th>
                    <th className="py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction._id}
                      className="border-b border-[#F0F2F5] last:border-b-0"
                    >
                      <td className="py-4 pr-6 text-[#000000]">
                        {transaction.reference}
                      </td>
                      <td className="py-4 pr-6 text-[#000000]">
                        {intentLabel[transaction.intent] ?? transaction.intent}{" "}
                        transaction
                      </td>
                      <td
                        className={`py-4 pr-6 ${intentColor[transaction.intent] ?? "text-[#111827]"}`}
                      >
                        {intentLabel[transaction.intent] ?? transaction.intent}
                      </td>
                      <td className="py-4 pr-6 font-medium text-[#111827]">
                        {formatNaira(koboToNaira(transaction.amount))}
                      </td>
                      <td className="py-4 pr-6 text-[#111827]">
                        {formatDateTime(transaction.createdAt)}
                      </td>
                      <td
                        className={`py-4 font-medium capitalize ${statusColor[transaction.status] ?? "text-[#111827]"}`}
                      >
                        {transaction.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      <TopUpDrawer open={topUpOpen} panelProps={panelProps} />
    </div>
  );
}
