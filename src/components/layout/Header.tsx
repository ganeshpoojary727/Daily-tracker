import React from 'react';
import { Flame, Sun, Moon, Monitor, Menu, Github } from 'lucide-react';
import { useStreak } from '../../hooks/useStreak';
import { useSettingsStore } from '../../store/useSettingsStore';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const { currentStreak } = useStreak();
  const { theme } = useSettingsStore((state) => state.settings);
  const setTheme = useSettingsStore((state) => state.setTheme);

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-surface-border-dark bg-bg-dark/90 px-4 backdrop-blur-md md:px-6">
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="rounded-lg p-2 text-text-muted-dark hover:bg-surface-dark md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-streak/15 text-streak border border-streak/30">
            <Flame className="w-5 h-5 fill-streak" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold tracking-tight text-text-primary-dark">
              DAILY <span className="text-streak">TRACKER</span>
            </h1>
            <p className="text-[10px] font-mono text-text-muted-dark uppercase tracking-widest">
              ACCOUNTABILITY SYSTEM
            </p>
          </div>
        </div>
      </div>

      {/* Streak Badge & Theme Controls */}
      <div className="flex items-center gap-3">
        {/* Streak Flame Pill */}
        <div className="flex items-center gap-1.5 rounded-full border border-streak/30 bg-streak/10 px-3 py-1 font-mono text-xs font-semibold text-streak shadow-sm">
          <Flame className="w-4 h-4 fill-streak animate-pulse" />
          <span>{currentStreak} DAY STREAK</span>
        </div>

        {/* View on GitHub Link */}
        <a
          href="https://github.com/ganeshpoojary727/Daily-tracker"
          target="_blank"
          rel="noopener noreferrer"
          title="View source on GitHub"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border-dark bg-surface-dark text-text-muted-dark hover:text-text-primary-dark hover:bg-surface-hover-dark transition-colors"
        >
          <Github className="w-4 h-4" />
        </a>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Theme: ${theme}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border-dark bg-surface-dark text-text-muted-dark hover:text-text-primary-dark hover:bg-surface-hover-dark transition-colors"
        >
          {theme === 'dark' && <Moon className="w-4 h-4 text-amber-400" />}
          {theme === 'light' && <Sun className="w-4 h-4 text-orange-400" />}
          {theme === 'system' && <Monitor className="w-4 h-4 text-blue-400" />}
        </button>
      </div>
    </header>
  );
};
