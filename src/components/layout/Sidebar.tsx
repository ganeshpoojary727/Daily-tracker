import React from 'react';
import {
  CheckSquare,
  Calendar,
  Target,
  Code,
  BarChart3,
  Settings,
  GraduationCap,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ViewTab } from '../../types';

interface SidebarProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navItems: { id: ViewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'checklist', label: 'Daily Checklist', icon: CheckSquare },
    { id: 'calendar', label: 'Streak Calendar', icon: Calendar },
    { id: 'goals', label: 'Goals & Timers', icon: Target },
    { id: 'practice', label: 'DSA Queue Runner', icon: Code },
    { id: 'courses', label: 'Course Hub', icon: GraduationCap },
    { id: 'dashboard', label: 'Stats & Charts', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const sidebarContent = (isMobileView = false) => {
    const collapsed = !isMobileView && isCollapsed;

    return (
      <div className={`flex h-full flex-col justify-between overflow-y-auto ${collapsed ? 'p-2' : 'p-4'}`}>
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <nav className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-text-muted-dark mb-2">
                Navigation
              </p>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (isMobileView) onCloseMobile();
                  }}
                  title={item.label}
                  className={`group relative flex w-full items-center rounded-lg transition-all ${
                    collapsed
                      ? 'justify-center p-2.5 my-1'
                      : 'gap-3 px-3 py-2.5 font-display text-xs font-semibold'
                  } ${
                    isActive
                      ? 'bg-streak text-white shadow-md shadow-streak/20'
                      : 'text-text-muted-dark hover:bg-surface-dark hover:text-text-primary-dark'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-text-muted-dark'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}

                  {/* Floating tooltip on hover when collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 z-50 hidden rounded-md bg-surface-dark border border-surface-border-dark px-2.5 py-1 text-xs font-medium text-text-primary-dark shadow-xl whitespace-nowrap group-hover:block">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info & Collapse Toggle */}
        <div className="border-t border-surface-border-dark pt-3 text-[10px] font-mono text-text-muted-dark">
          {onToggleCollapse && !isMobileView && (
            <button
              onClick={onToggleCollapse}
              className={`flex w-full items-center rounded-lg py-2 text-text-muted-dark hover:bg-surface-dark hover:text-text-primary-dark transition-colors ${
                collapsed ? 'justify-center' : 'gap-2 px-3'
              }`}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4" />
                  <span>Collapse Menu</span>
                </>
              )}
            </button>
          )}

          {!collapsed && (
            <div className="mt-2 text-center">
              <p>Static • Zero Backend</p>
              <p className="text-streak mt-0.5">Local Storage Persisted</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside
        className={`hidden md:flex shrink-0 flex-col border-r border-surface-border-dark bg-bg-dark/50 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent(false)}
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
            {sidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
