# 11 — Users ✅ Done

`services/userService.ts` has no dedicated data slice (auth stays in Redux).
Migrate profile/lookup reads to `hooks/queries/users.ts`.
Keys: `queryKeys.users` (`detail`, `list`).

> Do **not** move auth/session into Query — that stays in `auth-slice`. This is
> only for fetching *other* users' profiles and directory/search lookups.

## Steps

- [ ] Create `hooks/queries/users.ts` (`useUserQuery(id)`, `useUsersQuery(filters)`
      for search; update-profile mutation invalidating `queryKeys.users.detail`).
- [ ] Migrate consumers:
  - [ ] `app/distributor/profile/page.tsx`
  - [ ] `app/distributor/oem-profile/page.tsx`
  - [ ] `app/dashboard/buyer/rfqs/page.tsx` (user lookup only — coordinate w/ RFQ)
  - [ ] `components/features/search/SearchAutocomplete.tsx` (debounced search →
        `useQuery` keyed on the query string; keep `enabled` on non-empty term)
- [ ] `npx tsc --noEmit` clean.
