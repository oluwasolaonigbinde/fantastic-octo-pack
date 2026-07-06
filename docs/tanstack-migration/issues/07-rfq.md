# 07 — RFQ ⬜ Todo

Migrate `store/slices/rfq-slice.ts` + `services/rfqService.ts` to
`hooks/queries/rfqs.ts`. Keys: `queryKeys.rfqs` (`list`, `detail`).

## Steps

- [ ] Create `hooks/queries/rfqs.ts` (list + detail reads, create/respond/quote
      mutations invalidating `queryKeys.rfqs.all`).
- [ ] Migrate consumers:
  - [ ] `app/dashboard/distributor/page.tsx`
  - [ ] `app/dashboard/distributor/quotes/page.tsx`
  - [ ] `app/dashboard/distributor/subscriptions/page.tsx`
  - [ ] `app/dashboard/buyer/rfqs/page.tsx`
  - [ ] `app/dashboard/buyer/rfqs/[rfqId]/page.tsx`
- [ ] Remove rfq thunks/reducers; drop slice + `store/index.ts` entry if unused.
- [ ] `npx tsc --noEmit` clean.
