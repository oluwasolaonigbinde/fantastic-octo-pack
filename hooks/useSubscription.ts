"use client";

import { useCallback, useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import {
  cancelSubscription,
  fetchMySubscription,
  fetchSubscriptionPlans,
  subscribeToPlan,
} from "@/store/slices/subscription-slice";

/**
 * Loads the distributor's available plans and current subscription, and exposes
 * subscribe/cancel actions. Upgrade/downgrade is intentionally not supported —
 * the only way to manage a live subscription is to cancel it.
 */
export function useSubscription() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.data?.tokens?.accessToken);
  const { plans, subscription, entitlements, isLoading, isMutating, isError, message } =
    useAppSelector((s) => s.subscription);

  useEffect(() => {
    if (!token) return;
    void dispatch(fetchSubscriptionPlans({ token }));
    void dispatch(fetchMySubscription(token));
  }, [dispatch, token]);

  const subscribe = useCallback(
    async (planId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!token) return { ok: false, error: "You need to be signed in." };
      const result = await dispatch(subscribeToPlan({ token, planId }));
      if (subscribeToPlan.fulfilled.match(result)) {
        void dispatch(fetchMySubscription(token));
        return { ok: true };
      }
      return { ok: false, error: result.payload as string };
    },
    [dispatch, token],
  );

  const cancel = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!token) return { ok: false, error: "You need to be signed in." };
    const result = await dispatch(cancelSubscription(token));
    if (cancelSubscription.fulfilled.match(result)) return { ok: true };
    return { ok: false, error: result.payload as string };
  }, [dispatch, token]);

  return {
    plans,
    subscription,
    entitlements,
    isLoading,
    isMutating,
    isError,
    message,
    subscribe,
    cancel,
  };
}
