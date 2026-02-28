'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text3">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full bg-bg2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-text placeholder:text-text3',
              'transition-colors duration-200',
              'focus:border-accent focus:bg-surface focus:outline-none',
              icon && 'pl-10',
              error && 'border-red focus:border-red',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
