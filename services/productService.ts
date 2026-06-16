import {
  CreateProductDto,
  ProductResponse,
  ProductListResponse,
  ProductStatus,
  ReviewProductDto,
  ReviewProductVisibilityDto,
  UpdateProduct,
} from "@/types/product";
import { apiUrl } from "@/utils/api-base-url";

export interface FetchProductsParams {
  category?: string;
  createdBy?: string;
  assignedOem?: string;
  status?: ProductStatus;
  statuses?: ProductStatus[];
  oemApprovalStatus?: string;
  priceMode?: string;
  country?: string;
  search?: string;
  submittedFrom?: string;
  submittedTo?: string;
  page?: number;
  limit?: number;
  populate?: string;
  isRfqAvailable?: boolean;
  includeSummary?: boolean;
  token?: string;
}

// Fetch all products
const fetchAll = async (): Promise<ProductListResponse> => {
  const response = await fetch(apiUrl("/products"), {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Creating product failed");
  }
  const result = await response.json();

  return result;
};

// Fetches products listed by the current user
const fetchMyProducts = async (
  id: string,
  token?: string
): Promise<ProductListResponse> => {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${apiUrl("/products")}?createdBy=${id}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Fetching products failed");
  }
  const result = await response.json();

  return result;
}

// Fetch single product by ID
const fetchById = async (id: string, token?: string): Promise<ProductResponse> => {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    apiUrl(`/products/${id}?populate=createdBy,assignedOem`),
    { method: "GET", headers, cache: "no-store" },
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Fetching product failed");
  }

  const result = await response.json();

  return result;
};

// Fetch products by distributor ID
const fetchWithFilter = async (
  filters: FetchProductsParams
): Promise<ProductListResponse> => {
  const queryParams = new URLSearchParams();
  if (filters) {
    if (filters.category) queryParams.append("category", filters.category);
    if (filters.createdBy) queryParams.append("createdBy", filters.createdBy);
    if (filters.assignedOem) queryParams.append("assignedOem", filters.assignedOem);
    if (filters.status) queryParams.append("status", filters.status);
    if (!filters.status && filters.statuses?.length) {
      queryParams.append("statuses", filters.statuses.join(","));
    }
    if (filters.oemApprovalStatus)
      queryParams.append("oemApprovalStatus", filters.oemApprovalStatus);
    if (filters.priceMode) queryParams.append("priceMode", filters.priceMode);
    if (filters.country) queryParams.append("country", filters.country);
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.submittedFrom)
      queryParams.append("submittedFrom", filters.submittedFrom);
    if (filters.submittedTo) queryParams.append("submittedTo", filters.submittedTo);
    if (filters.populate) queryParams.append("populate", filters.populate);
    if (typeof filters.page === "number") queryParams.append("page", String(filters.page));
    if (typeof filters.limit === "number")
      queryParams.append("limit", String(filters.limit));
    if (filters.isRfqAvailable !== undefined)
      queryParams.append("isRfqAvailable", String(filters.isRfqAvailable));
    if (filters.includeSummary !== undefined)
      queryParams.append("includeSummary", String(filters.includeSummary));
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (filters.token) {
    headers["Authorization"] = `Bearer ${filters.token}`;
  }

  const response = await fetch(
    `${apiUrl("/products")}?${queryParams.toString()}`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Fetching products failed");
  }
  const result = await response.json();

  return result;
};

// Fetch products by category
const fetchByCategory = async (category: string, limit?: number): Promise<ProductListResponse> => {
  const params = new URLSearchParams();
  params.append("category", category);
  if (typeof limit === "number") params.append("limit", String(limit));
  const response = await fetch(`${apiUrl("/products")}?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Fetching products by category failed");
  }

  const result = await response.json();
  return result;
};

// Create product — accepts either a FormData (multipart with images) or a plain Product object
const createProduct = async (
  token: string,
  productData: FormData | CreateProductDto
): Promise<ProductResponse> => {
  const isFormData = productData instanceof FormData;
  const response = await fetch(apiUrl("/products"), {
    method: "POST",
    headers: isFormData
      ? { Authorization: `Bearer ${token}` }
      : { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: isFormData ? productData : JSON.stringify(productData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Creating product failed");
  }

  return await response.json();
};

// Update product
const updateProduct = async (
  token: string,
  productId: string,
  productData: FormData | UpdateProduct
): Promise<ProductResponse> => {
  const isFormData = productData instanceof FormData;
  const response = await fetch(apiUrl(`/products/${productId}`), {
    method: "PATCH",
    headers: isFormData
      ? { Authorization: `Bearer ${token}` }
      : {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
    body: isFormData ? productData : JSON.stringify(productData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Updating product failed");
  }

  return await response.json();
};

const submitProduct = async (
  token: string,
  productId: string
): Promise<ProductResponse> => {
  const response = await fetch(apiUrl(`/products/${productId}/submit`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Submitting product failed");
  }

  return await response.json();
};

// Review product (OEM approve / reject)
const reviewProduct = async (
  token: string,
  productId: string,
  dto: ReviewProductDto
): Promise<ProductResponse> => {
  const response = await fetch(apiUrl(`/products/${productId}/review`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: dto.action, rejectionReason: dto.rejectionReason }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Reviewing product failed");
  }

  return await response.json();
};

const reviewProductVisibility = async (
  token: string,
  productId: string,
  dto: ReviewProductVisibilityDto
): Promise<ProductResponse> => {
  const response = await fetch(apiUrl(`/products/${productId}/visibility`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: dto.action, rejectionReason: dto.rejectionReason }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Updating visibility failed");
  }

  return await response.json();
};

// Delete a product
const deleteProduct = async (productId: string, token: string) => {
  const response = await fetch(apiUrl(`/products/${productId}`), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Deleting product failed");
  }

  if (response.status === 403) {
    const errorData = await response.json();
    throw new Error(
      errorData.message ||
        "Only the creator or an admin may delete this product"
    );
  }

  if (response.status === 401) {
    const errorData = await response.json();
    throw new Error(errorData.message || "User not authenticated");
  }

  return { success: true, message: "Product deleted successfully" };
};

const productService = {
  fetchAll,
  fetchMyProducts,
  fetchById,
  fetchWithFilter,
  fetchByCategory,
  createProduct,
  updateProduct,
  submitProduct,
  reviewProduct,
  reviewProductVisibility,
  deleteProduct,
};

export default productService;
