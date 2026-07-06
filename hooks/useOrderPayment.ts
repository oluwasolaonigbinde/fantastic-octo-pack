"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { usePayOrderMutation } from "@/hooks/queries/orders";
import { useWalletQuery } from "@/hooks/queries/wallet";
import { queryKeys } from "@/lib/query-keys";
import type { OrderPaymentMethod, OrderPaymentResult } from "@/types/order";

export type PayReturnStatus = "success" | "cancelled" | null;

/** Pull the Paystack checkout URL out of whatever shape the API returns. */
const extractCheckoutUrl = (
  result: Record<string, unknown> | null | undefined,
): string | undefined => {
  if (!result) return undefined;
  const nested =
    result.data && typeof result.data === "object"
      ? (result.data as Record<string, unknown>)
      : undefined;
  const candidate =
    result.authorizationUrl ??
    result.authorization_url ??
    result.checkoutUrl ??
    result.url ??
    nested?.authorizationUrl ??
    nested?.authorization_url ??
    nested?.checkoutUrl ??
    nested?.url;
  return typeof candidate === "string" ? candidate : undefined;
};

/**
 * Encapsulates the order Make Payment flow for both rails:
 * - "wallet" (BAIY trade assurance): debits the wallet into escrow and settles
 *   inline; resolves to "success" so the caller can show the receipt.
 * - "paystack": initiates checkout and redirects to the returned
 *   `authorizationUrl`, mirroring the wallet top-up flow.
 *
 * @param orderId the order being paid for.
 * @param callbackPath dashboard path Paystack returns to, e.g.
 *   "/dashboard/buyer/orders/<id>?view=payment". Always uses the current origin
 *   so the auth session in localStorage survives the round-trip.
 */
export function useOrderPayment({
  orderId,
  callbackPath,
}: {
  orderId: string;
  callbackPath: string;
}) {
  const qc = useQueryClient();
  const { data: wallet } = useWalletQuery();
  const payMutation = usePayOrderMutation();

  const [payResult, setPayResult] = useState<OrderPaymentResult | null>(null);
  const [payError, setPayError] = useState("");

  // Read Paystack callback params before any effect runs so the redirect effect
  // doesn't loop back to Paystack on return.
  const [returnStatus, setReturnStatus] = useState<PayReturnStatus>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get("trxref") || params.get("reference")) return "success";
    if (params.get("payment") === "cancelled") return "cancelled";
    return null;
  });

  // On return from Paystack, strip the callback params and refresh order + wallet.
  useEffect(() => {
    if (returnStatus !== null) {
      window.history.replaceState(null, "", callbackPath);
      if (returnStatus === "success") {
        qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
        qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
      }
    }
    // Runs once on mount — returnStatus is derived from the initial URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The backend may name the Paystack checkout URL differently across rails;
  // accept the common variants (and a nested `data`).
  const checkoutUrl = extractCheckoutUrl(payResult);

  // Redirect to Paystack once the checkout URL arrives. Guard against
  // redirecting again when we're already handling a callback return.
  useEffect(() => {
    if (checkoutUrl) {
      if (returnStatus === null) {
        window.location.href = checkoutUrl;
        return;
      }
      setPayResult(null);
    }
  }, [checkoutUrl, returnStatus]);

  const pay = async (method: OrderPaymentMethod) => {
    setPayError("");
    // Fresh attempt — drop any lingering Paystack-return status so the redirect
    // effect's `returnStatus === null` guard doesn't block this payment.
    setReturnStatus(null);

    const callbackUrl =
      method === "paystack"
        ? `${window.location.origin}${callbackPath}`
        : undefined;

    try {
      const data = await payMutation.mutateAsync({
        orderId,
        payload: { method, callbackUrl },
      });
      setPayResult(data.data ?? null);
      if (method === "wallet") {
        // Wallet settles inline — the mutation already invalidated the order and
        // wallet caches, so mounted queries refetch with the new paid status.
        qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
        qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
      }
    } catch (err) {
      setPayError(
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Payment failed. Please try again.",
      );
    }
  };

  // A wallet payment is "done" once the mutation succeeds without handing back a
  // Paystack redirect URL (the wallet rail may return an empty `data` payload).
  const walletPaid =
    payMutation.isSuccess && !checkoutUrl && returnStatus === null;

  return {
    wallet: wallet ?? null,
    isPaying: payMutation.isPending,
    payError,
    payResult,
    /** True once a payment has succeeded (wallet inline OR Paystack return). */
    isPaid: walletPaid || returnStatus === "success",
    returnStatus,
    pay,
    reset: () => {
      setPayError("");
      setReturnStatus(null);
      setPayResult(null);
      payMutation.reset();
    },
  };
}
