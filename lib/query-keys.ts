/**
 * Central query-key factory. Every `useQuery`/`useMutation` key comes from here
 * so cache reads, invalidations, and prefetches stay consistent across modules.
 *
 * Convention per module:
 *   - `all`               -> root key for the module, used for broad invalidation
 *   - `lists()` / `list(filters)` -> collection reads, filters make each variant cacheable
 *   - `details()` / `detail(id)`  -> single-entity reads
 *
 * Invalidate a whole module after a mutation with:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
 */
export const queryKeys = {
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.products.lists(), filters] as const,
    mine: (userId: string) =>
      [...queryKeys.products.all, "mine", userId] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    byCategory: (category: string, limit?: number) =>
      [...queryKeys.products.all, "category", category, limit ?? null] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.orders.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
  },
  wallet: {
    all: ["wallet"] as const,
    mine: (userId: string) => [...queryKeys.wallet.all, "mine", userId] as const,
    escrowSummary: (userId: string) =>
      [...queryKeys.wallet.all, "escrow-summary", userId] as const,
  },
  payments: {
    all: ["payments"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.payments.all, "list", filters] as const,
    forOrder: (orderId: string) =>
      [...queryKeys.payments.all, "order", orderId] as const,
  },
  subscription: {
    all: ["subscription"] as const,
    mine: (userId: string) =>
      [...queryKeys.subscription.all, "mine", userId] as const,
    plans: (filters: Record<string, unknown> = {}) =>
      [...queryKeys.subscription.all, "plans", filters] as const,
    features: () => [...queryKeys.subscription.all, "features"] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: () => [...queryKeys.categories.all, "list"] as const,
  },
  rfqs: {
    all: ["rfqs"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.rfqs.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.rfqs.all, "detail", id] as const,
  },
  serviceRequests: {
    all: ["service-requests"] as const,
    buyer: (filters: Record<string, unknown>) =>
      [...queryKeys.serviceRequests.all, "buyer", filters] as const,
    engineer: (filters: Record<string, unknown>) =>
      [...queryKeys.serviceRequests.all, "engineer", filters] as const,
    detail: (id: string) =>
      [...queryKeys.serviceRequests.all, "detail", id] as const,
  },
  orderDisputes: {
    all: ["order-disputes"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.orderDisputes.all, "list", filters] as const,
    detail: (id: string) =>
      [...queryKeys.orderDisputes.all, "detail", id] as const,
  },
  kyc: {
    all: ["kyc"] as const,
    mine: (userId: string) => [...queryKeys.kyc.all, "mine", userId] as const,
    adminList: (filters: Record<string, unknown>) =>
      [...queryKeys.kyc.all, "admin-list", filters] as const,
    adminDetail: (id: string) =>
      [...queryKeys.kyc.all, "admin-detail", id] as const,
  },
  users: {
    all: ["users"] as const,
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.users.all, "list", filters] as const,
  },
  messaging: {
    all: ["messaging"] as const,
    threads: (userId: string, limit?: number) =>
      [...queryKeys.messaging.all, "threads", userId, limit ?? null] as const,
    thread: (threadId: string) =>
      [...queryKeys.messaging.all, "thread", threadId] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    forProduct: (productId: string) =>
      [...queryKeys.reviews.all, "product", productId] as const,
    forEngineer: (engineerId: string) =>
      [...queryKeys.reviews.all, "engineer", engineerId] as const,
    forServiceRequest: (serviceRequestId: string) =>
      [...queryKeys.reviews.all, "service-request", serviceRequestId] as const,
  },
  serviceDisputes: {
    all: ["service-disputes"] as const,
    list: (scope: "admin" | "me") =>
      [...queryKeys.serviceDisputes.all, "list", scope] as const,
    detail: (id: string, scope: "admin" | "me" = "me") =>
      [...queryKeys.serviceDisputes.all, "detail", scope, id] as const,
    resolutionSummary: (id: string) =>
      [...queryKeys.serviceDisputes.all, "resolution-summary", id] as const,
  },
  admin: {
    all: ["admin"] as const,
    dashboardSummary: () =>
      [...queryKeys.admin.all, "dashboard-summary"] as const,
    platformUsersSummary: () =>
      [...queryKeys.admin.all, "platform-users-summary"] as const,
    platformUsers: (filters: Record<string, unknown>) =>
      [...queryKeys.admin.all, "platform-users", filters] as const,
    rfqsOrdersSummary: () =>
      [...queryKeys.admin.all, "rfqs-orders-summary"] as const,
    rfqs: (filters: Record<string, unknown>) =>
      [...queryKeys.admin.all, "rfqs", filters] as const,
    quotes: (filters: Record<string, unknown>) =>
      [...queryKeys.admin.all, "quotes", filters] as const,
    orders: (filters: Record<string, unknown>) =>
      [...queryKeys.admin.all, "orders", filters] as const,
  },
} as const;
