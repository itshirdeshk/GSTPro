'use client';

import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface border border-border rounded-xl p-5',
        hover && 'cursor-pointer transition-all duration-200 hover:border-accent hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'up' | 'down';
  icon: React.ReactNode;
  color: 'accent' | 'green' | 'red' | 'amber' | 'cyan';
}

const colorMap = {
  accent: { bg: 'bg-accent/10', text: 'text-accent2', blob: 'bg-accent/5' },
  green: { bg: 'bg-green/10', text: 'text-green', blob: 'bg-green/5' },
  red: { bg: 'bg-red/10', text: 'text-red', blob: 'bg-red/5' },
  amber: { bg: 'bg-amber/10', text: 'text-amber', blob: 'bg-amber/5' },
  cyan: { bg: 'bg-cyan/10', text: 'text-cyan', blob: 'bg-cyan/5' },
};

export function StatCard({ label, value, change, changeType, icon, color }: StatCardProps) {
  const c = colorMap[color];
  return (
    <Card className="relative overflow-hidden">
      <div className={cn('absolute -top-6 -right-6 w-20 h-20 rounded-full', c.blob)} />
      <div className="flex items-start justify-between relative">
        <div className="flex flex-col gap-1">
          <span className="text-text3 text-sm">{label}</span>
          <span className="font-heading text-2xl font-bold">{value}</span>
          {change && (
            <span className={cn('text-xs font-medium', changeType === 'up' ? 'text-green' : 'text-red')}>
              {changeType === 'up' ? '↑' : '↓'} {change}
            </span>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', c.bg)}>
          <div className={c.text}>{icon}</div>
        </div>
      </div>
    </Card>
  );
}
