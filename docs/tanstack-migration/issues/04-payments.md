# 04 — Payments ⬜ Todo

Migrate `store/slices/payment-slice.ts` + `services/paymentService.ts` to
`hooks/queries/payments.ts`. Keys: `queryKeys.payments` (`list`, `forOrder`).

## Steps

- [ ] Create `hooks/queries/payments.ts` (reads → `useQuery`, init/verify →
      `useMutation`). Payment mutations should also invalidate
      `queryKeys.orders.all` and `queryKeys.wallet.all` where a payment changes
      order/wallet state.
- [ ] Migrate consumers:
  - [ ] `hooks/usePayments.ts`
  - [ ] `hooks/useOrderPayment.ts` (shared — see Orders issue)
  - [ ] `app/dashboard/distributor/payments/page.tsx`
  - [ ] `app/dashboard/buyer/payments/page.tsx`
- [ ] Remove payment thunks/reducers; drop slice + `store/index.ts` entry if
      unused.
- [ ] `npx tsc --noEmit` clean.
