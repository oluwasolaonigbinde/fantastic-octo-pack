/**
 * Admin-defined specification a distributor must supply when listing a product
 * in this category. `options` is required and non-empty only when `type` is
 * `"enum"`.
 */
export interface BaseSpecification {
  key: string;
  type: "text" | "number" | "enum";
  options?: string[];
  /** Defaults to true on the backend. */
  required?: boolean;
  unit?: string;
}

export interface UpdateCategory {
  name?: string;
  description?: string;
  /** Admin-defined subcategory names under this category. */
  subcategories?: string[];
  /** Admin-defined base specifications distributors must supply when listing. */
  baseSpecifications?: BaseSpecification[];
}

export interface CreateCategory {
  name: string;
  description: string;
  /** Admin-defined subcategory names under this category. */
  subcategories?: string[];
  /** Admin-defined base specifications distributors must supply when listing. */
  baseSpecifications?: BaseSpecification[];
}

export interface CategoryListRequest {
  page?: number;
  limit?: number;
  /** Case-insensitive search on the category name. */
  search?: string;
  /** Filter by the admin id that created the category. */
  createdBy?: string;
  /** Comma-separated relations to populate (e.g. "createdBy"). */
  populate?: string;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  /** Admin-defined subcategory names under this category. */
  subcategories?: string[];
  /** Admin-defined base specifications distributors must supply when listing. */
  baseSpecifications?: BaseSpecification[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryListResponse {
  data: {
    docs: Category[];
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: null;
    previousPage: null;
    totalDocs: number;
    totalPages: number;
  };
  success: boolean;
  message: string;
}
export interface CategoryResponse {
  success: boolean;
  message: string;
  data: Category;
}
