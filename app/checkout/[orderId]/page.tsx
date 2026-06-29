"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";

import { PublicLayout } from "@/components/layout";
import Banner from "@/components/features/public/Banner";
import { BigLoader } from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchOrderDetail } from "@/store/slices/order-slice";
import { useWallet } from "@/hooks/useWallet";
import { useOrderPayment } from "@/hooks/useOrderPayment";
import { koboToNaira } from "@/lib/wallet-format";
import { getOrderProductImage, getPersonName } from "@/constants/demoBuyerOrders";
import { buildMessagingComposeHref } from "@/utils/messagingRoutes";
import type { Order, OrderPaymentMethod } from "@/types/order";

type PaymentOption = {
  label: string;
  /** Functional rails carry a method; disabled rails are "coming soon". */
  method: OrderPaymentMethod | null;
};

const paymentMethods: PaymentOption[] = [
  { label: "BAIY trade assurance", method: "wallet" },
  { label: "Paystack", method: "paystack" },
  { label: "Flutterwave", method: null },
  { label: "Google Pay", method: null },
  { label: "Apple Pay", method: null },
  { label: "Bank wallet", method: null },
];

/**
 * The money-in states (escrow funded). The live API has no `paymentStatus`
 * field — payment is encoded in `status`.
 */
const PAID_STATUSES = ["paid", "processing", "fulfilled", "completed"];
const isOrderPaid = (status?: string) => PAID_STATUSES.includes(status ?? "");

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(value || 0);

const getSellerId = (order: Order | null): string => {
  if (!order) return "";
  if (order.seller && typeof order.seller === "object") return order.seller._id;
  return typeof order.seller === "string" ? order.seller : "";
};

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const orderId = params.orderId as string;

  const { currentOrder, isLoading, message } = useAppSelector(
    (state) => state.order,
  );
  const { data: authData } = useAppSelector((state) => state.auth);
  const token = authData?.tokens?.accessToken;
  const role = authData?.role;

  const { wallet } = useWallet();
  const {
    isPaying,
    payError,
    isPaid,
    payResult,
    pay,
    reset: resetPayment,
  } = useOrderPayment({
    orderId,
    callbackPath: `/checkout/${orderId}`,
  });

  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0].label);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (token && orderId) {
      dispatch(fetchOrderDetail({ token, orderId }));
    }
  }, [token, orderId, dispatch]);

  const order = currentOrder;
  const paid = isOrderPaid(order?.status);

  // Surface the receipt the moment a payment settles (wallet inline or on the
  // return trip from Paystack).
  useEffect(() => {
    // Sync the settled-payment signal from Redux into the receipt modal.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isPaid) setShowReceipt(true);
  }, [isPaid]);

  const orderTotal = order?.totalPrice ?? 0;
  const quantity = order?.quantity ?? 1;
  const unitPrice = quantity > 0 ? orderTotal / quantity : orderTotal;
  const productName = order?.productName ?? "Product";
  const productImage = getOrderProductImage(order);
  const supplierName = getPersonName(order?.seller, "Supplier");
  const sellerId = getSellerId(order ?? null);
  const buyerName = getPersonName(order?.buyer, "You");

  const walletNaira = wallet ? koboToNaira(wallet.availableBalance) : 0;
  const selectedOption = paymentMethods.find((m) => m.label === selectedPayment);
  const insufficientWallet =
    selectedOption?.method === "wallet" && walletNaira < orderTotal;

  const payReference =
    (typeof payResult?.reference === "string" && payResult.reference) ||
    order?.paymentReference ||
    "—";

  const trackHref = `/dashboard/buyer/orders/${orderId}`;
  const chatHref =
    buildMessagingComposeHref(role, sellerId) ?? "/dashboard/buyer/messages";

  const handleSubmitPayment = () => {
    if (!selectedOption?.method || insufficientWallet) return;
    void pay(selectedOption.method);
  };

  if (isLoading && !order) {
    return (
      <PublicLayout contentClassName="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <BigLoader />
        </div>
      </PublicLayout>
    );
  }

  if (!order) {
    return (
      <PublicLayout contentClassName="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-700">Order not found</h1>
            <p className="mt-2 text-gray-500">
              {message || "We couldn't find this order."}
            </p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout
      banner={
        <Banner
          title="Checkout"
          breadcrumbs={[
            { label: "Products", href: "/products" },
            { label: "Checkout" },
          ]}
        />
      }
      contentClassName="min-h-screen flex flex-col bg-[#F9FAFB]"
    >
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-[1100px] space-y-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#111827]"
          >
            <ArrowLeft size={17} />
            Go Back
          </button>

          {paid && !showReceipt ? (
            <section className="rounded-2xl border border-[#DDE0E5] bg-white p-6 text-center">
              <CheckCircle2 size={44} className="mx-auto text-[#16A34A]" />
              <h1 className="mt-4 text-lg font-medium text-[#111827]">
                This order is already paid
              </h1>
              <p className="mt-2 text-sm text-[#6B7280]">
                Your payment is held in escrow until delivery is confirmed.
              </p>
              <button
                type="button"
                onClick={() => router.push(trackHref)}
                className="mx-auto mt-6 h-12 w-full max-w-[260px] rounded-xl bg-primary text-sm font-medium text-white"
              >
                Track order
              </button>
            </section>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
                <h1 className="text-lg font-medium text-[#111827]">Payment</h1>
                <p className="mt-1 text-sm font-medium text-[#111827]">
                  Payment options
                </p>
                <p className="mt-0.5 text-sm text-[#6B7280]">
                  Select preferred payment method to proceed
                </p>

                <div className="mt-6 rounded-2xl border border-[#DDE0E5]">
                  {paymentMethods.map((option) => {
                    const disabled = option.method === null;
                    const isWallet = option.method === "wallet";
                    return (
                      <button
                        key={option.label}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedPayment(option.label)}
                        className={`flex w-full items-center justify-between border-b border-[#EEF2F7] px-5 py-4 text-left last:border-b-0 ${
                          disabled ? "cursor-not-allowed opacity-50" : ""
                        }`}
                      >
                        <span className="flex items-start gap-3 text-sm text-[#111827]">
                          <span
                            className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                              selectedPayment === option.label
                                ? "border-primary"
                                : "border-[#DDE0E5]"
                            }`}
                          >
                            {selectedPayment === option.label ? (
                              <span className="size-2 rounded-full bg-primary" />
                            ) : null}
                          </span>
                          <span className="flex flex-col">
                            {option.label}
                            {isWallet ? (
                              <span className="text-xs text-[#6B7280]">
                                Balance: {formatCurrency(walletNaira)}
                              </span>
                            ) : null}
                            {disabled ? (
                              <span className="text-xs text-[#9CA3AF]">
                                Coming soon
                              </span>
                            ) : null}
                          </span>
                        </span>
                        <CreditCard size={18} className="text-[#6B7280]" />
                      </button>
                    );
                  })}
                </div>

                {insufficientWallet ? (
                  <p className="mt-4 rounded-lg border border-[#F5A400] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309]">
                    Your wallet balance is too low for this order. Top up your
                    wallet or pay with Paystack.
                  </p>
                ) : null}

                {payError ? (
                  <p className="mt-4 rounded-lg border border-[#E33C13] bg-[#FFF5F3] px-4 py-3 text-sm text-[#E33C13]">
                    {payError}
                  </p>
                ) : null}

                <p className="mt-5 text-xs leading-5 text-[#6B7280]">
                  Paystack payments redirect you to a secure checkout for{" "}
                  {formatCurrency(orderTotal)} and return here once complete.
                </p>

                <button
                  type="button"
                  onClick={handleSubmitPayment}
                  disabled={isPaying || insufficientWallet || !selectedOption?.method}
                  className="mt-6 h-12 w-full rounded-xl bg-primary text-sm font-medium text-white disabled:opacity-60 md:max-w-[260px]"
                >
                  {isPaying
                    ? selectedOption?.method === "paystack"
                      ? "Redirecting to Paystack…"
                      : "Processing payment…"
                    : `Pay ${formatCurrency(orderTotal)}`}
                </button>
              </section>

              <aside className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
                <h2 className="text-base font-medium text-[#111827]">
                  Order summary
                </h2>
                <div className="mt-5 flex h-[145px] items-center justify-center overflow-hidden rounded-xl border border-[#E9EEF5] bg-[#F8FAFC]">
                  {productImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={productImage}
                      alt={productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShieldCheck size={36} className="text-[#B8C8D6]" />
                  )}
                </div>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#6B7280]">Product</span>
                    <span className="text-right font-medium text-[#111827]">
                      {productName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#6B7280]">Supplier</span>
                    <span className="font-medium text-[#111827]">
                      {supplierName}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#6B7280]">Quantity</span>
                    <span className="font-medium text-[#111827]">{quantity}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#6B7280]">Unit price</span>
                    <span className="font-medium text-[#111827]">
                      {formatCurrency(unitPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-[#EEF2F7] pt-3">
                    <span className="font-medium text-[#111827]">Total</span>
                    <span className="font-semibold text-primary">
                      {formatCurrency(orderTotal)}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>

      {showReceipt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex flex-col items-center border-b border-[#DDE0E5] pb-5 text-center">
              <CheckCircle2 size={44} className="text-[#16A34A]" />
              <h2 className="mt-3 text-3xl font-semibold text-[#111827]">
                {formatCurrency(orderTotal)}
              </h2>
              <p className="mt-1 text-lg font-medium text-[#13A83B]">Successful</p>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[#4B5563]">Recipient</span>
                <span className="text-right text-[#111827]">{supplierName}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[#4B5563]">Sender</span>
                <span className="text-right text-[#111827]">{buyerName}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[#4B5563]">Payment method</span>
                <span className="text-right text-[#111827]">
                  {selectedOption?.label}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[#4B5563]">Reference</span>
                <span className="text-right text-[#111827]">{payReference}</span>
              </div>
            </div>

            <div className="mt-5 border-y border-[#DDE0E5] bg-[#F3F4F6] px-5 py-4">
              <p className="text-sm text-[#4B5563]">Description</p>
              <p className="mt-1 text-sm leading-6 text-[#0C0F16]">
                Payment for {productName} held in escrow until delivery is
                confirmed.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => {
                  resetPayment();
                  router.push(trackHref);
                }}
                className="h-12 rounded-xl bg-primary text-sm font-medium text-white"
              >
                Track order
              </button>
              <button
                type="button"
                onClick={() => {
                  resetPayment();
                  router.push(chatHref);
                }}
                className="h-12 rounded-xl border border-[#FE6E00] bg-[#FFF7F0] text-sm font-medium text-[#FE6E00]"
              >
                Open chat
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PublicLayout>
  );
}
