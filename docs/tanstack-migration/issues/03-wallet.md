# 03 — Wallet ⬜ Todo

Migrate `store/slices/wallet-slice.ts` + `services/walletService.ts` to
`hooks/queries/wallet.ts`. Keys: `queryKeys.wallet` (`mine`, `escrowSummary`).

> `hooks/useWallet.ts` is the smallest possible example of the old pattern
> (`useEffect → dispatch(fetchMyWallet)`) — a clean first conversion.

## Steps

- [ ] Create `hooks/queries/wallet.ts`:
  - [ ] `useWalletQuery()` → `walletService` fetch, key `wallet.mine(userId)`.
  - [ ] top-up / transfer mutations → invalidate `queryKeys.wallet.all`.
- [ ] Migrate consumers:
  - [ ] `hooks/useWallet.ts` — replace body with `useWalletQuery` (keep the same
        return shape so callers don't change), or delete and point callers at the
        new hook.
  - [ ] `hooks/useWalletTopup.ts`
  - [ ] `hooks/useOrderPayment.ts` (shared — see Orders issue)
  - [ ] `app/dashboard/distributor/payments/page.tsx`
  - [ ] `app/dashboard/buyer/payments/page.tsx`
- [ ] Remove wallet thunks/reducers; drop slice + `store/index.ts` entry if
      unused.
- [ ] `npx tsc --noEmit` clean.
