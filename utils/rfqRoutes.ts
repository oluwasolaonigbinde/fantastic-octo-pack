/**
 * Links into the buyer RFQ composer.
 *
 * The composer reads these params on mount, so a deep link is all that is
 * needed to open it pre-configured — see `app/dashboard/buyer/rfqs/page.tsx`.
 */

export interface TargetedQuoteTarget {
  distributorId: string;
  distributorName?: string;
}

/**
 * Opens the composer in direct-routing mode with `distributorId` preselected,
 * so `POST /rfqs` is sent as `routingMode: "direct"` with that distributor as
 * the only recipient.
 */
export const buildTargetedQuoteHref = ({
  distributorId,
  distributorName,
}: TargetedQuoteTarget): string => {
  const params = new URLSearchParams({
    action: "create",
    routingMode: "direct",
    distributorId,
  });

  if (distributorName) {
    params.set("distributorName", distributorName);
  }

  return `/dashboard/buyer/rfqs?${params.toString()}`;
};
