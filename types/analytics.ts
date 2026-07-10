/**
 * Analytics domain types, mirroring the Baiy API `Analytics` tag. These power
 * the distributor's product- and store-level performance dashboards.
 */

/** Standard success envelope used across the analytics endpoints. */
export interface AnalyticsEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Optional time window shared by every analytics endpoint. */
export interface AnalyticsQuery {
  /** ISO date string; metrics are aggregated from this date onward. */
  startDate?: string;
}

/** Performance metrics for a single product or an aggregated store view. */
export interface ProductMetrics {
  views: number;
  impressions: number;
  inquiries: number;
  orders: number;
  /** orders / views. */
  conversionRate: number;
  /** views / impressions. */
  clickThroughRate: number;
}

/**
 * Per-product aggregated counters (GET /analytics/products breakdown row). The
 * `product` relation is populated to its `_id` and `name`. `*30d` fields are the
 * trailing-30-day snapshots; the bare counters are lifetime.
 */
export interface ProductAnalyticsBreakdown {
  _id: string;
  product: { _id: string; name?: string };
  owner: string;
  views: number;
  impressions: number;
  inquiries: number;
  orders: number;
  views30d: number;
  impressions30d: number;
  inquiries30d: number;
  orders30d: number;
  lastEventAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Distributor product analytics (GET /analytics/products): aggregate totals
 * across every owned product plus a per-product breakdown.
 */
export interface DistributorProductAnalytics {
  totals: ProductMetrics;
  products: ProductAnalyticsBreakdown[];
}
