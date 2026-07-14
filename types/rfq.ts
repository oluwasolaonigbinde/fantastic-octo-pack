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

export interface Rfq {
  _id: string;
  buyer: string | UserRef;
  title?: string | null;
  items: RfqLineItem[];
  /** Populated by the backend routing engine when the draft is submitted. */
  targetDistributors: (string | UserRef)[];
  additionalNotes?: string | null;
  deliveryAddress?: DeliveryAddressSnapshot | null;
  deliveryAddressId?: string | null;
  deliveryTimeline?: string | null;
  attachments?: AttachmentRef[];
  isBulk: boolean;
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
