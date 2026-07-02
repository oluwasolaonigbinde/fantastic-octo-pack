"use client";

import { useEscrowSummaryQuery } from "@/hooks/queries/orders";

export function useEscrowSummary() {
  const { data: summary, isLoading } = useEscrowSummaryQuery();

  return { summary: summary ?? null, isLoading };
}
