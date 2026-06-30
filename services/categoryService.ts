import {
  CategoryListResponse,
  CategoryResponse,
  CreateCategory,
  UpdateCategory,
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
  limit?: number
): Promise<CategoryListResponse> => {
  const response = await fetch(
    `${apiUrl("/categories")}?page=${page || 1}&limit=${limit || 10}`,
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

const categoryService = {
  fetchCategories,
  fetchCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

export default categoryService;
