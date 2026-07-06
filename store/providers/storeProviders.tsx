"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore, AppStore } from "../index";
import { setUser } from "@/store/slices/auth-slice";
import {
  buildLocalRoleAuthPreloadedState,
  writeLocalRoleAuthUser,
} from "@/utils/localRoleAuth";
import {
  AUTH_LOGOUT_PING_KEY,
  AUTH_SESSION_STORAGE_KEY,
  buildAuthSessionPreloadedState,
  clearAuthSessionUser,
  isPersistentSession,
  readAuthSessionUser,
  writeAuthSessionUser,
} from "@/utils/authSession";
import {
  clearAuthRoleCookie,
  writeAuthRoleCookie,
} from "@/utils/authRoleCookie";

const buildPreloadedState = () =>
  buildAuthSessionPreloadedState() ?? buildLocalRoleAuthPreloadedState();

// Mirror the persisted auth session into the `baiy_role` cookie so Next.js
// middleware can enforce dashboard role boundaries server-side.
const syncRoleCookie = (role: string | null | undefined) => {
  if (role) {
    writeAuthRoleCookie(role, isPersistentSession());
  } else {
    clearAuthRoleCookie();
  }
};

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store] = useState<AppStore>(() => makeStore(buildPreloadedState()));

  useEffect(() => {
    const storedUser = buildPreloadedState()?.auth.data;

    if (!store.getState().auth.data && storedUser) {
      store.dispatch(setUser(storedUser));
    }

    const persistCurrentSession = () => {
      const user = store.getState().auth.data;
      writeAuthSessionUser(user);
      writeLocalRoleAuthUser(user);
      syncRoleCookie(user?.role);
    };

    persistCurrentSession();

    const unsubscribe = store.subscribe(persistCurrentSession);

    // Keep every tab's session in sync via the shared localStorage backend.
    const handleStorage = (event: StorageEvent) => {
      const isLogoutPing = event.key === AUTH_LOGOUT_PING_KEY;
      const isSessionCleared =
        event.key === AUTH_SESSION_STORAGE_KEY && event.newValue === null;
      const isSessionSet =
        event.key === AUTH_SESSION_STORAGE_KEY && event.newValue !== null;

      const currentUser = store.getState().auth.data;

      // Cross-tab logout: another tab logged out (or cleared its session) —
      // tear this tab's session down too so no tab stays authenticated.
      if (isLogoutPing || isSessionCleared) {
        if (!currentUser) {
          return;
        }

        clearAuthSessionUser();
        store.dispatch(setUser(null));

        // Only bounce to login if this tab is sitting on a protected route;
        // public pages just reflect the logged-out state via the navbar.
        if (
          typeof window !== "undefined" &&
          window.location.pathname.startsWith("/dashboard")
        ) {
          window.location.href = "/login";
        }

        return;
      }

      // Cross-tab login: another tab signed in — adopt that session here so
      // already-open tabs become authenticated automatically. Compare tokens
      // to stay idempotent and avoid a write/echo loop between tabs.
      if (isSessionSet) {
        const incomingUser = readAuthSessionUser();

        if (
          incomingUser &&
          incomingUser.tokens?.accessToken !== currentUser?.tokens?.accessToken
        ) {
          store.dispatch(setUser(incomingUser));
        }
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
