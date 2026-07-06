# 02 — Orders ⬜ Todo

Migrate the orders module from `store/slices/order-slice.ts` +
`services/orderService.ts` to `hooks/queries/orders.ts`.

> Follow the pattern in `hooks/queries/products.ts`. Keys live under
> `queryKeys.orders` in `lib/query-keys.ts` (already stubbed: `all`, `list`,
> `detail`).

## Steps

- [ ] Create `hooks/queries/orders.ts`. For each `order-slice` thunk, add a
      `useQuery` (reads) or `useMutation` (writes) using `orderService`.
- [ ] Mutations invalidate `queryKeys.orders.all` (or the specific
      `detail(id)`) in `onSuccess`.
- [ ] Migrate consumers:
  - [ ] `app/checkout/[orderId]/page.tsx`
  - [ ] `app/dashboard/distributor/orders/page.tsx`
  - [ ] `app/dashboard/distributor/orders/[orderId]/page.tsx`
  - [ ] `app/dashboard/distributor/orders/[orderId]/delivery/page.tsx`
  - [ ] `app/dashboard/buyer/BuyerDashboard.tsx`
  - [ ] `app/dashboard/buyer/orders/page.tsx`
  - [ ] `app/dashboard/buyer/orders/[orderId]/page.tsx`
  - [ ] `hooks/useOrderPayment.ts` (also touches wallet/payment — coordinate)
  - [ ] `hooks/useEscrowSummary.ts`
- [ ] Remove order thunks + extraReducers; drop the slice if nothing else uses
      it (and `order` from `store/index.ts`).
- [ ] `npx tsc --noEmit` clean.

## Coordinate

`hooks/useOrderPayment.ts` spans orders + wallet + payments. Whoever hits it
first should split it into per-module query hooks; the other modules then
consume those.
