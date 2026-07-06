# 09 — Order Disputes ⬜ Todo

Migrate `store/slices/order-dispute-slice.ts` +
`services/orderDisputeService.ts` to `hooks/queries/order-disputes.ts`.
Keys: `queryKeys.orderDisputes` (`list`, `detail`).

## Steps

- [ ] Create `hooks/queries/order-disputes.ts` (list + detail reads, open/respond/
      resolve mutations invalidating `queryKeys.orderDisputes.all`; also
      invalidate `queryKeys.orders.detail(orderId)` where a dispute changes order
      state).
- [ ] Migrate consumers:
  - [ ] `hooks/useOrderDisputes.ts`
  - [ ] `app/dashboard/distributor/orders/[orderId]/disputes/[disputeId]/page.tsx`
  - [ ] `app/dashboard/buyer/orders/disputes/[disputeId]/page.tsx`
  - [ ] `app/dashboard/buyer/orders/[orderId]/page.tsx` (shared with Orders —
        coordinate)
  - [ ] `components/disputes/AddDisputeResponse.tsx`
- [ ] Remove order-dispute thunks/reducers; drop slice + `store/index.ts` entry if
      unused.
- [ ] `npx tsc --noEmit` clean.
