export type RfqStatus =
  | "draft"
  | "discovering"
  | "submitted"
  | "responded_partial"
  | "responded_complete"
  | "converted_to_order"
  | "expired"
  | "closed";

export type QuoteStatus =
  | "pending_response"
  | "quoted"
  | "unavailable"
  | "selected_for_order"
  | "not_selected"
  | "expired_no_response"
  | "rejected_by_buyer"
  | "expired";

/** Lifecycle of an email-targeted bulk batch (`POST /rfqs/bulk`). */
export type BulkRfqBatchStatus =
  | "submitted"
  | "partially_quoted"
  | "fully_quoted"
  | "closed";

export interface AttachmentRef {
  url: string;
  cloudinary_id: string;
  originalName?: string;
}

export interface DeliveryAddressSnapshot {
  address: string;
  city: string;
  state: string;
  country: string;
  phone?: string | null;
}

export interface UserRef {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  displayPhoto?: { url: string; cloudinary_id: string };
  phoneNumber?: string;
  businessName?: string;
  distributorStoreProfile?: { businessName?: string };
}

export interface ProductRef {
  _id: string;
  name: string;
  category?: string;
  images?: AttachmentRef[];
}

/** The buyer's RFQ line. `category` is the backend routing floor. */
export interface RfqLineItem {
  productName: string;
  quantity: number;
  category: string;
  subCategory?: string | null;
  brand?: string | null;
  model?: string | null;
  description?: string | null;
  notes?: string | null;
}

/** One distributor response for an RFQ line. */
export interface QuoteLineItem {
  rfqItemIndex: number;
  available: boolean;
  product?: string | ProductRef | null;
  pricePerUnit?: number | null;
  quantity?: number | null;
  availableModel?: string | null;
  notes?: string | null;
}

/**
 * How the backend picks the distributors an RFQ is sent to. `automatic` runs the
 * routing engine over the line items; `direct` sends only to the distributors
 * the buyer named in `directDistributorIds`.
 */
export type RfqRoutingMode = "automatic" | "direct";

export interface Rfq {
  _id: string;
  /** Short human-facing reference (e.g. shown on RFQ cards), unique per RFQ. */
  publicId?: string;
  buyer: string | UserRef;
  title?: string | null;
  items: RfqLineItem[];
  /** Populated by the backend routing engine when the draft is submitted. */
  targetDistributors: (string | UserRef)[];
  routingMode?: RfqRoutingMode;
  /** Buyer-selected recipients; only meaningful when `routingMode` is direct. */
  directDistributorIds?: (string | UserRef)[];
  additionalNotes?: string | null;
  deliveryAddress?: DeliveryAddressSnapshot | null;
  deliveryAddressId?: string | null;
  deliveryTimeline?: string | null;
  attachments?: AttachmentRef[];
  isBulk: boolean;
  /**
   * Set on every RFQ created through the email-targeted bulk endpoint; the batch
   * is what the buyer sees as a single "Bulk RFQ", each row being its own RFQ.
   */
  bulkBatch?: string | BulkRfqBatch | null;
  /** Free-text location carried only by email-targeted bulk rows. */
  deliveryLocation?: string | null;
  status: RfqStatus;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  _id: string;
  rfq: string | Rfq;
  distributor: string | UserRef;
  status: QuoteStatus;
  items: QuoteLineItem[];
  totalPrice?: number | null;
  warranty?: string | null;
  notes?: string | null;
  images?: AttachmentRef[];
  catalogue?: AttachmentRef | null;
  /** Set by `POST /rfqs/quotes/:quoteId/reject` when the buyer gives a reason. */
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * One email-targeted bulk submission. The batch itself only carries the counts;
 * the requested products live on the RFQs that reference it via `bulkBatch`.
 */
export interface BulkRfqBatch {
  _id: string;
  buyer: string | UserRef;
  title?: string | null;
  itemCount: number;
  status: BulkRfqBatchStatus;
  createdAt: string;
  updatedAt: string;
}

/** `GET /rfqs/:id` returns this shape from the deployed backend. */
export interface RfqDetailResponse {
  rfq: Rfq;
  quotes: Quote[];
}

export type CreateRfqItem = RfqLineItem;

export interface CreateRfqPayload {
  items: CreateRfqItem[];
  additionalNotes?: string;
  isBulk?: boolean;
  title?: string;
  addressId?: string;
  deliveryTimeline?: string;
  /**
   * Required by the backend. `rfqService` defaults it to `"automatic"` when the
   * caller does not set it.
   */
  routingMode?: RfqRoutingMode;
  /** Required when `routingMode` is `"direct"`; rejected otherwise. */
  directDistributorIds?: string[];
}

/**
 * One row of an email-targeted bulk RFQ. The distributor is named directly by
 * email, so the routing engine (and therefore `category`) is not involved.
 */
export interface CreateBulkRfqItem {
  productName: string;
  quantity: number;
  distributorEmail: string;
  proposedDeliveryDate?: string;
  deliveryLocation?: string;
  additionalNote?: string;
}

export interface CreateBulkRfqPayload {
  items: CreateBulkRfqItem[];
  title?: string;
}

/**
 * `POST /rfqs/bulk` accepts partial success: rows whose email matches no
 * distributor (or that exceed that distributor's standing quote cap) come back
 * in `errors` while the rest are created.
 */
export interface BulkRfqCreationResult {
  batch: BulkRfqBatch;
  created: number;
  errors: { row: number; message: string }[];
}

/** Query filters accepted by `GET /rfqs` (buyer) and `GET /admin/rfqs`. */
export interface RfqListFilters {
  status?: RfqStatus;
  /** Inclusive ISO date (or `YYYY-MM-DD`) lower bound on `createdAt`. */
  minDate?: string;
  /** Inclusive upper bound; a bare `YYYY-MM-DD` is widened to end of day. */
  maxDate?: string;
}

/**
 * `GET /rfqs/quotes/summary` (buyer) and `GET /rfqs/inbox/quotes/summary`
 * (distributor) both return this shape, as does `GET /admin/quotes/summary`.
 */
export interface QuoteSummary {
  total: number;
  /** Every quote that is no longer awaiting the distributor's response. */
  received: number;
  pendingResponse: number;
  /** Quotes the buyer selected for an order. */
  approved: number;
  /** Rejected by the buyer plus those passed over for another quote. */
  declined: number;
  byStatus: Record<QuoteStatus, number>;
}

export interface RejectQuotePayload {
  reason?: string;
}

export interface RespondToQuotePayload {
  items: QuoteLineItem[];
  warranty?: string;
  notes?: string;
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  pending_response: "Open",
  quoted: "Quoted",
  unavailable: "Not available",
  selected_for_order: "Approved",
  not_selected: "Not selected",
  expired_no_response: "Expired",
  rejected_by_buyer: "Declined",
  expired: "Expired",
};

export const BULK_BATCH_STATUS_LABELS: Record<BulkRfqBatchStatus, string> = {
  submitted: "Awaiting responses",
  partially_quoted: "Partially quoted",
  fully_quoted: "Quotes received",
  closed: "Closed",
};

export const RFQ_STATUS_LABELS: Record<RfqStatus, string> = {
  draft: "Draft",
  discovering: "Finding suppliers",
  submitted: "Open",
  responded_partial: "Partially quoted",
  responded_complete: "Quotes received",
  converted_to_order: "Approved",
  expired: "Expired",
  closed: "Closed",
};
