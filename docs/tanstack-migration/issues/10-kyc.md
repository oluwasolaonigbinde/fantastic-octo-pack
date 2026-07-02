# 10 — KYC ✅ Done

`services/kycService.ts` has **no slice** — components call the service directly
with `useState`/`useEffect`. Migrate to `hooks/queries/kyc.ts`.
Keys: `queryKeys.kyc` (`mine`, `adminList`, `adminDetail`).

## Steps

- [ ] Create `hooks/queries/kyc.ts`:
  - [ ] `useMyKycQuery()`, `useAdminKycListQuery(filters)`,
        `useAdminKycDetailQuery(id)`.
  - [ ] upload / review (approve/reject) mutations → invalidate
        `queryKeys.kyc.all`.
- [ ] Migrate consumers (replace their local fetch state):
  - [ ] `components/kyc/submitter-kyc-view.tsx`
  - [ ] `components/kyc/distributor-kyc-view.tsx`
  - [ ] `components/kyc/admin-kyc-management.tsx`
- [ ] `npx tsc --noEmit` clean.

No slice to delete here — pure win, removes hand-rolled loading/error state.
