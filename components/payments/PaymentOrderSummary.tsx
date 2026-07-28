"use client";

import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  Headphones,
  Info,
  Lock,
  Shield,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

interface PaymentOrderSummaryProps {
  productName: string;
  productImage?: string;
  quantity?: number;
  orderId?: string;
  invoiceId?: string;
  itemsTotal: number;
  /** Omitted when the order carries no separate delivery charge. */
  deliveryFee?: number;
  total: number;
  formatAmount: (value: number) => string;
  onPay: () => void;
  isPaying?: boolean;
  disabled?: boolean;
  /** Overrides the default "Pay <total> Securely" CTA copy. */
  payLabel?: string;
}

const TRUST_ITEMS = [
  {
    Icon: BadgeCheck,
    title: "100% Secure Payments",
    description: "Your money is protected",
  },
  {
    Icon: Shield,
    title: "Dispute Protection",
    description: "We've got you covered",
  },
  {
    Icon: ClipboardCheck,
    title: "Verified Suppliers",
    description: "All suppliers are verified",
  },
  {
    Icon: Headphones,
    title: "24/7 Support",
    description: "We're here to help",
  },
];

/**
 * Right column of the payment screen: order summary, totals, trust badges and
 * the pay CTA. Shared by the public checkout page and the buyer order payment
 * view.
 */
export function PaymentOrderSummary({
  productName,
  productImage,
  quantity,
  orderId,
  invoiceId,
  itemsTotal,
  deliveryFee,
  total,
  formatAmount,
  onPay,
  isPaying = false,
  disabled = false,
  payLabel,
}: PaymentOrderSummaryProps) {
  const title =
    quantity && quantity > 1 ? `${productName} (x${quantity})` : productName;

  return (
    <aside className="overflow-hidden rounded-xl border border-[#C4C6D0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2 border-b border-[#C4C6D0] px-6 py-6">
        <ShoppingBag size={18} className="shrink-0 text-[#001736]" />
        <h2 className="text-xl font-semibold leading-7 text-[#001736]">
          Order Summary
        </h2>
      </div>

      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-start gap-4 rounded-lg bg-[#EFF4FF] p-4">
          <div className="size-24 shrink-0 overflow-hidden rounded-md bg-white">
            {productImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productImage}
                alt={productName}
                className="size-full object-contain"
              />
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-base font-medium leading-7 text-[#001736]">
              {title}
            </h3>
            <div className="flex flex-col gap-0.5 text-xs font-medium leading-5 text-[#4B5563]">
              {orderId ? (
                <p>
                  Order ID: <span className="text-[#111827]">{orderId}</span>
                </p>
              ) : null}
              {invoiceId ? (
                <p>
                  Invoice ID: <span className="text-[#111827]">{invoiceId}</span>
                </p>
              ) : null}
            </div>
            <p className="text-base font-semibold leading-[18px] text-[#111827]">
              {formatAmount(itemsTotal)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <span className="text-sm leading-5 text-[#4B5563]">Items total</span>
            <span className="text-sm font-bold leading-6 text-[#111827]">
              {formatAmount(itemsTotal)}
            </span>
          </div>
          {deliveryFee !== undefined ? (
            <div className="flex items-start justify-between gap-4">
              <span className="flex items-center gap-1 text-sm leading-5 text-[#4B5563]">
                Delivery fee
                <Info size={12} className="shrink-0" />
              </span>
              <span className="text-sm font-bold leading-6 text-[#111827]">
                {formatAmount(deliveryFee)}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4 border-t border-[#C4C6D0] pt-4">
            <span className="text-base font-medium leading-7 text-[#111827]">
              Total amount
            </span>
            <span className="text-2xl font-bold leading-10 text-[#0669D9]">
              {formatAmount(total)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-lg border border-[#316BF3]/20 bg-[#316BF3]/5 p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#0669D9]" />
            <div className="flex flex-col gap-0.5">
              <h4 className="text-xs font-bold leading-5 text-[#111827]">
                BAIY Trade Assurance
              </h4>
              <p className="text-xs leading-[18px] text-[#4B5563]">
                Your payment is held securely in escrow and released only after
                successful delivery and confirmation.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {TRUST_ITEMS.map(({ Icon, title: itemTitle, description }) => (
              <div key={itemTitle} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded bg-[#00A874]/10">
                  <Icon size={16} className="text-[#00A874]" />
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-5 text-[#111827]">
                    {itemTitle}
                  </span>
                  <span className="text-[10px] leading-5 text-[#4B5563]">
                    {description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onPay}
          disabled={disabled || isPaying}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#0669D9] py-4 text-base font-medium text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] disabled:opacity-60"
        >
          <Lock size={16} className="shrink-0" />
          {payLabel ??
            (isPaying
              ? "Processing payment…"
              : `Pay ${formatAmount(total)} Securely`)}
          <ArrowRight size={16} className="shrink-0" />
        </button>

        <div className="flex items-center justify-center gap-6 text-[10px] font-bold uppercase leading-[15px] tracking-[1px] text-[#4B5563]">
          <span className="flex items-center gap-1">
            <Lock size={12} className="text-[#13A83B]" />
            256-bit SSL
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-[#13A83B]" />
            Secure Checkout
          </span>
        </div>
      </div>
    </aside>
  );
}

export default PaymentOrderSummary;
