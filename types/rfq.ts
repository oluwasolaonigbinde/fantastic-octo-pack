export type RfqStatus =
  | "draft"
  | "submitted"
  | "responded_partial"
  | "responded_complete"
  | "converted_to_order"
  | "closed";

export type QuoteStatus =
  | "pending_response"
  | "quoted"
  | "unavailable"
  | "selected_for_order"
  | "not_selected"
  | "expired_no_response"
  | "rejected_by_buyer";

export interface AttachmentRef {
  url: string;
  cloudinary_id: string;
  originalName?: string;
}

export interface RfqLineItem {
  product?: string | ProductRef;
  productName: string;
  quantity: number;
  notes?: string;
  model?: string;
  description?: string;
}

export interface ProductRef {
  _id: string;
  name: string;
  pricePerUnit?: number;
  images?: { url: string; cloudinary_id: string }[];
  category?: string;
}

export interface UserRef {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  displayPhoto?: { url: string; cloudinary_id: string };
  phoneNumber?: string;
  businessName?: string;
  distributorStoreProfile?: {
    businessName?: string;
  };
}

export interface Rfq {
  _id: string;
  buyer: string | UserRef;
  items: RfqLineItem[];
  targetDistributors: (string | UserRef)[];
  status: RfqStatus;
  additionalNotes?: string;
  isBulk: boolean;
  bulkBatch?: string;
  title?: string;
  deliveryLocation?: string;
  attachments?: AttachmentRef[];
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  _id: string;
  rfq: string | Rfq;
  distributor: string | UserRef;
  status: QuoteStatus;
  pricePerUnit?: number;
  totalPrice?: number;
  quantity?: number;
  terms?: string;
  notes?: string;
  leadTimeDays?: number;
  validUntil?: string;
  availableModel?: string;
  warranty?: string;
  stockStatus?: string;
  images?: AttachmentRef[];
  catalogue?: AttachmentRef;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RfqDetailResponse {
  rfq: Rfq;
  quotes: Quote[];
}

export interface QuoteStatusLabel {
  internal: QuoteStatus;
  display: string;
}

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  pending_response: "Open",
  quoted: "Responded",
  unavailable: "Not Available",
  selected_for_order: "Selected",
  not_selected: "Not Selected",
  expired_no_response: "Expired",
  rejected_by_buyer: "Rejected",
};

export const RFQ_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  responded_partial: "Partially Responded",
  responded_complete: "Fully Responded",
  converted_to_order: "Converted to Order",
  closed: "Closed",
};

// ─── Bulk RFQ ───────────────────────────────────────────────────────

export type BulkRfqBatchStatus =
  | "submitted"
  | "partially_quoted"
  | "fully_quoted"
  | "closed";

export interface BulkRfqBatch {
  _id: string;
  buyer: string | UserRef;
  title?: string;
  itemCount: number;
  status: BulkRfqBatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BulkRfqBatchListItem extends BulkRfqBatch {
  quotes: Quote[];
  quoteCount: number;
  pendingCount: number;
  quotedCount: number;
}

export interface BulkBatchDetailItem {
  rfq: Rfq;
  quote: Quote | null;
}

export interface BulkBatchDetailResponse {
  batch: BulkRfqBatch;
  items: BulkBatchDetailItem[];
}

export interface BulkRfqItemPayload {
  productName: string;
  quantity: number;
  distributorEmail: string;
  proposedDeliveryDate?: string;
  deliveryLocation?: string;
  additionalNote?: string;
}

export interface CreateBulkRfqResponse {
  batch: BulkRfqBatch;
  created: number;
  errors: { row: number; message: string }[];
}
