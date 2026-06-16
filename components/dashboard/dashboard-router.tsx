"use client";

import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types/user';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Legacy-only router retained for isolated brownfield references.
const DashboardRouter: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect to appropriate dashboard based on role
    if (isAuthenticated && user) {
      switch (user.role) {
        case UserRole.BUYER:
          router.push('/dashboard/buyer');
          break;
        case UserRole.DISTRIBUTOR:
          router.push('/dashboard/distributor');
          break;
        case UserRole.OEM:
          router.push('/dashboard/oem');
          break;
        case UserRole.ENGINEER:
          router.push('/dashboard/engineer');
          break;
        case UserRole.ADMIN:
          router.push('/dashboard/admin');
          break;
        default:
          router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null; // Redirect will happen automatically
};

export default DashboardRouter;
