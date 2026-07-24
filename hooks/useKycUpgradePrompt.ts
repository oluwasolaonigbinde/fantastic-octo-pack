"use client";

import { useMemo } from "react";

import { useMyKycQuery } from "@/hooks/queries/kyc";

/**
 * Whether the signed-in user still has a KYC tier left to clear.
 *
 * Dashboard "upgrade your KYC" banners used to render unconditionally, so a
 * fully verified user was nagged forever. This derives the prompt from the live
 * tier catalogue (`GET /kyc/tiers`) against their own submissions
 * (`GET /kyc/submissions`), and stays silent until both have loaded.
 */
export function useKycUpgradePrompt() {
  const { data, isLoading } = useMyKycQuery();

  return useMemo(() => {
    const tiers = [...(data?.tiers ?? [])].sort(
      (a, b) => a.tierOrdinal - b.tierOrdinal,
    );
    const approvedTierKeys = new Set(
      (data?.submissions ?? [])
        .filter((submission) => submission.status === "approved")
        .map((submission) => submission.tierKey),
    );
    const outstanding = tiers.filter(
      (tier) => !approvedTierKeys.has(tier.tierKey),
    );

    return {
      isLoading,
      /** False while loading, and once every tier has an approved submission. */
      shouldPrompt: !isLoading && tiers.length > 0 && outstanding.length > 0,
      nextTierLabel: outstanding[0]?.tierLabel ?? null,
    };
  }, [data, isLoading]);
}
