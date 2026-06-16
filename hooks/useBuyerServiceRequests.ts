"use client";

import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { fetchServiceRequests } from "@/store/slices/service-request-slice";

/** Loads the buyer's service requests when an access token is available. */
export function useFetchBuyerServiceRequests() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.data?.tokens?.accessToken);

  useEffect(() => {
    if (!token) return;
    void dispatch(fetchServiceRequests({ token }));
  }, [dispatch, token]);
}
