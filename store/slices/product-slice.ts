import productService from "@/services/productService";
import {
  CreateProductDto,
  Product,
  ReviewProductDto,
  ReviewProductVisibilityDto,
  UpdateProduct,
} from "@/types/product";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { FetchProductsParams } from "@/services/productService";
// import type { CreateProductDto } from "@/types/create-product-dto";

interface ProductSliceState {
  products: Product[] | null;
  myProducts: Product[] | null;
  product: Product | null;
  productsByCategory: Product[] | null;
  oemListingRequests: Product[] | null;
  oemListingTotal: number;
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
  totalProducts: number;
  totalPages: number;
}

const initialState: ProductSliceState = {
  products: null,
  myProducts: null,
  product: null,
  productsByCategory: null,
  oemListingRequests: null,
  oemListingTotal: 0,
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
  totalProducts: 0,
  totalPages: 0,
};

/**
 * Fetches all products listed
 * @params id user ID
 * @returns {Product[]} paginated product list
 */
export const fetchProducts = createAsyncThunk(
  "product/fetchAll",
  async (productFilters: FetchProductsParams, thunkAPI) => {
    try {
      // return await productService.fetchAll();
      return await productService.fetchWithFilter(productFilters);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Fetching products failed"
      );
    }
  }
);

/**
 * Fetches a single product by its ID
 * @param {string} id the id of the product
 * @param {string} token optional auth token for accessing non-public products
 * @returns {Product} the product
 */
export const fetchProductById = createAsyncThunk(
  "product/fetchById",
  async ({ id, token }: { id: string; token?: string }, thunkAPI) => {
    try {
      return await productService.fetchById(id, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Fetching product failed"
      );
    }
  }
);

/**
 * Fetches the products listed by the current user
 * @param id user ID
 * @returns {Product[]} paginated product list
 */
export const fetchUserProducts = createAsyncThunk(
  "product/mine",
  async (
    params: string | { id: string; token?: string },
    thunkAPI
  ) => {
    try {
      const request =
        typeof params === "string" ? { id: params, token: undefined } : params;

      return await productService.fetchMyProducts(request.id, request.token);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Updating product failed"
      );
    }
  }
);

/**
 * Updates a single product by its ID
 * @param {string} id the id of the product
 * @param {token} token user auth token
 * @param {productData} productData optional properties of the product
 * @returns {Product} the updated product
 */
export const updateProductById = createAsyncThunk(
  "product/updateById",
  async (
    {
      token,
      id,
      productData,
    }: { token: string; id: string; productData: FormData | UpdateProduct },
    thunkAPI
  ) => {
    try {
      return await productService.updateProduct(token, id, productData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Updating product failed"
      );
    }
  }
);

export const submitProductById = createAsyncThunk(
  "product/submitById",
  async ({ token, id }: { token: string; id: string }, thunkAPI) => {
    try {
      return await productService.submitProduct(token, id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Submitting product failed"
      );
    }
  }
);

 /**Fetches products by category
 * @param {string} category
 * @returns {Product[]} paginated product list
 */
export const fetchProductsByCategory = createAsyncThunk(
  "product/fetchByCategory",
  async (
    { category, limit }: { category: string; limit?: number },
    thunkAPI
  ) => {
    try {
      return await productService.fetchByCategory(category, limit);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Fetching category products failed"
      );
    }
  }
);

// Create product — productData can be a FormData (with images) or a plain Product object
export const createNewProduct = createAsyncThunk(
  "product/create",
  async (
    {
      token,
      productData,
    }: { token: string; productData: FormData | CreateProductDto },
    thunkAPI
  ) => {
    try {
      return await productService.createProduct(token, productData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Creating product failed"
      );
    }
  }
);

// Review product (OEM approve / reject)
export const reviewProductById = createAsyncThunk(
  "product/review",
  async (
    { token, id, dto }: { token: string; id: string; dto: ReviewProductDto },
    thunkAPI
  ) => {
    try {
      return await productService.reviewProduct(token, id, dto);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Reviewing product failed"
      );
    }
  }
);

export const reviewProductVisibilityById = createAsyncThunk(
  "product/reviewVisibility",
  async (
    {
      token,
      id,
      dto,
    }: { token: string; id: string; dto: ReviewProductVisibilityDto },
    thunkAPI
  ) => {
    try {
      return await productService.reviewProductVisibility(token, id, dto);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Updating visibility failed"
      );
    }
  }
);

// Fetch listing requests assigned to an OEM
export const fetchOemListingRequests = createAsyncThunk(
  "product/fetchOemListingRequests",
  async (params: FetchProductsParams, thunkAPI) => {
    try {
      return await productService.fetchWithFilter(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error
          ? error.message
          : "Fetching OEM listing requests failed"
      );
    }
  }
);

// Delete product by Id
export const deleteProductById = createAsyncThunk(
  "product/deleteById",
  async ({ token, id }: { token: string; id: string }, thunkAPI) => {
    try {
      return await productService.deleteProduct(id, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : "Deleting product failed"
      );
    }
  }
);

export const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    resetProducts: (state) => {
      state.products = null;
      state.product = null;
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    // setProducts: (state, action: PayloadAction<{doc:Product[]}>) => {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    setProduct: (state, action: PayloadAction<Product | null>) => {
      state.product = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // List
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.message = action.payload.message;
        state.isSuccess = action.payload.success;
        state.hasNextPage = action.payload.data.hasNextPage;
        state.hasPreviousPage = action.payload.data.hasPreviousPage;
        state.limit = action.payload.data.limit;
        state.nextPage = action.payload.data.nextPage;
        state.page = action.payload.data.page;
        state.previousPage = action.payload.data.previousPage;
        state.totalProducts = action.payload.data.totalDocs;
        state.totalPages = action.payload.data.totalPages;
        state.products = action.payload.data.docs;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message =
          (action.payload as string) || "Fetching products failed";
        state.products = null;
        state.page = 1;
        state.limit = 10;
        state.hasNextPage = false;
        state.hasPreviousPage = false;
        state.nextPage = null;
        state.previousPage = null;
        state.totalProducts = 0;
        state.totalPages = 0;
      })
      // User list
      .addCase(fetchUserProducts.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchUserProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.message = action.payload.message;
        state.hasNextPage = action.payload.data.hasNextPage;
        state.hasPreviousPage = action.payload.data.hasPreviousPage;
        state.limit = action.payload.data.limit;
        state.nextPage = action.payload.data.nextPage;
        state.page = action.payload.data.page;
        state.previousPage = action.payload.data.previousPage;
        state.totalProducts = action.payload.data.totalDocs;
        state.totalPages = action.payload.data.totalPages;
        state.myProducts = action.payload.data.docs;
      })
      .addCase(fetchUserProducts.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.isLoading = false;
        state.message =
          (action.payload as string) || "Fetching products failed";
        state.myProducts = null;
      })
      // Single
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = action.payload.success;
        state.message = action.payload.message;
        state.product = action.payload.data;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = (action.payload as string) || "Fetching product failed";
        state.product = null;
      });

    // OEM listing requests
    builder
      .addCase(fetchOemListingRequests.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchOemListingRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = action.payload.success;
        state.message = action.payload.message;
        state.oemListingRequests = action.payload.data.docs;
        state.oemListingTotal = action.payload.data.totalDocs;
      })
      .addCase(fetchOemListingRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message =
          (action.payload as string) || "Fetching OEM listing requests failed";
        state.oemListingRequests = null;
      });

    // Category
    builder
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = action.payload.success;
        state.message = action.payload.message;
        state.productsByCategory = action.payload.data.docs;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = (action.payload as string) || "Fetching category products failed";
      });
  },
});

export const { resetProducts, setProducts, setProduct } = productSlice.actions;
export default productSlice.reducer;
