"use client";

import { useCallback } from "react";

import {
  useCancelSubscriptionMutation,
  useChangePlanMutation,
  useSubscribeMutation,
  useSubscriptionPlansQuery,
  useSubscriptionQuery,
} from "@/hooks/queries/subscription";

/**
 * Loads the distributor's available plans and current subscription, and exposes
 * subscribe / change-plan (upgrade or downgrade) / cancel actions.
 */
export function useSubscription() {
  const plansQuery = useSubscriptionPlansQuery();
  const subscriptionQuery = useSubscriptionQuery();
  const subscribeMutation = useSubscribeMutation();
  const changePlanMutation = useChangePlanMutation();
  const cancelMutation = useCancelSubscriptionMutation();

  const subscribe = useCallback(
    async (planId: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        await subscribeMutation.mutateAsync(planId);
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to subscribe to plan",
        };
      }
    },
    [subscribeMutation],
  );

  const changePlan = useCallback(
    async (planId: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        await changePlanMutation.mutateAsync(planId);
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error ? error.message : "Failed to change plan",
        };
      }
    },
    [changePlanMutation],
  );

  const cancel = useCallback(async (): Promise<{
    ok: boolean;
    error?: string;
  }> => {
    try {
      await cancelMutation.mutateAsync();
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to cancel subscription",
      };
    }
  }, [cancelMutation]);

  const error = plansQuery.error ?? subscriptionQuery.error;

  return {
    plans: plansQuery.data ?? null,
    subscription: subscriptionQuery.data?.subscription ?? null,
    entitlements: subscriptionQuery.data?.entitlements ?? null,
    isLoading: plansQuery.isLoading || subscriptionQuery.isLoading,
    isMutating:
      subscribeMutation.isPending ||
      changePlanMutation.isPending ||
      cancelMutation.isPending,
    isError: plansQuery.isError || subscriptionQuery.isError,
    message: error instanceof Error ? error.message : "",
    subscribe,
    changePlan,
    cancel,
  };
}
