"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { PublicLayout } from "@/components/layout";
import Banner from "@/components/features/public/Banner";
import { BigLoader } from "@/components/base";
import { PaymentMethodPanel } from "@/components/payments/PaymentMethodPanel";
import { PaymentOrderSummary } from "@/components/payments/PaymentOrderSummary";
import {
  ORDER_PAYMENT_METHODS,
  getPaymentMethodOption,
  type PaymentMethodId,
} from "@/components/payments/paymentMethods";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useOrderQuery } from "@/hooks/queries/orders";
import { useWallet } from "@/hooks/useWallet";
import { useWalletTopup } from "@/hooks/useWalletTopup";
import { TopUpDrawer } from "@/components/wallet/wallet-topup";
import { useOrderPayment } from "@/hooks/useOrderPayment";
import { koboToNaira } from "@/lib/wallet-format";
import { getOrderProductImage, getPersonName } from "@/constants/demoBuyerOrders";
import { buildMessagingComposeHref } from "@/utils/messagingRoutes";
import type { Order } from "@/types/order";
import { isPaidOrderStatus } from "@/types/order";

// Escrow-funded states. The live API has no `paymentStatus` field — payment is
// encoded in `status` (see `isPaidOrderStatus`, which also treats the
// fulfillment stages received/delivered/installed as paid).
const isOrderPaid = (status?: string) => isPaidOrderStatus(status);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(value || 0);

/** Whole-naira form used on the payment screen, matching the design. */
const formatAmount = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

const getSellerId = (order: Order | null): string => {
  if (!order) return "";
  if (order.seller && typeof order.seller === "object") return order.seller._id;
  return typeof order.seller === "string" ? order.seller : "";
};

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = params.orderId as string;

  const {
    data: currentOrder,
    isLoading,
    error,
  } = useOrderQuery(orderId);
  const message = error instanceof Error ? error.message : "";
  const { data: authData } = useAppSelector((state) => state.auth);
  const role = authData?.role;

  const { wallet } = useWallet();
  const { openTopUp, open: topUpOpen, panelProps: topUpPanelProps } = useWalletTopup({
    callbackPath: `/checkout/${orderId}`,
  });
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

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId>(
    ORDER_PAYMENT_METHODS[0].id,
  );
  const [showReceipt, setShowReceipt] = useState(false);

  const order = currentOrder ?? null;
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
  const productName = order?.productName ?? "Product";
  const productImage = getOrderProductImage(order);
  const supplierName = getPersonName(order?.seller, "Supplier");
  const sellerId = getSellerId(order ?? null);
  const buyerName = getPersonName(order?.buyer, "You");

  const walletNaira = wallet ? koboToNaira(wallet.availableBalance) : 0;
  const selectedOption = getPaymentMethodOption(selectedPayment);
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
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
              <PaymentMethodPanel
                selected={selectedPayment}
                onSelect={setSelectedPayment}
                walletBalanceLabel={`Balance: ${formatCurrency(walletNaira)}`}
              >
                {insufficientWallet ? (
                  <div className="flex flex-col gap-3 rounded-lg border border-[#F5A400] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309] sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      Your wallet balance is too low for this order. Top up your
                      wallet or pay with Paystack.
                    </p>
                    <button
                      type="button"
                      onClick={() => openTopUp(orderTotal - walletNaira)}
                      className="shrink-0 rounded-lg border border-[#F5A400] bg-white px-4 py-2 text-sm font-medium text-[#B45309]"
                    >
                      Top up now
                    </button>
                  </div>
                ) : null}

                {payError ? (
                  <p className="rounded-lg border border-[#E33C13] bg-[#FFF5F3] px-4 py-3 text-sm text-[#E33C13]">
                    {payError}
                  </p>
                ) : null}
              </PaymentMethodPanel>

              <PaymentOrderSummary
                productName={productName}
                productImage={productImage}
                quantity={quantity}
                orderId={order.publicId || order._id}
                invoiceId={order.paymentReference}
                itemsTotal={orderTotal}
                total={orderTotal}
                formatAmount={formatAmount}
                onPay={handleSubmitPayment}
                isPaying={isPaying}
                disabled={insufficientWallet || !selectedOption?.method}
                payLabel={
                  isPaying && selectedOption?.method === "paystack"
                    ? "Redirecting to Paystack…"
                    : undefined
                }
              />
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
                  {selectedOption?.title}
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

      <TopUpDrawer open={topUpOpen} panelProps={topUpPanelProps} />
    </PublicLayout>
  );
}
