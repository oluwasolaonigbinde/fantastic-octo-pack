"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";

import authService from "@/services/authService";
import { setUser } from "@/store/slices/auth-slice";
import { isLocalRoleAuthRuntimeEnabled } from "@/utils/localRoleAuth";

import { knownDashboardRoleSegments } from "./component/dashboard-config";

export default function DashboardRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dispatch = useAppDispatch();
  const { data } = useAppSelector((state) => state.auth);
  const pathname = usePathname();
  const router = useRouter();
  const [hydratedToken, setHydratedToken] = useState<string | null>(null);
  const localRoleAuthEnabled = isLocalRoleAuthRuntimeEnabled();
  const accessToken = data?.tokens?.accessToken;
  const routeRole = pathname.split("/")[2] || "";
  const isHydratingProfile =
    Boolean(accessToken) &&
    hydratedToken !== accessToken &&
    !localRoleAuthEnabled;
  const isKnownRoleRoute = knownDashboardRoleSegments.has(routeRole);
  const isUnauthorizedRoleRoute =
    Boolean(data?.role) && isKnownRoleRoute && routeRole !== data?.role;
  const shouldBlockProtectedChildren =
    isHydratingProfile || !accessToken || isUnauthorizedRoleRoute;

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    if (localRoleAuthEnabled) {
      return;
    }

    if (!isHydratingProfile) {
      return;
    }

    let isMounted = true;

    void authService
      .getCurrentUser(accessToken)
      .then((currentUser) => {
        if (!isMounted) {
          return;
        }

        dispatch(
          setUser({
            ...currentUser,
            tokens: data?.tokens,
          }),
        );
        setHydratedToken(accessToken);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        dispatch(setUser(null));
        setHydratedToken(null);
        router.replace("/login");
      });

    return () => {
      isMounted = false;
    };
  }, [
    accessToken,
    data?.tokens,
    dispatch,
    isHydratingProfile,
    localRoleAuthEnabled,
    router,
  ]);

  useEffect(() => {
    if (isHydratingProfile) {
      return;
    }

    if (!data?.role) {
      return;
    }

    if (pathname === "/dashboard") {
      router.replace(`/dashboard/${data.role}`);
      return;
    }

    if (knownDashboardRoleSegments.has(routeRole) && routeRole !== data.role) {
      router.replace("/unauthorized");
    }
  }, [data?.role, isHydratingProfile, pathname, routeRole, router]);

  if (shouldBlockProtectedChildren) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen items-center justify-center bg-gray7">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      </SidebarProvider>
    );
  }

  return <SidebarProvider>{children}</SidebarProvider>;
}
