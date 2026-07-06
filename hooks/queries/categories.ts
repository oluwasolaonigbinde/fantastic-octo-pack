"use client";

/**
 * TanStack Query hooks for the categories module. Categories are near-static, so
 * they get a long `staleTime` — once fetched they stay fresh for 30 minutes and
 * every consumer shares the same cache entry instead of refetching on mount.
 *
 * The existing `categoryService` functions stay untouched and act as the
 * `queryFn` / `mutationFn`. Follows the products reference template.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAppSelector } from "@/hooks/useAppSelector";
import { queryKeys } from "@/lib/query-keys";
import categoryService from "@/services/categoryService";
import type { CreateCategory, UpdateCategory } from "@/types/categories";

const CATEGORIES_STALE_TIME = 30 * 60_000;

const useAuthToken = () =>
  useAppSelector((s) => s.auth.data?.tokens?.accessToken);

/**
 * The category list. The list endpoint is public and paginated; consumers pull a
 * large page (`limit: 50`) and use the returned `docs` directly. Returns the
 * `Category[]` so callers get the same shape as the old `state.category.categories`.
 */
export const useCategoriesQuery = (
  params: { page?: number; limit?: number } = {},
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => categoryService.fetchCategories(params.page, params.limit),
    staleTime: CATEGORIES_STALE_TIME,
    enabled: options?.enabled ?? true,
    select: (res) => res.data.docs,
  });

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

export const useCreateCategoryMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (categoryData: CreateCategory) =>
      categoryService.createCategory(token as string, categoryData),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
};

export const useUpdateCategoryMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      categoryData,
    }: {
      categoryId: string;
      categoryData: UpdateCategory;
    }) => categoryService.updateCategory(token as string, categoryId, categoryData),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
};

export const useDeleteCategoryMutation = () => {
  const token = useAuthToken();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) =>
      categoryService.deleteCategory(token as string, categoryId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
};
