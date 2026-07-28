// Admin parity fallback policy:
// - keep existing live API-backed values live
// - when an in-scope admin screen/state has no backend support yet, use
//   Figma-backed fallback content from this file instead of invented neutral copy
// - keep these fallbacks shaped like stable view adapters so swapping to real data
//   later is mechanical rather than a redesign

export const ADMIN_DASHBOARD_FIGMA_FALLBACK = {
  revenueBreakdownDesktop: "Equipment: 305 | Consumables: 105",
  revenueBreakdownMobile: ["Equipment: 305", "Consumables: 105"],
} as const;

export const ADMIN_PAYMENT_ESCROW_FIGMA_FALLBACK = {
  engineerId: "Not available",
  ageOfDays: "2 days",
} as const;

export const ADMIN_DISPUTE_RESOLUTION_FIGMA_FALLBACK = {
  paymentMethod: "ESCROW",
  distributorAccount: "43546536577",
  bankName: "Opay",
} as const;

export const ADMIN_PLATFORM_USERS_ADD_AGENT_FIGMA_FALLBACK = {
  title: "Add a New Agent",
  description:
    "Kindly enter all correct information to successfully create a new agent.",
  cta: "Proceed To Create This Agent",
  rolePlaceholder: "Agent",
} as const;
