"use client";

import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";

export function useEscrowSummary() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.data?.tokens?.accessToken);
  const summary = useAppSelector((s) => s.order.escrowSummary);
  const isLoading = useAppSelector((s) => s.order.escrowLoading);

  useEffect(() => {
    if (!token) return;
    void import("@/store/slices/order-slice").then(({ fetchEscrowSummary }) => {
      void dispatch(fetchEscrowSummary(token));
    });
  }, [dispatch, token]);

  return { summary, isLoading };
}
