"use client";

import { useMyPaymentsQuery } from "@/hooks/queries/payments";
import type { MyPaymentsQuery } from "@/types/payment";

/** Loads and exposes the authenticated user's payment transactions. */
export function useMyPayments(query?: MyPaymentsQuery) {
  const { data, isLoading, isError, error } = useMyPaymentsQuery(query ?? {});

  return {
    payments: data?.payments ?? null,
    isLoading,
    isError,
    message: data?.message ?? (error instanceof Error ? error.message : ""),
  };
}
