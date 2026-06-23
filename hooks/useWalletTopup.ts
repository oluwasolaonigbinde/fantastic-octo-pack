"use client";

import { useEffect, useState } from "react";

import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import {
  clearWalletTopup,
  fetchMyWallet,
  topUpWallet,
} from "@/store/slices/wallet-slice";

export type TopUpReturnStatus = "success" | "cancelled" | null;

/**
 * Encapsulates the wallet top-up + Paystack redirect flow so every role's
 * wallet screen behaves identically.
 *
 * @param callbackPath the dashboard path Paystack should return to, e.g.
 *   "/dashboard/buyer/payments". The callback always uses the user's current
 *   origin so the auth session in localStorage stays visible on return.
 */
export function useWalletTopup({ callbackPath }: { callbackPath: string }) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);
  const { topup } = useAppSelector((state) => state.wallet);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topupError, setTopupError] = useState("");

  // Read Paystack callback params immediately — before any effect runs — so the
  // redirect effect below can use this as a guard and not loop back to Paystack.
  const [returnStatus, setReturnStatus] = useState<TopUpReturnStatus>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const trxref = params.get("trxref");
    const reference = params.get("reference");
    const topupParam = params.get("topup");
    if (trxref || reference || topupParam === "success") return "success";
    if (topupParam === "cancelled") return "cancelled";
    return null;
  });

  // Strip Paystack callback params from the URL and refresh wallet data.
  useEffect(() => {
    if (returnStatus !== null) {
      window.history.replaceState(null, "", callbackPath);
      if (returnStatus === "success" && token) {
        dispatch(fetchMyWallet(token));
      }
    }
    // Intentionally runs once on mount — returnStatus is derived from the
    // initial URL and token is only needed for the one-time wallet refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to Paystack once the checkout URL arrives.
  // Guard: if we're already returning from a Paystack callback, clear the
  // stale authorizationUrl (persisted state) instead of redirecting again.
  useEffect(() => {
    if (topup?.authorizationUrl) {
      if (returnStatus === null) {
        window.location.href = topup.authorizationUrl;
      }
      dispatch(clearWalletTopup());
    }
  }, [topup, dispatch, returnStatus]);

  const openTopUp = () => {
    setAmount("");
    setAmountError("");
    setTopupError("");
    // Clear any lingering Paystack-return status so the redirect effect's
    // `returnStatus === null` guard doesn't block this fresh top-up.
    setReturnStatus(null);
    setOpen(true);
  };

  const closeTopUp = () => setOpen(false);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (amountError) setAmountError("");
    if (topupError) setTopupError("");
  };

  const submitTopUp = async () => {
    setAmountError("");
    setTopupError("");

    const numericAmount = Number(amount.replace(/[^\d]/g, ""));
    if (!numericAmount || numericAmount < 100) {
      setAmountError("Minimum top-up amount is ₦100");
      return;
    }
    if (!token) return;

    setIsSubmitting(true);
    // Keep the callback on the SAME origin the user is currently on. A different
    // origin (e.g. localhost vs 127.0.0.1) can't see the auth session in
    // localStorage, so the dashboard treats the user as logged out on return.
    const callbackUrl = `${window.location.origin}${callbackPath}`;
    try {
      await dispatch(
        topUpWallet({
          token,
          payload: { amount: numericAmount * 100, callbackUrl },
        }),
      ).unwrap();
    } catch (err) {
      setTopupError(
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Failed to initiate top-up. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    open,
    openTopUp,
    closeTopUp,
    returnStatus,
    dismissReturnStatus: () => setReturnStatus(null),
    panelProps: {
      amount,
      amountError,
      isSubmitting,
      topupError,
      onAmountChange: handleAmountChange,
      onClose: closeTopUp,
      onSubmit: submitTopUp,
    },
  };
}
