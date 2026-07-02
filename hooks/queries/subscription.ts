"use client";

/**
 * TanStack Query hooks for the subscription module, replacing the
 * `subscription-slice` thunks. See `hooks/queries/products.ts` for the
 * reference shape.
 *
 *   - reads  -> `useQuery`, keyed via `queryKeys.subscription.*`
 *   - writes -> `useMutation` that invalidates `queryKeys.subscription.all`
 *
 * The admin plan-management endpoints on `subscriptionService` remain called
 * directly from the admin screens; only the caller-facing plans / current
 * subscription / subscribe / cancel move here.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import subscriptionService from "@/services/subscriptionService";
import type {
  AdminFeaturesQuery,
  PlansQuery,
} from "@/types/subscription";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

const useCurrentUserId = () => useAppSelector((s) => s.auth.data?._id);

/** Subscription plans available to the caller. */
export const useSubscriptionPlansQuery = (
  query: PlansQuery = {},
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.subscription.plans(query as Record<string, unknown>),
    queryFn: () => subscriptionService.fetchPlans(token as string, query),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => res.data.docs,
  });
};

/** The caller's current subscription and resolved entitlements. */
export const useSubscriptionQuery = (options?: { enabled?: boolean }) => {
  const token = useAuthToken();
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: queryKeys.subscription.mine(userId ?? "anonymous"),
    queryFn: () => subscriptionService.fetchMySubscription(token as string),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => res.data,
  });
};

/** Admin feature catalog. */
export const useSubscriptionFeaturesQuery = (
  query: AdminFeaturesQuery = {},
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.subscription.features(),
    queryFn: () =>
      subscriptionService.fetchFeatureCatalog(token as string, query),
    enabled: Boolean(token) && (options?.enabled ?? true),
    select: (res) => res.data.docs,
  });
};

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

export const useSubscribeMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) =>
      subscriptionService.subscribe(token as string, { planId }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.subscription.all }),
  });
};

export const useCancelSubscriptionMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => subscriptionService.cancelSubscription(token as string),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.subscription.all }),
  });
};

export { useCurrentUserId };
