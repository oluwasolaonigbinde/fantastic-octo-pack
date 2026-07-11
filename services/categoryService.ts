import {
  CategoryListRequest,
  CategoryListResponse,
  CategoryResponse,
  CreateCategory,
  CreateSubcategory,
  UpdateCategory,
  UpdateSubcategory,
} from "@/types/categories";
import { apiUrl } from "@/utils/api-base-url";

// Create category
const createCategory = async (
  token: string,
  categoryData: CreateCategory
): Promise<CategoryResponse> => {
  const response = await fetch(apiUrl("/categories"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(categoryData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Creating category failed");
  }
  const result = await response.json();
  return result;
};

// Fetch categories
const fetchCategories = async (
  page?: number,
  limit?: number,
  options?: Pick<CategoryListRequest, "search" | "createdBy" | "populate">
): Promise<CategoryListResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(page || 1));
  queryParams.append("limit", String(limit || 10));
  if (options?.search) queryParams.append("search", options.search);
  if (options?.createdBy) queryParams.append("createdBy", options.createdBy);
  if (options?.populate) queryParams.append("populate", options.populate);

  const response = await fetch(
    `${apiUrl("/categories")}?${queryParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Fetching categories failed");
  }
  const result = await response.json();

  return result;
};

// Fetch category by ID
const fetchCategoryById = async (
  token: string,
  categoryId: string
): Promise<CategoryResponse> => {
  const response = await fetch(apiUrl(`/categories/${categoryId}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Fetching category failed");
  }
  const result = await response.json();

  return result;
};

// Update category
const updateCategory = async (
  token: string,
  categoryId: string,
  categoryData: UpdateCategory
): Promise<CategoryResponse> => {
  const response = await fetch(apiUrl(`/categories/${categoryId}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(categoryData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Updating category failed");
  }
  const result = await response.json();

  return result;
};

// Delete category
const deleteCategory = async (
  token: string,
  categoryId: string
): Promise<void> => {
  const response = await fetch(apiUrl(`/categories/${categoryId}`), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Deleting category failed");
  }
  return;
};

// Add subcategory
const createSubcategory = async (
  token: string,
  categoryId: string,
  subcategoryData: CreateSubcategory
): Promise<CategoryResponse> => {
  const response = await fetch(
    apiUrl(`/categories/${categoryId}/subcategories`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subcategoryData),
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Creating subcategory failed");
  }
  return response.json();
};

// Update subcategory
const updateSubcategory = async (
  token: string,
  categoryId: string,
  subcategoryId: string,
  subcategoryData: UpdateSubcategory
): Promise<CategoryResponse> => {
  const response = await fetch(
    apiUrl(`/categories/${categoryId}/subcategories/${subcategoryId}`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subcategoryData),
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Updating subcategory failed");
  }
  return response.json();
};

// Delete subcategory
const deleteSubcategory = async (
  token: string,
  categoryId: string,
  subcategoryId: string
): Promise<CategoryResponse> => {
  const response = await fetch(
    apiUrl(`/categories/${categoryId}/subcategories/${subcategoryId}`),
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Deleting subcategory failed");
  }
  return response.json();
};

const categoryService = {
  fetchCategories,
  fetchCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};

export default categoryService;
