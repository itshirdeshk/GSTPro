'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-gradient-to-br from-accent to-accent2 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/25 active:translate-y-0',
      secondary:
        'bg-surface2 text-text border border-border hover:border-accent',
      danger:
        'bg-red/15 text-red border border-red/20 hover:bg-red/25',
      ghost:
        'text-text2 hover:text-text hover:bg-surface',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-md',
      md: 'text-sm px-5 py-2.5 rounded-lg',
      lg: 'text-base px-6 py-3 rounded-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, type ButtonProps };
