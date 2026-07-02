import { QueryClient, isServer } from "@tanstack/react-query";

/**
 * Default cache behavior for all queries. Tune per-query with `staleTime` /
 * `gcTime` overrides where a screen needs fresher or longer-lived data.
 *
 * - `staleTime: 60s` — a remounted screen serves cached data instantly and
 *   revalidates in the background instead of showing a blank spinner. This is
 *   the single biggest win over the old `useEffect -> dispatch(fetch)` pattern.
 * - `refetchOnWindowFocus: false` — the old code never refetched on focus;
 *   keep that behavior to avoid surprising extra requests during migration.
 * - `retry: 1` — one retry for transient network blips, then surface the error.
 */
const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });

let browserQueryClient: QueryClient | undefined;

/**
 * Returns a QueryClient. On the server a fresh client is created per call so
 * requests never share cache; in the browser a single client is reused across
 * the app's lifetime.
 */
export const getQueryClient = (): QueryClient => {
  if (isServer) {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
};
