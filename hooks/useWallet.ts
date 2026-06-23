"use client";

import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchMyWallet } from "@/store/slices/wallet-slice";

/** Loads and exposes the authenticated user's wallet. */
export function useWallet() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.data?.tokens?.accessToken);
  const { wallet, isLoading, isError, message } = useAppSelector(
    (s) => s.wallet
  );

  useEffect(() => {
    if (!token) return;
    void dispatch(fetchMyWallet(token));
  }, [dispatch, token]);

  return { wallet, isLoading, isError, message };
}
