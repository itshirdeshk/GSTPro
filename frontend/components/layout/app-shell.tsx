'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { useUIStore } from '@/lib/stores/ui-store';
import { cn } from '@/lib/utils';
import { PageLoader } from '../ui/spinner';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) return <PageLoader />;
  if (!isAuthenticated) return <PageLoader />;

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <Topbar />
      <main
        className={cn(
          'transition-all duration-300 p-6',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-[260px]'
        )}
      >
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
