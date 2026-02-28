'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/lib/stores/theme-store';

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg hover:bg-surface transition-colors">
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-surface transition-colors"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? (
        <Sun size={20} className="text-text2 hover:text-text transition-colors" />
      ) : (
        <Moon size={20} className="text-text2 hover:text-text transition-colors" />
      )}
    </button>
  );
}
