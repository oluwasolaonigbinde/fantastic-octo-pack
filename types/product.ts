import { UserData } from "./user";

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

export interface Product {
  _id: string;
  name: string;
  category: string;
  sub_category?: string;
  brand_oem?: string;
  manufacturing_country?: string;
  condition?: "new" | "used" | "refurbished";
  quantityAvailable?: number;
  priceMode?: "fixed" | "negotiable";
  pricePerUnit: number;
  pricing_type?: "fixed" | "negotiable" | "rfq";
  unit_of_measure?: string;
  countries?: string[];
  isRfqAvailable?: boolean;
  keySpecifications?: string;
  key_attributes?: KeyAttributes;
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
  oemApprovalStatus: OemApprovalStatus;
  hasOemBadge?: boolean;
  visibilityRejectionReason?: string;
  oemRejectionReason?: string;
  createdBy: string | UserData;
  assignedOem?: string | UserData;
  status: ProductStatus;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
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
  category?: string;
  sub_category?: string;
  brand_oem?: string;
  assignedOem?: string;
  manufacturing_country?: string;
  condition?: "new" | "used" | "refurbished";
  quantityAvailable?: number;
  priceMode?: "fixed" | "negotiable";
  pricePerUnit?: number;
  pricing_type?: "fixed" | "negotiable" | "rfq";
  unit_of_measure?: string;
  countries?: string[];
  isRfqAvailable?: boolean;
  keySpecifications?: string;
  key_attributes?: KeyAttributes;
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
  category: string;
  sub_category?: string;
  brand_oem?: string;
  assignedOem?: string;
  manufacturing_country: string;
  condition: "new" | "used" | "refurbished";
  quantityAvailable?: number;
  priceMode?: "fixed" | "negotiable";
  pricePerUnit: number;
  pricing_type: "fixed" | "negotiable" | "rfq";
  unit_of_measure: string;
  countries?: string[];
  isRfqAvailable?: boolean;
  keySpecifications?: string;
  key_attributes?: KeyAttributes;
  description: string;
  availability_status: "in_stock" | "out_of_stock" | "on_order";
  installation_time: string;
  delivery_time: string;
  images: ProductImage[];
  return_policy?: string;
  sku?: string;
  video_link?: string;
};

export type ReviewProductDto = {
  action: "approve" | "reject";
  rejectionReason?: string;
};

export type ReviewProductVisibilityDto = {
  action: "approve" | "reject";
  rejectionReason?: string;
};
