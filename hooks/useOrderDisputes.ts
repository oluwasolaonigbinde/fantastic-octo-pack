"use client";

import {
  useOrderDisputeQuery,
  useOrderDisputesQuery,
} from "@/hooks/queries/order-disputes";

/** Loads the authenticated user's order disputes. */
export function useOrderDisputes() {
  const { data, isLoading, isError, error } = useOrderDisputesQuery();

  return {
    disputes: data ?? null,
    isLoading,
    isError,
    message: error instanceof Error ? error.message : "",
  };
}

/** Loads a single order dispute by id. */
export function useOrderDispute(disputeId: string | undefined) {
  const { data, isLoading, isError, error } = useOrderDisputeQuery(disputeId);

  return {
    dispute: data ?? null,
    isLoading,
    isError,
    message: error instanceof Error ? error.message : "",
  };
}
