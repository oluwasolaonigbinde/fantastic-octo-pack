/**
 * Subscription domain types, mirroring the Baiy API `Subscriptions` and
 * `Subscriptions (Admin)` tags. Monetary amounts are expressed in kobo
 * (the smallest currency unit), matching the payment domain.
 */

export type SubscriptionInterval = "monthly" | "yearly";

export type SubscriptionRole =
  | "admin"
  | "super_admin"
  | "agent"
  | "buyer"
  | "oem"
  | "distributor"
  | "engineer";

export type PlanStatus = "active" | "archived";

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export type InvoiceStatus =
  | "draft"
  | "open"
  | "processing"
  | "paid"
  | "void"
  | "uncollectible";

export type FeatureType = "boolean" | "limit" | "metered";

/** A single entitlement carried by a plan. */
export interface PlanFeature {
  key: string;
  numericValue?: number;
  booleanValue?: boolean;
}

export interface SubscriptionPlan {
  _id: string;
  name: string;
  description?: string;
  /** Target role; omitted when the plan applies to any role. */
  role?: SubscriptionRole;
  /** Price per billing cycle, in kobo. */
  price: number;
  currency: string;
  interval: SubscriptionInterval;
  intervalCount: number;
  features: PlanFeature[];
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

/** Expanded subscriber details returned on populated responses. */
export interface SubscriptionOwnerSummary {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: SubscriptionRole;
}

/** Commercial terms frozen at subscribe time. */
export interface PlanSnapshot {
  name: string;
  price: number;
  currency: string;
  interval: SubscriptionInterval;
  intervalCount: number;
}

export interface Subscription {
  _id: string;
  /** The subscriber's role, captured at subscribe time (e.g. distributor). */
  ownerType?: string;
  owner?: SubscriptionOwnerSummary;
  /** Plan id, or the expanded plan object on endpoints that populate it. */
  plan: string | SubscriptionPlan;
  planSnapshot?: PlanSnapshot;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  nextBillingDate?: string;
  cancelAtPeriodEnd: boolean;
  cancelRequestedAt?: string | null;
  canceledAt?: string | null;
  pastDueSince?: string | null;
}

export interface Invoice {
  _id: string;
  subscription: string;
  /** Owner id on the caller's invoices, or expanded details on admin listings. */
  owner: string | SubscriptionOwnerSummary;
  plan: string;
  /** Amount due for the cycle, in kobo. */
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  status: InvoiceStatus;
  attemptCount: number;
  nextRetryAt?: string | null;
  paidAt?: string | null;
  transaction?: string | null;
}

/** A platform feature entitlement (code-defined; read-only). */
export interface FeatureDefinition {
  key: string;
  name: string;
  description?: string;
  type: FeatureType;
  unit?: string;
  /** Subscriber role this feature applies to; absent means the feature is universal. */
  role?: SubscriptionRole;
  /** Free-tier value when the owner has no live subscription. */
  defaultNumericValue?: number;
  defaultBooleanValue?: boolean;
}

/** Resolved entitlements keyed by feature key (limit/metered → number, boolean → bool). */
export type SubscriptionEntitlements = Record<string, number | boolean>;

/** Payload of GET /subscriptions/me. */
export interface MySubscription {
  subscription: Subscription | null;
  entitlements: SubscriptionEntitlements;
}

/** Payload of POST /subscriptions/subscribe. */
export interface SubscribeResult {
  subscription: Subscription;
  invoice: Invoice;
}

/** Standard `{ success, message, data }` API envelope. */
export interface SubscriptionEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Paginated list payload shared across subscription listings. */
export interface SubscriptionPage<T> {
  docs: T[];
  totalDocs: number;
  page: number;
  totalPages: number;
}

/* ----------------------------------------------------------------------- */
/* Query parameters                                                        */
/* ----------------------------------------------------------------------- */

export interface PlansQuery {
  interval?: SubscriptionInterval;
  page?: number;
  limit?: number;
}

export interface MyInvoicesQuery {
  status?: InvoiceStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AdminFeaturesQuery {
  key?: string;
}

export interface AdminPlansQuery {
  status?: PlanStatus;
  role?: SubscriptionRole;
  interval?: SubscriptionInterval;
  page?: number;
  limit?: number;
}

export interface AdminSubscriptionsQuery {
  status?: SubscriptionStatus;
  ownerId?: string;
  planId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface AdminInvoicesQuery {
  status?: InvoiceStatus;
  ownerId?: string;
  subscriptionId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

/* ----------------------------------------------------------------------- */
/* Request bodies                                                          */
/* ----------------------------------------------------------------------- */

export interface SubscribePayload {
  planId: string;
}

/** Request body for POST /subscriptions/change-plan. */
export interface ChangePlanPayload {
  planId: string;
}

/** Query for GET /subscriptions/change-plan/preview. */
export interface ChangePlanPreviewQuery {
  planId: string;
}

/** Current/target plan snapshot embedded in a change-plan preview. */
export interface ChangePlanPreviewPlan {
  id: string;
  name: string;
  /** Price in kobo. */
  price: number;
}

/**
 * Proration/cost preview returned by GET /subscriptions/change-plan/preview.
 * An upgrade is charged immediately (prorated); a downgrade/no-op costs nothing
 * now and takes effect at the current period end.
 */
export interface ChangePlanPreview {
  changeType: "same" | "upgrade" | "downgrade";
  /** Amount charged now, in kobo. Zero for downgrades and no-ops. */
  amountDue: number;
  currency: string;
  /** True when `amountDue` is a prorated charge (upgrade with a non-zero cost). */
  proration: boolean;
  /** ISO date the change takes effect (now for upgrades, period end for downgrades). */
  effectiveAt: string;
  currentPlan: ChangePlanPreviewPlan;
  targetPlan: ChangePlanPreviewPlan;
  /** Available wallet balance in kobo (balance − held). */
  walletBalance: number;
  /** Whether the wallet can cover `amountDue`. */
  sufficientBalance: boolean;
}

/** Query for GET /subscriptions/admin/subscriptions/analytics. */
export interface AdminSubscriptionAnalyticsQuery {
  role?: SubscriptionRole;
}

/** Aggregated subscription analytics returned to admins. Amounts are in kobo. */
export interface SubscriptionAnalytics {
  total: number;
  active: number;
  pending: number;
  pastDue: number;
  canceled: number;
  expired: number;
  expiringSoon: number;
  monthlyRevenue: number;
  allTimeRevenue: number;
  currency: string;
}

export interface CreatePlanPayload {
  name: string;
  description?: string;
  role?: SubscriptionRole;
  /** Price per cycle, in kobo. */
  price: number;
  currency?: string;
  interval: SubscriptionInterval;
  intervalCount?: number;
  features: PlanFeature[];
}

export interface UpdatePlanPayload {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  interval?: SubscriptionInterval;
  intervalCount?: number;
  features?: PlanFeature[];
  status?: PlanStatus;
}
