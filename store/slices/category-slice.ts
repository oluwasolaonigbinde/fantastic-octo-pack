import categoryService from "@/services/categoryService";
import { Category, CategoryListRequest, CategoryResponse, CreateCategory, UpdateCategory } from "@/types/categories";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CategorySliceState {
  categories: Category[];
  category: Category | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  message: string;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: boolean | null;
  previousPage: boolean | null;
  totalCategories: number;
  totalPages: number;
}

const initialState: CategorySliceState = {
  categories: [],
  category: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
  page: 1,
  limit: 10,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
  totalCategories: 0,
  totalPages: 0,
}

// Create Category
export const createNewCategory = createAsyncThunk(
  "category/create",
  async ({token, categoryData}:{token: string, categoryData: CreateCategory}, thunkAPI) => {
    try {
      return await categoryService.createCategory(token, categoryData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Creating category failed"
      );
    }
  }
);

// fetch categories
export const fetchCategories = createAsyncThunk(
  "category/fetch",
  async ({page, limit}:CategoryListRequest, thunkAPI) => {
    try {
      return await categoryService.fetchCategories(page, limit);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Fetching categories failed"
      );
    }
  }
);

// fetch category by ID
export const fetchCategoryById = createAsyncThunk(
  "category/fetchById",
  async ({token, categoryId}:{token: string, categoryId: string}, thunkAPI) => {
    try {
      return await categoryService.fetchCategoryById(token, categoryId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Fetching category failed"
      );
    }
  }
);

// Update category
export const updateCategory = createAsyncThunk(
  "category/update",
  async ({token, categoryId, categoryData}:{token: string, categoryId: string, categoryData: UpdateCategory}, thunkAPI) => {
    try {
      return await categoryService.updateCategory(token, categoryId, categoryData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Updating category failed"
      );
    }
  }
);

// Delete category
export const deleteCategory = createAsyncThunk(
  "category/delete",
  async ({token, categoryId}:{token: string, categoryId: string}, thunkAPI) => {
    try {
      return await categoryService.deleteCategory(token, categoryId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Deleting category failed"
      );
    }
  }
);

// Category slice
const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    resetCategories: (state) => {
      state.categories = [];
      state.category = null;
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    // setProducts: (state, action: PayloadAction<{doc:Product[]}>) => {
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
    setCategory: (state, action: PayloadAction<Category | null>) => {
      state.category = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
    // create category
      .addCase(createNewCategory.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "";
      })
      .addCase(createNewCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.message = action.payload.message;
        state.category = action.payload.data;
      })
      .addCase(createNewCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload as string;
      })
      // fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "";
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.message = action.payload.message;
        state.categories = action.payload.data.docs;
        state.page = action.payload.data.page;
        state.limit = action.payload.data.limit;
        state.hasNextPage = action.payload.data.hasNextPage;
        state.hasPreviousPage = action.payload.data.hasPreviousPage;
        state.nextPage = action.payload.data.nextPage;
        state.previousPage = action.payload.data.previousPage;
        state.totalCategories = action.payload.data.totalDocs;
        state.totalPages = action.payload.data.totalPages;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload as string;
      })
      // fetch category by ID
      .addCase(fetchCategoryById.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "";
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = action.payload.success;
        state.message = action.payload.message;
        state.category = action.payload.data;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload as string;
      })
      // update category
      .addCase(updateCategory.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "";
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = action.payload.success;
        state.message = action.payload.message;
        state.category = action.payload.data;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload as string;
      })
      // delete category
      .addCase(deleteCategory.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "";
      })
      .addCase(deleteCategory.fulfilled, (state) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.message = "Category deleted successfully";
        state.category = null;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.payload as string;
      })
    }
});

export const {setCategories,resetCategories, setCategory} = categorySlice.actions
export default categorySlice.reducer;