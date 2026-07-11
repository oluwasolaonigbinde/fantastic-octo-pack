/**
 * Admin-defined specification a distributor must supply when listing a product
 * in a subcategory. `options` is required and non-empty only when `type` is
 * `"enum"`. These now live on the subcategory, not the category.
 */
export interface BaseSpecification {
  key: string;
  type: "text" | "number" | "enum";
  options?: string[];
  /** Defaults to true on the backend. */
  required?: boolean;
  unit?: string;
}

/**
 * A single admin-defined subcategory under a category. Each carries its own
 * Mongo `_id` (products reference the chosen subcategory by that id), its own
 * specifications (the values a distributor must supply when listing in it), and
 * whether products in it require installation.
 */
export interface Subcategory {
  _id: string;
  name: string;
  /** Specifications distributors must supply when listing under this subcategory. */
  specifications: BaseSpecification[];
  /** Whether products in this subcategory require installation. */
  requiresInstallation: boolean;
}

/** Category create/update bodies carry only name + description. Subcategories
 * are managed through their own routes (`/categories/:id/subcategories`). */
export interface CreateCategory {
  name: string;
  description?: string;
}

export type UpdateCategory = Partial<CreateCategory>;

/** Request body for POST /categories/:id/subcategories. */
export interface CreateSubcategory {
  name: string;
  /** Specifications distributors must supply when listing under this subcategory. */
  specifications?: BaseSpecification[];
  /** Whether products in this subcategory require installation. */
  requiresInstallation?: boolean;
}

/** Request body for PATCH /categories/:id/subcategories/:subId — all optional. */
export type UpdateSubcategory = Partial<CreateSubcategory>;

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
  /** Admin-defined subcategories, each with its own specs and install flag. */
  subcategories: Subcategory[];
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
