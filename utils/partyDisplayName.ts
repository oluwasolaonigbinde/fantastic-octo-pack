/**
 * Display-name resolution for people/companies rendered across the app.
 *
 * A distributor supplies a **business name** at KYC tier 2 (Registered
 * Distributor, `businessName` in `constants/kycTiers`) and the same value is
 * kept on the store profile. Once it exists it is the trading identity every
 * other role should see — the personal first/last name is only the fallback
 * for accounts that have not reached that tier.
 *
 * The two shapes exist because the API returns the value either flattened onto
 * the user projection (`businessName`) or nested under the store profile,
 * depending on the endpoint. Both are checked, store profile first, since that
 * is the record the distributor edits directly.
 */

export interface NameablePartyLike {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  businessName?: string | null;
  distributorStoreProfile?: { businessName?: string | null } | null;
}

/** The trading name, when the account has one. */
export const getBusinessName = (
  party: NameablePartyLike | string | null | undefined,
): string | null => {
  if (!party || typeof party !== "object") return null;
  return (
    party.distributorStoreProfile?.businessName?.trim() ||
    party.businessName?.trim() ||
    null
  );
};

/** `"First Last"`, when either part is present. */
export const getPersonalName = (
  party: NameablePartyLike | string | null | undefined,
): string | null => {
  if (!party || typeof party !== "object") return null;
  return [party.firstName, party.lastName].filter(Boolean).join(" ").trim() || null;
};

/**
 * Business name → personal name → email → `fallback`. Use this everywhere a
 * distributor (or any counterparty that may trade under a company) is named.
 */
export const getPartyDisplayName = (
  party: NameablePartyLike | string | null | undefined,
  fallback = "Distributor",
): string => {
  if (!party || typeof party !== "object") return fallback;
  return (
    getBusinessName(party) ?? getPersonalName(party) ?? party.email?.trim() ?? fallback
  );
};

/** Up-to-two-letter initials derived from whatever name is displayed. */
export const getPartyInitials = (
  party: NameablePartyLike | string | null | undefined,
  fallback = "Distributor",
): string =>
  getPartyDisplayName(party, fallback)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase() || "?";
