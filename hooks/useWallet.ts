"use client";

import { useWalletQuery } from "@/hooks/queries/wallet";

/** Loads and exposes the authenticated user's wallet. */
export function useWallet() {
  const { data: wallet, isLoading, isError, error } = useWalletQuery();

  return {
    wallet: wallet ?? null,
    isLoading,
    isError,
    message: error instanceof Error ? error.message : "",
  };
}
