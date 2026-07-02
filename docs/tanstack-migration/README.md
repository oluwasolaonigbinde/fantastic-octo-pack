# TanStack Query Migration

## Why this exists

The app felt slow and did "silly reloads" — navigating to a page you just saw
still showed a blank screen → spinner → refetch. Root causes we found:

1. **Everything is client-rendered** (~244 `"use client"` files). Pages fetch on
   mount via `useEffect → dispatch(fetchX)`, so every visit pays a full network
   round-trip before painting. There are **~55** such call sites.
2. **No caching layer.** Hand-written Redux Toolkit thunks (11 slices) with no
   dedup, no stale-while-revalidate, no "I already have this." **11** service
   calls even set `cache: "no-store"`, forcing a fresh hit every time.
3. **Over-fetching.** `/products` and admin subscriptions pull `limit: 1000`,
   then paginate and filter in-memory (the client doing the DB's job).
4. **localStorage write on every dispatch** (auth `store.subscribe`).

## The fix

Adopt **TanStack Query** for all *server* reads/writes. Keep **Redux** for
genuine client state (auth session, UI). Migrate **one module at a time** — each
module is an independent issue in [`issues/`](./issues) so multiple sessions can
work in parallel without colliding.

### What changes per module

| Before | After |
| --- | --- |
| `createAsyncThunk` in a `*-slice.ts` | `useQuery` / `useMutation` hook in `hooks/queries/<module>.ts` |
| `useEffect(() => dispatch(fetchX))` | call the query hook; it fetches + caches |
| `useAppSelector(s => s.x.isLoading)` | `const { data, isLoading, isError } = useXQuery()` |
| manual `invalidate` by refetching | `mutation.onSuccess → invalidateQueries` |

The **service files stay untouched** — they are the `queryFn`/`mutationFn`. We
are replacing the caching layer, not the network layer.

## Foundation (already done — see `issues/00-foundation.md`)

- `@tanstack/react-query` + devtools installed.
- `lib/query-client.ts` — `QueryClient` factory (`staleTime: 60s`,
  `refetchOnWindowFocus: false`, `retry: 1`).
- `store/providers/QueryProvider.tsx` — wraps the app under the Redux provider
  (wired in `app/providers.tsx`).
- `lib/query-keys.ts` — central query-key factory. **Every hook keys off this.**
- `hooks/queries/products.ts` — **reference implementation. Copy its shape.**

## Conventions

- One file per module: `hooks/queries/<module>.ts`, `"use client"` at top.
- Read hooks name: `useThingQuery`, `useThingsQuery`. Mutations:
  `useCreateThingMutation`, etc.
- Keys come **only** from `lib/query-keys.ts`. Add a module block there if
  missing.
- Auth token still lives in Redux — read it inside the hook
  (`useAppSelector(s => s.auth.data?.tokens?.accessToken)`) and pass to the
  service. Current user id is `s.auth.data?._id`. Do **not** put the token in the
  query key; key by user id / filters.
- Mutations `invalidateQueries` the affected keys in `onSuccess`.
- Delete the slice's thunks + extraReducers once every consumer is migrated. If a
  slice held real client state too, keep only that part.

## How to run in parallel

Each issue lists the files it owns. Modules are mostly disjoint. Shared touch
points to coordinate on:

- `lib/query-keys.ts` — append-only; add your module block, don't reorder others.
- `store/index.ts` — only edit when you fully delete a slice (last step of a
  module). Expect small merge conflicts here; they're trivial.

Pick an issue, set its status to **In progress** in the board below, open a
branch `feature/tanstack-<module>`, finish, flip to **Done**.

## Status board

| # | Module | Files/consumers | Status |
| --- | --- | --- | --- |
| 00 | Foundation | provider, query-client, query-keys | ✅ Done |
| 01 | Products | 17 consumers | ✅ Done (slice removed) |
| 02 | Orders | 7 pages + 2 hooks | ⬜ Todo |
| 03 | Wallet | 2 pages + 3 hooks | ⬜ Todo |
| 04 | Payments | 2 pages + 1 hook | ⬜ Todo |
| 05 | Subscription | 1 page + 1 hook | ⬜ Todo |
| 06 | Categories | 4 consumers | ⬜ Todo |
| 07 | RFQ | 5 pages | ⬜ Todo |
| 08 | Service Requests | 3 comps + 2 hooks | ⬜ Todo |
| 09 | Order Disputes | 4 consumers + 1 hook | ⬜ Todo |
| 10 | KYC | 3 components | ✅ Done |
| 11 | Users | 4 consumers | ✅ Done |
| 12 | Messaging | 2 consumers | ⬜ Todo |
| 13 | Reviews | 2 consumers | ⬜ Todo |
| 14 | Service Disputes | 3 consumers | ✅ Done |
| 15 | Admin | 5 pages | ✅ Done |

## Follow-ups (not part of per-module work)

- **Server-side pagination for `/products`** and admin subscriptions — kill the
  `limit: 1000` + client faceting once the backend exposes facet counts.
- **Move read-only public pages to Server Components** so data arrives with first
  paint.
- **Throttle the auth `store.subscribe`** localStorage write.
