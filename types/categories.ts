export interface UpdateCategory {
  name?: string;
  description?: string;
}

export interface CreateCategory {
  name: string;
  description: string;
}

export interface CategoryListRequest {
  page?: number;
  limit?: number;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
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
