# 06 — Categories ⬜ Todo

Migrate `store/slices/category-slice.ts` + `services/categoryService.ts` to
`hooks/queries/categories.ts`. Keys: `queryKeys.categories` (`list`).

Categories are near-static — a good candidate for a longer `staleTime`
(e.g. `staleTime: 30 * 60_000`).

## Steps

- [ ] Create `hooks/queries/categories.ts` with `useCategoriesQuery()`.
- [ ] Migrate consumers:
  - [ ] `app/dashboard/admin/products/page.tsx`
  - [ ] `app/dashboard/component/product-table.tsx`
  - [ ] `app/dashboard/distributor/catalogue/page.tsx`
  - [ ] `app/dashboard/distributor/catalogue/new/add-new-product.client.tsx`
- [ ] Remove category thunks/reducers; drop slice + `store/index.ts` entry if
      unused.
- [ ] `npx tsc --noEmit` clean.
