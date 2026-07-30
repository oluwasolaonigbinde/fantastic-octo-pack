import { UserData } from "./user";
import { BaseSpecification } from "./categories";

/**
 * Category as returned on a product read: the backend always populates it and
 * slims it to these fields. May still be a bare id string for unpopulated or
 * legacy reads, so consumers should use the `getProductCategory*` helpers.
 */
export interface ProductCategoryRef {
  _id: string;
  name: string;
  description?: string;
}

/**
 * The product's chosen subcategory, expanded from its id into the matching
 * subcategory subdocument on read. May be a bare id string when the category
 * is unpopulated or the subcategory was removed.
 */
export interface ProductSubcategoryRef {
  _id: string;
  name: string;
  specifications?: BaseSpecification[];
  requiresInstallation?: boolean;
}

export interface ProductImage {
  url: string;
  cloudinary_id: string;
  isDefault: boolean;
  originalName?: string;
}

export type ProductStatus = "draft" | "pending" | "approved" | "rejected";
export type OemApprovalStatus =
  | "not_requested"
  | "pending"
  | "approved"
  | "rejected";

export interface KeyAttributeItem {
  spec?: string;
  detail?: string;
  label?: string;
  value?: string;
}

export interface KeyAttributes {
  industry_specific?: KeyAttributeItem[];
  other?: KeyAttributeItem[];
}

export interface CertificationRef {
  name?: string;
  url: string;
  cloudinary_id?: string;
  originalName?: string;
}

/**
 * Value supplied for one of the category's admin-defined base specifications.
 * Required base specs must be supplied when listing a product in that category.
 */
export interface CategorySpecification {
  key: string;
  value: string;
}

/** Distributor-defined free-form specification (key/value pair). */
export interface CustomSpecification {
  key: string;
  value: string;
}

/**
 * Snapshot of an edit made to an already-approved product. The change is held
 * here (not applied to the live listing) until an admin approves it.
 */
export interface ProductPendingRevision {
  baseVersion?: number;
  revisionStatus?: "pending" | "rejected";
  submittedAt?: string;
  visibilityRejectionReason?: string | null;
}

export interface Product {
  _id: string;
  name: string;
  /** Populated to `{ _id, name, description }` on reads; may be a bare id. */
  category: string | ProductCategoryRef;
  /** The chosen subcategory (single), expanded on read; may be a bare id. */
  sub_category?: string | ProductSubcategoryRef;
  brand_oem?: string;
  manufacturing_country?: string;
  condition?: "new" | "used" | "refurbished";
  pricePerUnit: number;
  pricing_type?: "fixed" | "negotiable" | "rfq";
  unit_of_measure?: string;
  /** Values for the category's admin-defined base specifications. */
  categorySpecifications?: CategorySpecification[];
  /** Distributor-defined free-form specifications. */
  customSpecifications?: CustomSpecification[];
  requiresInstallation?: boolean;
  images: ProductImage[];
  description?: string;
  availability_status?: "in_stock" | "out_of_stock" | "on_order";
  installation_time?: string;
  delivery_time?: string;
  return_policy?: string;
  sku?: string;
  video_link?: string;
  certifications?: CertificationRef[];
  brochure?: CertificationRef;
  featured?: boolean;
  oemApprovalStatus: OemApprovalStatus;
  hasOemBadge?: boolean;
  /** True when an edit to this approved product is awaiting admin review. */
  hasPendingRevision?: boolean;
  /** The proposed edit awaiting admin review (approved-product edits). Null when none. */
  pendingRevision?: ProductPendingRevision | null;
  visibilityRejectionReason?: string;
  oemRejectionReason?: string;
  createdBy: string | UserData;
  assignedOem?: string | UserData;
  status: ProductStatus;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;

  /** On-hand stock quantity. `availability_status` is derived from this. */
  quantityAvailable?: number;
  /** Units currently reserved by open orders (not available for sale). */
  quantityReserved?: number;

  // --- Legacy compatibility (read-only; no longer sent on create/update) ---
  /** @deprecated Legacy field. Prefer pricing_type. */
  priceMode?: "fixed" | "negotiable";
  /** @deprecated Legacy field. */
  countries?: string[];
  /** @deprecated Legacy field. */
  isRfqAvailable?: boolean;
  /** @deprecated Legacy field; replaced by categorySpecifications/customSpecifications. */
  keySpecifications?: string;
  /** @deprecated Legacy field; replaced by categorySpecifications/customSpecifications. */
  key_attributes?: KeyAttributes;
}

export interface ProductStatusCounts {
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface ProductListSummary {
  statusCounts: ProductStatusCounts;
}

export interface UpdateProduct {
  name?: string;
  /** Category id. */
  category?: string;
  /** Subcategory id (must be one of the category's subcategories). */
  sub_category?: string;
  brand_oem?: string;
  assignedOem?: string | null;
  manufacturing_country?: string;
  condition?: "new" | "used" | "refurbished";
  pricePerUnit?: number;
  pricing_type?: "fixed" | "negotiable" | "rfq";
  unit_of_measure?: string;
  /** On-hand stock quantity. */
  quantityAvailable?: number;
  categorySpecifications?: CategorySpecification[];
  customSpecifications?: CustomSpecification[];
  images?: ProductImage[];
  description?: string;
  availability_status?: "in_stock" | "out_of_stock" | "on_order";
  installation_time?: string;
  delivery_time?: string;
  return_policy?: string;
  sku?: string;
  video_link?: string;
  certifications?: CertificationRef[];
  brochure?: CertificationRef;
}

export interface ProductListResponse {
  success: boolean;
  message: string;
  data: {
    docs: Product[];
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: boolean | null;
    previousPage: boolean | null;
    totalDocs: number;
    totalPages: number;
    summary?: ProductListSummary;
  };
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: Product;
}

export type CreateProductDto = {
  name: string;
  /** Category id. */
  category: string;
  /** Subcategory id — required; must be one of the category's subcategories. */
  sub_category: string;
  brand_oem?: string;
  assignedOem?: string | null;
  manufacturing_country: string;
  condition: "new" | "used" | "refurbished";
  pricePerUnit: number;
  pricing_type: "fixed" | "negotiable" | "rfq";
  unit_of_measure: string;
  /** Initial on-hand stock quantity. */
  quantityAvailable?: number;
  categorySpecifications?: CategorySpecification[];
  customSpecifications?: CustomSpecification[];
  description: string;
  availability_status: "in_stock" | "out_of_stock" | "on_order";
  installation_time: string;
  delivery_time: string;
  images: ProductImage[];
  return_policy?: string;
  sku?: string;
  video_link?: string;
  certifications?: CertificationRef[];
};

export type ReviewProductDto = {
  action: "approve" | "reject";
  rejectionReason?: string;
};

/* ---------------------------------------------------------------- */
/* Stock movements                                                  */
/* ---------------------------------------------------------------- */

export type StockMovementType =
  | "opening_stock"
  | "stock_in"
  | "stock_out"
  | "adjustment"
  | "reservation"
  | "release"
  | "sale";

/** A single immutable entry in a product's stock ledger. */
export interface StockMovement {
  _id: string;
  type: StockMovementType;
  product: string;
  owner: string;
  actor?: string;
  order?: string;
  quantity: number;
  availableBefore: number;
  reservedBefore: number;
  availableAfter: number;
  reservedAfter: number;
  reference?: string;
  correlationId?: string;
  reason?: string;
  createdAt: string;
}

/** Body for POST /products/{id}/stock-in and /stock-out (delta). */
export interface StockDeltaDto {
  quantity: number;
  reason?: string;
}

/** Body for POST /products/{id}/adjust (absolute on-hand quantity). */
export interface StockAdjustDto {
  quantity: number;
  reason?: string;
}

/** Body for POST /products/{id}/inquiries. */
export interface ProductInquiryDto {
  firstName: string;
  lastName: string;
  email: string;
  description: string;
}

export interface StockMovementResponse {
  success: boolean;
  message: string;
  data: StockMovement;
}

export interface StockMovementListResponse {
  success: boolean;
  message: string;
  data: StockMovement[];
}

export type ReviewProductVisibilityDto = {
  action: "approve" | "reject";
  rejectionReason?: string;
};
