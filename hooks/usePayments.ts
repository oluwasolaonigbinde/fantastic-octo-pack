"use client";

import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchMyPayments } from "@/store/slices/payment-slice";
import type { MyPaymentsQuery } from "@/types/payment";

/** Loads and exposes the authenticated user's payment transactions. */
export function useMyPayments(query?: MyPaymentsQuery) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.data?.tokens?.accessToken);
  const { myPayments, isLoading, isError, message } = useAppSelector(
    (s) => s.payment
  );

  // Serialize the filter so the effect only re-runs when values change.
  const queryKey = JSON.stringify(query ?? {});

  useEffect(() => {
    if (!token) return;
    void dispatch(fetchMyPayments({ token, query: JSON.parse(queryKey) }));
  }, [dispatch, token, queryKey]);

  return { payments: myPayments, isLoading, isError, message };
}
