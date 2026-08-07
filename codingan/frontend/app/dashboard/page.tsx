'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getDashboardRoute } from '@/lib/utils/roles';
import { Loader2 } from 'lucide-react';

/**
 * Dashboard Router — auto-redirects users to their role-specific dashboard.
 * Acts as a smart junction that eliminates "akses ditolak" dead-ends.
 */
export default function DashboardRouter() {
  const router = useRouter();
  const { isAuthenticated, user, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user?.role) {
      router.replace(getDashboardRoute(user.role));
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto" />
        <p className="text-sm text-[hsl(var(--text-muted))]">Mengarahkan ke dashboard...</p>
      </div>
    </div>
  );
}
