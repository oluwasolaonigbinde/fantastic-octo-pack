# 05 — Subscription ⬜ Todo

Migrate `store/slices/subscription-slice.ts` + `services/subscriptionService.ts`
to `hooks/queries/subscription.ts`. Keys: `queryKeys.subscription`
(`mine`, `features`).

## Steps

- [ ] Create `hooks/queries/subscription.ts`:
  - [ ] `useSubscriptionQuery()` (current plan) — key `subscription.mine(userId)`.
  - [ ] `useSubscriptionFeaturesQuery()` — key `subscription.features()`.
  - [ ] subscribe / change-plan / cancel → `useMutation`, invalidate
        `queryKeys.subscription.all`.
- [ ] Migrate consumers:
  - [ ] `hooks/useSubscription.ts`
  - [ ] `app/dashboard/distributor/subscriptions/page.tsx`
- [ ] Remove subscription thunks/reducers; drop slice + `store/index.ts` entry if
      unused.
- [ ] `npx tsc --noEmit` clean.
