'use client';

import { cn } from '@/lib/utils';

export function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div
      className={cn(
        'border-2 border-border border-t-accent rounded-full animate-spin',
        sizes[size],
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="font-heading text-lg font-bold text-text mb-1">{title}</h3>
      {description && <p className="text-sm text-text3 mb-4 max-w-md">{description}</p>}
      {action}
    </div>
  );
}
