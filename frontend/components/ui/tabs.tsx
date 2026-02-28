'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex bg-bg3 rounded-lg p-1 gap-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
            activeTab === tab.key
              ? 'bg-surface2 text-text shadow-sm'
              : 'text-text3 hover:text-text2'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
