'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'red' | 'amber' | 'cyan' | 'purple' | 'gray';
  className?: string;
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    PAID: { variant: 'green', label: 'Paid' },
    ACTIVE: { variant: 'green', label: 'Active' },
    ISSUED: { variant: 'cyan', label: 'Issued' },
    DRAFT: { variant: 'gray', label: 'Draft' },
    PARTIALLY_PAID: { variant: 'amber', label: 'Partial' },
    OVERDUE: { variant: 'red', label: 'Overdue' },
    CANCELLED: { variant: 'red', label: 'Cancelled' },
    EXPIRED: { variant: 'red', label: 'Expired' },
  };

  const config = map[status] || { variant: 'gray' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
