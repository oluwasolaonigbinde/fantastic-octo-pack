# 01 — Products ✅ Done

Reference implementation for the whole migration. All product reads/writes now
go through `hooks/queries/products.ts`; the Redux product slice has been deleted.

## Hooks — `hooks/queries/products.ts`

Reads: `useProductsQuery`, `useMyProductsQuery`, `useProductQuery`,
`useProductsByCategoryQuery`, `useOemListingRequestsQuery`.
Mutations: `useCreateProductMutation`, `useUpdateProductMutation`,
`useSubmitProductMutation`, `useReviewProductMutation`,
`useReviewProductVisibilityMutation`, `useDeleteProductMutation`.

`useProductsQuery` / `useMyProductsQuery` return `{ products, meta, ... }` so
consumers can read pagination fields (`meta.totalDocs`, `meta.page`,
`meta.totalPages`, `meta.hasNextPage`, `meta.nextPage`, …).

## Consumers migrated

- [x] `app/products/ProductPage.client.tsx` — `useProductsQuery`
- [x] `app/page.tsx` — `useProductsQuery`
- [x] `app/products/[id]/page.tsx` — `useProductQuery`
- [x] `app/dashboard/admin/products/page.tsx` — `useProductsQuery` (filters + pagination)
- [x] `app/dashboard/admin/products/[id]/page.tsx` — `useProductQuery` + `useReviewProductVisibilityMutation`
- [x] `app/dashboard/component/product-table.tsx` — `useProductsQuery` + `useMyProductsQuery`
- [x] `app/dashboard/oem/requests/page.tsx` — `useOemListingRequestsQuery`
- [x] `app/dashboard/oem/requests/[id]/page.tsx` — `useProductQuery` + `useReviewProductMutation`
- [x] `app/dashboard/oem/requests/[id]/edit/page.tsx` — `useProductQuery` + `useUpdateProductMutation`
- [x] `app/dashboard/oem/page.tsx` — `useOemListingRequestsQuery`
- [x] `app/dashboard/oem/distributors/page.tsx` — `useOemListingRequestsQuery`
- [x] `app/dashboard/oem/distributors/[id]/page.tsx` — `useMyProductsQuery`
- [x] `app/dashboard/oem/subscription/page.tsx` — `useOemListingRequestsQuery`
- [x] `app/dashboard/distributor/page.tsx` — `useMyProductsQuery`
- [x] `app/dashboard/distributor/subscriptions/page.tsx` — `useMyProductsQuery`
- [x] `app/dashboard/distributor/catalogue/page.tsx` — `useProductsQuery`
- [x] `app/dashboard/distributor/catalogue/[id]/page.tsx` — `useProductQuery`
- [x] `app/dashboard/distributor/catalogue/new/add-new-product.client.tsx`
      — `useCreateProductMutation` + `useSubmitProductMutation`

## Cleanup

- [x] `store/slices/product-slice.ts` deleted (thunks + reducers gone).
- [x] `product` reducer removed from `store/index.ts` / `RootState`.
- [x] `npx tsc --noEmit` clean; migrated files lint clean.

## Notes

- Detail/review/edit flows dropped their manual "refetch after mutate" — the
  mutations invalidate `queryKeys.products.*`, so open queries revalidate
  automatically.
- The `limit: 1000` + in-memory faceting on `/products` and admin listing
  summaries was intentionally left as-is; server-side pagination is the separate
  follow-up in the README.
