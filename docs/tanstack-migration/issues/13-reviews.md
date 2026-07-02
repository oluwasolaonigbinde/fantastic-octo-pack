# 13 — Reviews ⬜ Todo

`services/reviewService.ts`, no slice. Migrate to `hooks/queries/reviews.ts`.
Keys: `queryKeys.reviews` (`forProduct` — extend for engineer reviews as needed).

## Steps

- [ ] Create `hooks/queries/reviews.ts`:
  - [ ] read hook for a product's / engineer's reviews.
  - [ ] `useSubmitReviewMutation()` → invalidate the relevant reviews key (and
        the product/engineer detail if it shows an aggregate rating).
- [ ] Migrate consumers:
  - [ ] `app/service-engineers/profile/EngineerProfilePage.client.tsx`
  - [ ] `app/dashboard/buyer/_components/rate-engineer-dialog.tsx`
- [ ] `npx tsc --noEmit` clean.

If reviews are keyed by engineer as well as product, add
`queryKeys.reviews.forEngineer(id)` to `lib/query-keys.ts`.
