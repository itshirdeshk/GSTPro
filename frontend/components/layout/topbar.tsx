'use client';

import { usePathname } from 'next/navigation';
import { Menu, Bell, Search } from 'lucide-react';
import { useUIStore } from '@/lib/stores/ui-store';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/invoices': 'Invoices',
  '/customers': 'Customers',
  '/products': 'Products',
  '/payments': 'Payments',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export function Topbar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleMobileSidebar } = useUIStore();

  const title = pageTitles[pathname] || 'Sales Suite';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-bg2 border-b border-border px-6 py-3.5 flex items-center gap-4 transition-all duration-300',
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-65'
      )}
    >
      <button
        onClick={toggleMobileSidebar}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-text3 hover:text-text hover:bg-surface transition-colors"
      >
        <Menu size={20} />
      </button>

      <h1 className="font-heading text-xl font-bold">{title}</h1>

      <div className="flex-1" />

      {/* Search (desktop) */}
      <div className="hidden lg:flex items-center gap-2 bg-bg3 rounded-lg px-3 py-2 border border-border min-w-60">
        <Search size={16} className="text-text3" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-sm text-text placeholder:text-text3 outline-none flex-1"
        />
        <kbd className="text-[10px] text-text3 bg-surface px-1.5 py-0.5 rounded">⌘K</kbd>
      </div>

      <ThemeSwitcher />

      <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-text3 hover:text-text hover:bg-surface transition-colors">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red rounded-full" />
      </button>
    </header>
  );
}
