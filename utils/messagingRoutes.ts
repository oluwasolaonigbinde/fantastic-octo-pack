const CANONICAL_MESSAGING_ROUTES = {
  buyer: "/dashboard/buyer/messages",
  distributor: "/dashboard/distributor/message",
  engineer: "/dashboard/engineer/messaging",
} as const;

export type MessagingSenderRole = keyof typeof CANONICAL_MESSAGING_ROUTES;

const normalizeRole = (role?: string | null): MessagingSenderRole | null => {
  const normalized = role?.trim().toLowerCase();

  if (normalized === "buyer") {
    return "buyer";
  }

  if (normalized === "distributor") {
    return "distributor";
  }

  if (normalized === "engineer" || normalized === "service_engineer") {
    return "engineer";
  }

  return null;
};

export const resolveMessagingRoute = (role?: string | null): string | null => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole ? CANONICAL_MESSAGING_ROUTES[normalizedRole] : null;
};

export const buildMessagingComposeHref = (
  role: string | null | undefined,
  receiverId: string | null | undefined,
): string | null => {
  const route = resolveMessagingRoute(role);
  const safeReceiverId = receiverId?.trim();

  if (!route || !safeReceiverId) {
    return null;
  }

  const params = new URLSearchParams({
    compose: "1",
    to: safeReceiverId,
  });

  return `${route}?${params.toString()}`;
};
