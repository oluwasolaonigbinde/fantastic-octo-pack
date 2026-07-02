"use client";

import StoreProvider from "@/store/providers/storeProviders";
import QueryProvider from "@/store/providers/QueryProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <QueryProvider>{children}</QueryProvider>
    </StoreProvider>
  );
}
