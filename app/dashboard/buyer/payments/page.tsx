"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  Filter,
  RotateCcw,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";

import Header from "../../component/header";

type TopUpStep = "form" | "bank-preview" | "card-preview" | "success";

type WalletMetric = {
  label: string;
  value: string;
  meta: string;
  icon: ReactNode;
  iconClass: string;
};

type TransactionStatus = "Successful" | "Failed";

type TransactionRow = {
  id: string;
  description: string;
  type: "ESCROW" | "Refunds" | "Reversal";
  amount: string;
  balance: string;
  dateTime: string;
  status: TransactionStatus;
};

const walletMetrics: WalletMetric[] = [
  {
    label: "Wallet balance",
    value: "₦150,000",
    meta: "Available balance",
    icon: <Wallet size={18} />,
    iconClass: "bg-[#E2F1FF] text-[#017BED]",
  },
  {
    label: "ESCROW balance",
    value: "₦150,000",
    meta: "Amount locked in active orders",
    icon: <RotateCcw size={18} />,
    iconClass: "bg-[#FBE2FF] text-[#D90BF5]",
  },
  {
    label: "Approved refunds",
    value: "₦150,000",
    meta: "Admin approved refunds",
    icon: <span className="text-lg leading-none">$</span>,
    iconClass: "bg-[#D1FAE5] text-[#13A83B]",
  },
  {
    label: "Reversed ESCROWS",
    value: "05",
    meta: "Number of escrow reversed/failed",
    icon: <ShieldCheck size={18} />,
    iconClass: "bg-[#FFF5DB] text-[#F5A400]",
  },
];

const mockTransactions: TransactionRow[] = [
  {
    id: "Transaction ID",
    description: "Transaction description",
    type: "ESCROW",
    amount: "₦150,000",
    balance: "₦150,000",
    dateTime: "21/01/2025 - 18:00pm",
    status: "Successful",
  },
  {
    id: "Transaction ID",
    description: "Transaction description",
    type: "Refunds",
    amount: "₦150,000",
    balance: "₦150,000",
    dateTime: "21/01/2025 - 18:00pm",
    status: "Failed",
  },
  {
    id: "Transaction ID",
    description: "Transaction description",
    type: "Reversal",
    amount: "₦150,000",
    balance: "₦150,000",
    dateTime: "21/01/2025 - 18:00pm",
    status: "Successful",
  },
  {
    id: "Transaction ID",
    description: "Transaction description",
    type: "ESCROW",
    amount: "₦150,000",
    balance: "₦150,000",
    dateTime: "21/01/2025 - 18:00pm",
    status: "Successful",
  },
  {
    id: "Transaction ID",
    description: "Transaction description",
    type: "ESCROW",
    amount: "₦150,000",
    balance: "₦150,000",
    dateTime: "21/01/2025 - 18:00pm",
    status: "Successful",
  },
];

const formatNaira = (rawValue: string) => {
  const numeric = Number(rawValue.replace(/[^\d]/g, ""));
  if (!numeric) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(numeric);
};

function TransactionType({ type }: { type: TransactionRow["type"] }) {
  const color =
    type === "Refunds"
      ? "text-[#FE6E00]"
      : type === "Reversal"
        ? "text-[#13A83B]"
        : "text-[#111827]";

  return <span className={color}>{type}</span>;
}

function WalletMetricCard({ metric }: { metric: WalletMetric }) {
  return (
    <article className="flex min-h-[126px] flex-col justify-between rounded-xl border border-[#DDE0E5] bg-white p-4 md:min-h-[128px] md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] leading-5 text-[#111827] md:text-sm">{metric.label}</p>
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

function TopUpPanel({
  amount,
  paymentMethod,
  step,
  onAmountChange,
  onPaymentMethodChange,
  onClose,
  onSubmit,
  onSentMoney,
}: {
  amount: string;
  paymentMethod: "bank" | "card";
  step: TopUpStep;
  onAmountChange: (value: string) => void;
  onPaymentMethodChange: (value: "bank" | "card") => void;
  onClose: () => void;
  onSubmit: () => void;
  onSentMoney: () => void;
}) {
  const formattedTotal = formatNaira(amount);

  if (step === "success") {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
        <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-[#E8FAEE] text-[#13A83B]">
          <Check size={30} />
        </span>
        <h2 className="text-xl font-medium text-[#111827]">Top up preview recorded</h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-[#6B7280]">
          This is a local preview state. No payment provider or wallet balance was updated.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 h-14 w-full max-w-sm rounded-lg bg-[#0669D9] text-lg text-white"
        >
          Close
        </button>
      </div>
    );
  }

  if (step === "bank-preview") {
    return (
      <div className="px-5 pb-8 pt-7 md:px-8">
        <div className="mb-14 flex items-start justify-between">
          <div className="text-[#0669D9]">
            <div className="text-lg font-semibold leading-5">Med</div>
            <div className="text-lg font-semibold leading-5 text-[#FE6E00]">Procure</div>
          </div>
          <div>
            <p className="text-xl font-medium text-[#111827]">BAIY wallet</p>
            <p className="mt-1 text-base text-[#111827]">
              Pay <span className="text-[#13A83B]">{formattedTotal.replace("₦", "NGN ")}</span>
            </p>
          </div>
        </div>

        <h2 className="text-center text-lg font-semibold text-[#111827]">
          Transfer {formattedTotal.replace("₦", "NGN ")} to Paystack
        </h2>

        <div className="mt-7 rounded-lg bg-[#F3F4F6] p-7">
          <p className="text-xs uppercase text-[#111827]">Bank name</p>
          <p className="mt-2 text-base text-[#111827]">Paystack-Titan</p>
          <div className="mt-9 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase text-[#111827]">Account number</p>
              <p className="mt-2 text-base text-[#111827]">0394837829</p>
            </div>
            <button type="button" aria-label="Copy account number" className="text-[#6B7280]">
              <Copy size={18} />
            </button>
          </div>
          <p className="mt-9 text-xs uppercase text-[#111827]">Amount</p>
          <p className="mt-2 text-base text-[#111827]">{formattedTotal.replace("₦", "NGN ")}</p>
        </div>

        <div className="my-8 border-t border-dashed border-[#C4C8CE]" />
        <p className="text-center text-base text-[#6B7280]">
          This account is for this transaction only
        </p>
        <button
          type="button"
          onClick={onSentMoney}
          className="mt-8 h-[61px] w-full rounded-xl border border-[#0094B5] bg-[#E5FAFF] text-lg text-[#005B70]"
        >
          I&apos;ve sent the money
        </button>
        <div className="my-11 border-t border-dashed border-[#C4C8CE]" />
        <p className="text-center text-sm text-[#6B7280]">
          Secured by <span className="font-semibold text-[#111827]">paystack</span>
        </p>
      </div>
    );
  }

  if (step === "card-preview") {
    return (
      <div className="px-5 pb-8 pt-7 md:px-8">
        <div className="mb-11 flex items-start justify-between">
          <div className="text-[#0669D9]">
            <div className="text-lg font-semibold leading-5">Med</div>
            <div className="text-lg font-semibold leading-5 text-[#FE6E00]">Procure</div>
          </div>
          <div>
            <p className="text-xl font-medium text-[#111827]">BAIY wallet</p>
            <p className="mt-1 text-base text-[#111827]">
              Pay <span className="text-[#13A83B]">{formattedTotal.replace("₦", "NGN ")}</span>
            </p>
          </div>
        </div>
        <h2 className="mb-8 text-center text-base font-semibold text-[#111827]">
          Enter your card details to pay
        </h2>
        <div className="space-y-4">
          <input
            readOnly
            placeholder="card number"
            className="h-[60px] w-full rounded-xl border border-[#DDE0E5] px-4 text-base outline-none placeholder:text-[#C4C8CE]"
          />
          <input
            readOnly
            placeholder="card number"
            className="h-[60px] w-full rounded-xl border border-[#DDE0E5] px-4 text-base outline-none placeholder:text-[#C4C8CE]"
          />
          <div className="grid grid-cols-[1fr_105px] gap-4">
            <input
              readOnly
              placeholder="EXP date (MM/YY)"
              className="h-[60px] rounded-xl border border-[#DDE0E5] px-4 text-base outline-none placeholder:text-[#C4C8CE]"
            />
            <input
              readOnly
              placeholder="CVV"
              className="h-[60px] rounded-xl border border-[#DDE0E5] px-4 text-base outline-none placeholder:text-[#C4C8CE]"
            />
          </div>
        </div>
        <div className="my-16 border-t border-dashed border-[#C4C8CE]" />
        <button
          type="button"
          onClick={onSentMoney}
          className="h-[60px] w-full rounded-lg bg-[#0669D9] text-lg text-white"
        >
          Pay {formattedTotal.replace("₦", "NGN ")}
        </button>
        <p className="mt-11 text-center text-sm text-[#6B7280]">
          Secured by <span className="font-semibold text-[#111827]">paystack</span>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex h-[90px] items-center justify-between border-b border-[#E6ECF2] px-5 md:px-8">
        <h2 className="text-base font-medium text-[#111827] md:text-xl">Top up your wallet</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close top up"
          className="text-[#111827]"
        >
          <X size={24} />
        </button>
      </div>

      <div className="px-5 pt-6 md:px-8">
        <p className="text-xs leading-[18px] text-[#111827] md:text-base md:leading-6">
          Easily top up your wallet balance via a card/transfer.
        </p>

        <div className="mt-10 space-y-5 md:mt-9">
          <label className="block">
            <span className="mb-2 block text-base text-[#111827]">Payment method</span>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(event) => onPaymentMethodChange(event.target.value as "bank" | "card")}
                className="h-[60px] w-full appearance-none rounded-xl border border-[#DDE0E5] bg-white px-4 pr-11 text-base text-[#6B7280] outline-none"
              >
                <option value="bank">Bank transfer</option>
                <option value="card">Card payment</option>
              </select>
              <ChevronDown
                size={20}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-base text-[#111827]">Amount to top up (₦)</span>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              className="h-[60px] w-full rounded-xl border border-[#DDE0E5] px-4 text-base text-[#6B7280] outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-base text-[#111827]">Total (₦)</span>
            <input
              readOnly
              value={formattedTotal}
              className="h-[60px] w-full rounded-xl border border-[#DDE0E5] bg-[#F3F4F6] px-4 text-base text-[#6B7280] outline-none"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          className="mt-9 flex h-[60px] w-full items-center justify-center gap-3 rounded-lg bg-[#0669D9] text-lg text-white md:mt-9"
        >
          Top up wallet
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}

export default function BuyerPayments() {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpStep, setTopUpStep] = useState<TopUpStep>("form");
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "card">("bank");
  const [amount, setAmount] = useState("20,000");
  const [referenceId, setReferenceId] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [dateCreated, setDateCreated] = useState("");

  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter((transaction) => {
      const refMatches =
        !referenceId ||
        transaction.id.toLowerCase().includes(referenceId.toLowerCase()) ||
        transaction.description.toLowerCase().includes(referenceId.toLowerCase());
      const typeMatches =
        !transactionType ||
        transaction.type.toLowerCase().includes(transactionType.toLowerCase());
      const dateMatches = !dateCreated || transaction.dateTime.includes(dateCreated);

      return refMatches && typeMatches && dateMatches;
    });
  }, [dateCreated, referenceId, transactionType]);

  const openTopUp = () => {
    setTopUpStep("form");
    setTopUpOpen(true);
  };

  const closeTopUp = () => {
    setTopUpOpen(false);
    setTopUpStep("form");
  };

  const submitTopUp = () => {
    setTopUpStep(paymentMethod === "bank" ? "bank-preview" : "card-preview");
  };

  return (
    <div>
      <Header title="Wallet & Payment" description="Fund and keep track of your wallet transactions." />

      <main className="min-h-[calc(100vh-100px)] bg-[#F5F7FA] p-4 md:p-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {walletMetrics.map((metric) => (
            <WalletMetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="mt-4 rounded-xl border border-[#DDE0E5] bg-white p-4 md:p-5">
          <div className="grid gap-6 md:grid-cols-[1fr_306px] md:items-start">
            <div>
              <h2 className="text-xl font-medium leading-8 text-[#000000]">BAIY&apos;s Wallet</h2>
              <p className="text-sm leading-6 text-[#000000] md:text-base">
                You can top-up your wallet via bank transfer or a debit card
              </p>
            </div>

            <button
              type="button"
              onClick={openTopUp}
              className="order-1 flex h-[60px] w-full items-center justify-center gap-3 rounded-lg bg-[#0669D9] text-lg text-white md:order-none"
            >
              <span className="text-2xl leading-none">+</span>
              Top up
            </button>

            <div className="order-2 rounded-xl border border-[#FE6E00] bg-[#FFF8F3] p-4 md:order-none md:mt-8 md:w-[304px]">
              <p className="text-sm font-medium leading-6 text-[#6B7280]">Paystack Titan</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium leading-6 text-[#6B7280]">Account number:</p>
                  <p className="text-base leading-6 text-[#111827]">0394837829</p>
                </div>
                <button
                  type="button"
                  aria-label="Copy account number"
                  className="flex size-8 items-center justify-center rounded-lg bg-[#FFD0B0] text-[#FE6E00]"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="order-3 flex items-start gap-2 md:order-none md:col-start-2 md:justify-end">
              <span className="mt-1 size-3 rounded-full bg-[#E33C13]" />
              <div>
                <p className="text-base font-medium leading-7 text-[#111827]">Low Balance</p>
                <p className="text-sm leading-5 text-[#111827]">Top up your wallet</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-xl border border-[#DDE0E5] bg-white p-4 md:p-5">
          <h2 className="text-xl font-medium leading-8 text-[#000000]">Transaction History</h2>
          <p className="mt-8 text-sm font-medium leading-6 text-[#111827] md:mt-9">
            Filter table list by:
          </p>

          <div className="mt-4 grid w-max grid-cols-[252px_252px_252px_252px] gap-5 md:w-full md:grid-cols-[minmax(0,252px)_minmax(0,252px)_minmax(0,252px)_minmax(180px,252px)]">
            <label className="block">
              <span className="mb-2 block text-base leading-6 text-[#111827]">Reference ID</span>
              <input
                value={referenceId}
                onChange={(event) => setReferenceId(event.target.value)}
                placeholder="Enter reference ID"
                className="h-[60px] w-full rounded-xl border border-[#DDE0E5] px-4 text-base outline-none placeholder:text-[#C4C8CE]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-base leading-6 text-[#111827]">Transaction type</span>
              <input
                value={transactionType}
                onChange={(event) => setTransactionType(event.target.value)}
                placeholder="Enter transaction type"
                className="h-[60px] w-full rounded-xl border border-[#DDE0E5] px-4 text-base outline-none placeholder:text-[#C4C8CE]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-base leading-6 text-[#111827]">Date created</span>
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
              className="mt-8 flex h-[60px] items-center justify-center gap-3 rounded-lg bg-[#0669D9] text-base text-white"
            >
              <Filter size={18} />
              Filter
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1020px] w-full text-left text-base">
              <thead>
                <tr className="border-b border-[#F0F2F5] text-[#6B7280]">
                  <th className="py-3 pr-6 font-medium">Transaction ID</th>
                  <th className="py-3 pr-6 font-medium">Description</th>
                  <th className="py-3 pr-6 font-medium">Transaction type</th>
                  <th className="py-3 pr-6 font-medium">Amount</th>
                  <th className="py-3 pr-6 font-medium">Balance</th>
                  <th className="py-3 pr-6 font-medium">Date &amp; Time</th>
                  <th className="py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction, index) => (
                  <tr key={`${transaction.type}-${index}`} className="border-b border-[#F0F2F5] last:border-b-0">
                    <td className="py-4 pr-6 text-[#000000]">{transaction.id}</td>
                    <td className="py-4 pr-6 text-[#000000]">{transaction.description}</td>
                    <td className="py-4 pr-6">
                      <TransactionType type={transaction.type} />
                    </td>
                    <td className="py-4 pr-6 font-medium text-[#111827]">{transaction.amount}</td>
                    <td className="py-4 pr-6 font-medium text-[#111827]">{transaction.balance}</td>
                    <td className="py-4 pr-6 text-[#111827]">{transaction.dateTime}</td>
                    <td
                      className={
                        transaction.status === "Successful"
                          ? "py-4 font-medium text-[#13A83B]"
                          : "py-4 font-medium text-[#E33C13]"
                      }
                    >
                      {transaction.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {topUpOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <button
            type="button"
            aria-label="Close top up overlay"
            onClick={closeTopUp}
            className="hidden flex-1 md:block"
          />
          <aside className="h-full w-full overflow-y-auto bg-white md:w-[500px]">
            <TopUpPanel
              amount={amount}
              paymentMethod={paymentMethod}
              step={topUpStep}
              onAmountChange={setAmount}
              onPaymentMethodChange={setPaymentMethod}
              onClose={closeTopUp}
              onSubmit={submitTopUp}
              onSentMoney={() => setTopUpStep("success")}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
