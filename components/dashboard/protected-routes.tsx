// components/auth/protected-route.tsx
"use client";

// import { useAuth } from "@/contexts/auth-context";
import { useAppSelector } from "@/hooks/useAppSelector";
import { UserRole } from "@/types/user";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = "/unauthorized",
}) => {
  const { data, isLoading } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!data?.tokens?.accessToken) {
      router.replace("/login");
      return;
    }

    if (requiredRole && data) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

      if (!roles.includes(data.role as UserRole)) {
        router.replace(fallbackPath);
      }
    }
  }, [isLoading, data, requiredRole, router, fallbackPath]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Image src="/logo.png" alt="logo" width={112} height={43} />
      </div>
    );
  }

  if (!data?.tokens?.accessToken) {
    return null;
  }

  if (
    requiredRole &&
    data &&
    !(Array.isArray(requiredRole)
      ? requiredRole.includes(data.role as UserRole)
      : data.role === requiredRole)
  ) {
    return null;
  }

  return <>{children}</>;
};
