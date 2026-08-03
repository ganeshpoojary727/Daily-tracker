import React from 'react';
import { CheckSquare, Calendar, Target, Code, BarChart3, Settings, X } from 'lucide-react';
import { ViewTab } from '../../types';
import { useGoalStore } from '../../store/useGoalStore';
import { GoalTimerSidebarWidget } from '../goals/GoalTimer';

interface SidebarProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const goals = useGoalStore((state) => state.goals);

  const navItems: { id: ViewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'checklist', label: 'Daily Checklist', icon: CheckSquare },
    { id: 'calendar', label: 'Streak Calendar', icon: Calendar },
    { id: 'goals', label: 'Goals & Timers', icon: Target },
    { id: 'practice', label: 'DSA Queue Runner', icon: Code },
    { id: 'dashboard', label: 'Stats & Charts', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-text-muted-dark mb-2">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-display text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-streak text-white shadow-md shadow-streak/20'
                    : 'text-text-muted-dark hover:bg-surface-dark hover:text-text-primary-dark'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-text-muted-dark'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Live Goal Countdown Widget */}
        <div>
          <GoalTimerSidebarWidget
            goals={goals}
            onOpenGoalsTab={() => {
              onSelectTab('goals');
              onCloseMobile();
            }}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-surface-border-dark pt-3 text-[10px] font-mono text-text-muted-dark text-center">
        <p>Static • Zero Backend</p>
        <p className="text-streak mt-0.5">Local Storage Persisted</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-surface-border-dark bg-bg-dark/50">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-surface-dark shadow-2xl border-r border-surface-border-dark">
            <div className="flex items-center justify-between p-4 border-b border-surface-border-dark">
              <span className="font-display font-bold text-sm text-text-primary-dark">MENU</span>
              <button onClick={onCloseMobile} className="rounded-lg p-1 text-text-muted-dark hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
