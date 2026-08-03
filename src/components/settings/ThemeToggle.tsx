import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export const ThemeToggle: React.FC = () => {
  const theme = useSettingsStore((state) => state.settings.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);

  const options: { id: 'light' | 'dark' | 'system'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dark', label: 'Ink Dark', icon: Moon },
    { id: 'light', label: 'Warm Light', icon: Sun },
    { id: 'system', label: 'System Theme', icon: Monitor },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            className={`flex flex-col items-center gap-2 rounded-xl border p-3 font-display text-xs font-semibold transition-all ${
              isActive
                ? 'border-streak bg-streak/15 text-streak shadow-sm'
                : 'border-surface-border-dark bg-surface-hover-dark/40 text-text-muted-dark hover:text-text-primary-dark'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
