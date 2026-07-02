# 12 — Messaging ⬜ Todo

`services/messagingService.ts`, no slice. Migrate to `hooks/queries/messaging.ts`.
Keys: `queryKeys.messaging` (`threads`, `thread`).

Messaging is realtime-ish, so tune freshness: short `staleTime` (e.g. `10_000`)
or a `refetchInterval` on the active thread. Send-message is a mutation that
invalidates (or optimistically updates) `queryKeys.messaging.thread(threadId)`.

## Steps

- [ ] Create `hooks/queries/messaging.ts`:
  - [ ] `useThreadsQuery()`, `useThreadQuery(threadId)`.
  - [ ] `useSendMessageMutation()` → invalidate the thread + threads list.
- [ ] Migrate consumers:
  - [ ] `components/messaging/ActiveMessagingPanel.tsx` (also calls
        `productService.fetchMyProducts` — reuse `useMyProductsQuery` from the
        products module)
  - [ ] `app/dashboard/buyer/BuyerDashboard.tsx`
- [ ] `npx tsc --noEmit` clean.
