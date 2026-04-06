'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/stores/ui-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  LayoutDashboard,
  FileText,
  ScrollText,
  Calculator,
  Users,
  Package,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  X,
} from 'lucide-react';

const navSections = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/analytics', icon: BarChart3, label: 'Analytics' },
      { href: '/invoices', icon: FileText, label: 'Invoices' },
      { href: '/quotations', icon: ScrollText, label: 'Quotations' },
      { href: '/customers', icon: Users, label: 'Customers' },
      { href: '/products', icon: Package, label: 'Products' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/payments', icon: CreditCard, label: 'Payments' },
      { href: '/expenses', icon: Receipt, label: 'Expenses' },
      { href: '/calculator', icon: Calculator, label: 'Calculator' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, sidebarMobileOpen, toggleSidebar, closeMobileSidebar } = useUIStore();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-bg2 border-r border-border z-50 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-65',
          // Mobile: off-canvas
          'max-md:-translate-x-full max-md:w-65',
          sidebarMobileOpen && 'max-md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2.5" onClick={closeMobileSidebar}>
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-accent to-cyan flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <span className="font-heading text-lg font-bold">Sales Suite</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-accent to-cyan flex items-center justify-center text-white font-bold text-sm mx-auto">
              S
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex w-7 h-7 items-center justify-center rounded-md text-text3 hover:text-text hover:bg-surface transition-colors"
          >
            <ChevronLeft size={16} className={cn('transition-transform', sidebarCollapsed && 'rotate-180')} />
          </button>
          <button
            onClick={closeMobileSidebar}
            className="md:hidden w-7 h-7 flex items-center justify-center rounded-md text-text3 hover:text-text"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-text3">
                  {section.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileSidebar}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-linear-to-r from-accent/20 to-cyan/10 text-accent2'
                          : 'text-text2 hover:text-text hover:bg-surface'
                      )}
                    >
                      <item.icon size={18} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-border">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-lg bg-linear-to-br from-accent to-cyan flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.name?.charAt(0) ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name ?? 'User'}</p>
                <p className="text-xs text-text3 truncate">{user?.email ?? ''}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text3 hover:text-red hover:bg-red/10 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-text3 hover:text-red hover:bg-red/10 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
