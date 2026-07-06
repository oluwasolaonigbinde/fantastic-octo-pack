# 00 — Foundation ✅ Done

Sets up TanStack Query so module migrations can begin.

## Done

- [x] `npm install @tanstack/react-query @tanstack/react-query-devtools`
- [x] `lib/query-client.ts` — `QueryClient` factory (browser singleton, fresh on
      server). Defaults: `staleTime 60s`, `gcTime 5m`, `refetchOnWindowFocus
      false`, `retry 1`.
- [x] `store/providers/QueryProvider.tsx` — client provider + devtools (dev only).
- [x] `app/providers.tsx` — `QueryProvider` nested inside `StoreProvider`.
- [x] `lib/query-keys.ts` — central key factory for all modules.
- [x] `hooks/queries/products.ts` — reference hooks (template for all modules).

## Notes for migrators

- Redux stays for auth/session + UI state. Only server data moves to Query.
- Devtools button appears bottom-left in dev — use it to watch cache hits.
