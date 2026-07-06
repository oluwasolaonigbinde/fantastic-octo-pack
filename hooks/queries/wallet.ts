"use client";

/**
 * TanStack Query hooks for the wallet module — the migration target for the old
 * `store/slices/wallet-slice.ts`. Follows the reference pattern in
 * `hooks/queries/products.ts`:
 *
 *   - reads  -> `useQuery`, keyed via `queryKeys.wallet.*`
 *   - writes -> `useMutation` that invalidates `queryKeys.wallet.all` on success
 *   - the existing `walletService` functions stay untouched as `queryFn` /
 *     `mutationFn`.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useCurrentUserId } from "@/hooks/queries/products";
import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import walletService from "@/services/walletService";
import type {
  WalletTopupPayload,
  WalletWithdrawPayload,
} from "@/types/wallet";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

/** The authenticated user's wallet. */
export const useWalletQuery = (options?: { enabled?: boolean }) => {
  const token = useAuthToken();
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: queryKeys.wallet.mine(userId ?? "anonymous"),
    queryFn: () => walletService.fetchMyWallet(token as string),
    enabled: Boolean(token) && (options?.enabled ?? true),
  });
};

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

/** POST /wallets/me/topup — initiate a Paystack top-up (returns checkout URL). */
export const useTopUpWalletMutation = () => {
  const token = useAuthToken();

  return useMutation({
    mutationFn: (payload: WalletTopupPayload) =>
      walletService.topUpWallet(token as string, payload),
  });
};

/** POST /wallets/me/withdraw — withdraw funds to a bank account. */
export const useWithdrawFromWalletMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: WalletWithdrawPayload) =>
      walletService.withdrawFromWallet(token as string, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.wallet.all }),
  });
};
