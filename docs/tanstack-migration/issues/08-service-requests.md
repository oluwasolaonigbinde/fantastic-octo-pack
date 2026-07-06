# 08 — Service Requests ⬜ Todo

Migrate `store/slices/service-request-slice.ts` +
`services/serviceRequestService.ts` to `hooks/queries/service-requests.ts`.
Keys: `queryKeys.serviceRequests` (`buyer`, `engineer`, `detail`).

The two existing hooks (`useBuyerServiceRequests`, `useEngineerServiceRequests`)
map cleanly onto `buyer` / `engineer` query keys.

## Steps

- [ ] Create `hooks/queries/service-requests.ts`:
  - [ ] `useBuyerServiceRequestsQuery(filters)`
  - [ ] `useEngineerServiceRequestsQuery(filters)`
  - [ ] `useServiceRequestQuery(id)`
  - [ ] create/accept/complete mutations → invalidate
        `queryKeys.serviceRequests.all`.
- [ ] Migrate consumers:
  - [ ] `hooks/useBuyerServiceRequests.ts`
  - [ ] `hooks/useEngineerServiceRequests.ts`
  - [ ] `app/service-engineers/profile/ServiceJobRequestForm.tsx`
  - [ ] `app/dashboard/buyer/_components/service-request-detail-drawer.tsx`
  - [ ] `app/dashboard/engineer/_components/engineer-job-requests-content.tsx`
- [ ] Remove service-request thunks/reducers; drop slice + `store/index.ts` entry
      if unused.
- [ ] `npx tsc --noEmit` clean.
