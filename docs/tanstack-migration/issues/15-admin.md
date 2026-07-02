# 15 — Admin ⬜ Todo

`services/adminService.ts`, no slice — admin dashboards call it directly with
`useState`/`useEffect`. Migrate to `hooks/queries/admin.ts`.
Keys: `queryKeys.admin` (`orders`; extend for users/rfqs/metrics as needed).

Admin tables also fetch `limit: 1000` in places (e.g. subscriptions) — flag any
you hit for the server-side pagination follow-up rather than fixing blind.

## Steps

- [ ] Extend `queryKeys.admin` in `lib/query-keys.ts` for each admin resource you
      touch (orders, platform users, agents, rfqs-orders, metrics).
- [ ] Create `hooks/queries/admin.ts` with a `useQuery` per admin read and
      mutations for admin actions (invalidate the specific admin key + any
      cross-module key the action changes, e.g. `queryKeys.orders.all`).
- [ ] Migrate consumers:
  - [ ] `app/dashboard/admin/page.tsx`
  - [ ] `app/dashboard/admin/orders/page.tsx`
  - [ ] `app/dashboard/admin/rfqs-orders/page.tsx`
  - [ ] `app/dashboard/admin/platform-users/page.tsx`
  - [ ] `app/dashboard/admin/platform-users/agents/detail/page.tsx`
- [ ] `npx tsc --noEmit` clean.
