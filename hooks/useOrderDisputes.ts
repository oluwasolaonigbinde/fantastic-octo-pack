"use client";

import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import {
  fetchOrderDisputeById,
  fetchOrderDisputes,
} from "@/store/slices/order-dispute-slice";

/** Loads the authenticated user's order disputes. */
export function useOrderDisputes() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.data?.tokens?.accessToken);
  const { disputes, isLoading, isError, message } = useAppSelector(
    (s) => s.orderDispute
  );

  useEffect(() => {
    if (!token) return;
    void dispatch(fetchOrderDisputes(token));
  }, [dispatch, token]);

  return { disputes, isLoading, isError, message };
}

/** Loads a single order dispute by id. */
export function useOrderDispute(disputeId: string | undefined) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.data?.tokens?.accessToken);
  const { currentDispute, isLoading, isError, message } = useAppSelector(
    (s) => s.orderDispute
  );

  useEffect(() => {
    if (!token || !disputeId) return;
    void dispatch(fetchOrderDisputeById({ token, disputeId }));
  }, [dispatch, token, disputeId]);

  return { dispute: currentDispute, isLoading, isError, message };
}
