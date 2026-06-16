"use client";

import StoreProvider from "@/store/providers/storeProviders";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}
