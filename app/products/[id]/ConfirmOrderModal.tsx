"use client";

import Image from "next/image";
import { Edit3, Minus, Plus } from "lucide-react";

interface ConfirmOrderModalProps {
  isOpen: boolean;
  productName: string;
  productImage: string;
  sellerName: string;
  unitPrice: number;
  quantity: number;
  deliveryAddress: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onEditAddress: () => void;
  onMakePayment: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(value || 0)
    .replace(/^NGN\s?/, "\u20A6");
}

export default function ConfirmOrderModal({
  isOpen,
  productName,
  productImage,
  sellerName,
  unitPrice,
  quantity,
  deliveryAddress,
  isSubmitting = false,
  onClose,
  onIncrement,
  onDecrement,
  onEditAddress,
  onMakePayment,
}: ConfirmOrderModalProps) {
  if (!isOpen) {
    return null;
  }

  const total = unitPrice * quantity;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-order-title"
        className="relative max-h-[calc(100vh-32px)] w-full max-w-[560px] overflow-y-auto rounded-[18px] bg-white px-6 py-7 shadow-2xl sm:px-8 sm:py-8"
      >
        <div className="space-y-5">
          <h2
            id="confirm-order-title"
            className="text-[22px] font-black leading-7 text-[#4B5563]"
          >
            Confirm Order
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-[12px] font-semibold leading-4 text-[#111827]">
                Current Order
              </h3>
              <p className="mt-1 max-w-[260px] text-[10px] leading-4 text-[#111827]">
                The sum of all the total payment for the order
              </p>
            </div>

            <div className="rounded-lg border border-[#DDE0E5] bg-gradient-to-r from-[#FDFCFE] to-[#F8F9FB] p-2.5">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="flex min-w-0 gap-3">
                  <div className="relative h-[78px] w-[102px] shrink-0 overflow-hidden rounded bg-[#EEF0F4]">
                    <Image
                      src={productImage}
                      alt={productName}
                      fill
                      className="object-contain"
                      sizes="102px"
                    />
                  </div>

                  <div className="flex min-w-0 flex-col justify-center gap-2 text-[#4B5563]">
                    <p className="text-[11px] font-medium leading-4 text-[#111827]">
                      Seller
                    </p>
                    <p className="line-clamp-2 text-[12px] font-semibold leading-4">
                      {sellerName}
                    </p>
                    <div className="inline-flex w-fit items-center gap-1.5 rounded border border-[#DDE0E5] bg-white/60 px-2 py-1 text-[10px] text-[#4B5563]">
                      <span>Quantity</span>
                      <span className="font-bold">
                        {String(quantity).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <p className="text-[17px] font-bold leading-5 text-[#4B5563]">
                    {formatCurrency(total)}
                  </p>

                  <div className="inline-flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onIncrement}
                      aria-label="Increase quantity"
                      className="flex size-7 items-center justify-center rounded bg-[#4B5563] text-white"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                    <span className="min-w-4 text-center text-[16px] font-semibold text-[#4B5563]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={onDecrement}
                      aria-label="Decrease quantity"
                      disabled={quantity <= 1}
                      className="flex size-7 items-center justify-center rounded bg-[#4B5563] text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-lg bg-[#F9FAFB] p-3.5">
              <div>
                <h3 className="text-[11px] font-medium leading-4 text-black">
                  Purchase Details
                </h3>
                <p className="mt-1 text-[10px] leading-4 text-[#4B5563]">
                  Confirm purchase details before proceeding to check out
                </p>
              </div>

              <div className="h-px bg-[#DDE0E5]" />

              <div className="rounded-md bg-[#F3F4F6] p-2.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold leading-4 text-[#4B5563]">
                      Delivery Address
                    </p>
                    <p className="mt-1 break-words text-[9px] leading-4 text-[#6B7280]">
                      {deliveryAddress}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onEditAddress}
                    className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-[#017BED] bg-[#EAF9FF] px-2.5 text-[9px] font-medium text-[#4B5563]"
                  >
                    Edit Address
                    <Edit3 size={12} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#111827]">
                <p className="text-[13px] font-medium leading-5">
                  {formatCurrency(total)}
                </p>
                <p className="text-[9px] leading-4">Total Amount</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onMakePayment}
              disabled={isSubmitting}
              className="flex h-10 w-full items-center justify-center rounded-md bg-[#0669D9] text-[10px] font-medium text-white transition hover:bg-[#0553AE] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating order..." : "Make Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
