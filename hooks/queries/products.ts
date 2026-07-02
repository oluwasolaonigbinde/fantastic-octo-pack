"use client";

/**
 * TanStack Query hooks for the products module. This file is the reference
 * template for migrating every other module — copy the shape here:
 *
 *   - reads  -> `useQuery`, keyed via `queryKeys.products.*`
 *   - writes -> `useMutation` that invalidates the affected keys on success
 *   - the existing `productService` functions stay untouched and act as the
 *     `queryFn` / `mutationFn`. We are replacing the Redux thunk+slice caching
 *     layer, not the network layer.
 *
 * The auth token still lives in Redux (genuine client/session state), so read
 * hooks pull it from the store and pass it through. The token is intentionally
 * NOT part of the query key — the user id (or filters) identifies the data.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import productService, {
  type FetchProductsParams,
} from "@/services/productService";
import type {
  CreateProductDto,
  ReviewProductDto,
  ReviewProductVisibilityDto,
  UpdateProduct,
} from "@/types/product";

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

const useCurrentUserId = () => useAppSelector((s) => s.auth.data?._id);

/**
 * Public product catalog with server-side filters. Returns the `docs` array so
 * callers get `Product[]` directly (mirrors the old `state.product.products`).
 * The full paginated envelope is available via `meta` when needed.
 */
export const useProductsQuery = (
  filters: FetchProductsParams = {},
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.products.list(filters as Record<string, unknown>),
    queryFn: () => productService.fetchWithFilter({ ...filters, token }),
    enabled: options?.enabled ?? true,
    select: (res) => ({
      products: res.data.docs,
      meta: res.data,
      message: res.message,
    }),
  });
};

/** Products created by a given user (their listings). */
export const useMyProductsQuery = (
  userId: string | undefined,
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.products.mine(userId ?? "anonymous"),
    queryFn: () => productService.fetchMyProducts(userId as string, token),
    enabled: Boolean(userId) && (options?.enabled ?? true),
    select: (res) => ({
      products: res.data.docs,
      total: res.data.totalDocs,
      meta: res.data,
    }),
  });
};

/** Single product by id. */
export const useProductQuery = (
  id: string | undefined,
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: queryKeys.products.detail(id ?? ""),
    queryFn: () => productService.fetchById(id as string, token),
    enabled: Boolean(id) && (options?.enabled ?? true),
    select: (res) => res.data,
  });
};

/** Products filtered to a single category (public). */
export const useProductsByCategoryQuery = (
  category: string | undefined,
  limit?: number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: queryKeys.products.byCategory(category ?? "", limit),
    queryFn: () => productService.fetchByCategory(category as string, limit),
    enabled: Boolean(category) && (options?.enabled ?? true),
    select: (res) => res.data.docs,
  });

/** OEM listing requests assigned to the current OEM. */
export const useOemListingRequestsQuery = (
  filters: FetchProductsParams = {},
  options?: { enabled?: boolean },
) => {
  const token = useAuthToken();

  return useQuery({
    queryKey: [...queryKeys.products.all, "oem-listing-requests", filters],
    queryFn: () => productService.fetchWithFilter({ ...filters, token }),
    enabled: options?.enabled ?? true,
    select: (res) => ({ requests: res.data.docs, total: res.data.totalDocs }),
  });
};

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

/**
 * Every mutation invalidates the products root key on success so any mounted
 * list/detail refetches with fresh data. Narrow the invalidation if a screen
 * proves it needs to (e.g. only `queryKeys.products.detail(id)`).
 */
export const useCreateProductMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (productData: FormData | CreateProductDto) =>
      productService.createProduct(token as string, productData),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
};

export const useUpdateProductMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      productData,
    }: {
      id: string;
      productData: FormData | UpdateProduct;
    }) => productService.updateProduct(token as string, id, productData),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
};

export const useSubmitProductMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      productService.submitProduct(token as string, id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
};

export const useReviewProductMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ReviewProductDto }) =>
      productService.reviewProduct(token as string, id, dto),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
};

export const useReviewProductVisibilityMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: ReviewProductVisibilityDto;
    }) => productService.reviewProductVisibility(token as string, id, dto),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
};

export const useDeleteProductMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      productService.deleteProduct(id, token as string),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
};

export { useCurrentUserId };
