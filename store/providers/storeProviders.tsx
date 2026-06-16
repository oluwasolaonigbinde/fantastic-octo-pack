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
  buildAuthSessionPreloadedState,
  writeAuthSessionUser,
} from "@/utils/authSession";

const buildPreloadedState = () =>
  buildAuthSessionPreloadedState() ?? buildLocalRoleAuthPreloadedState();

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

    writeAuthSessionUser(store.getState().auth.data);
    writeLocalRoleAuthUser(store.getState().auth.data);

    const unsubscribe = store.subscribe(() => {
      writeAuthSessionUser(store.getState().auth.data);
      writeLocalRoleAuthUser(store.getState().auth.data);
    });

    return unsubscribe;
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
