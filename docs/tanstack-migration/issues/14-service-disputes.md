# 14 — Service Disputes ⬜ Todo

`services/serviceDisputeService.ts`, no slice. Migrate to
`hooks/queries/service-disputes.ts`. Add a `queryKeys.serviceDisputes` block to
`lib/query-keys.ts` (`list`, `detail`, `resolutionSummary`).

## Steps

- [ ] Add `serviceDisputes` keys to `lib/query-keys.ts`.
- [ ] Create `hooks/queries/service-disputes.ts` (list/detail/summary reads;
      open/respond/resolve mutations invalidating the module root).
- [ ] Migrate consumers:
  - [ ] `app/dashboard/admin/disputes/page.tsx`
  - [ ] `app/dashboard/admin/disputes/resolution-summary/page.tsx`
  - [ ] `app/dashboard/buyer/_components/service-request-detail-drawer.tsx`
        (shared with Service Requests — coordinate)
- [ ] `npx tsc --noEmit` clean.
