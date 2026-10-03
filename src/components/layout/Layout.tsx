import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ViewTab } from '../../types';

interface LayoutProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, onSelectTab, children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('dt_sidebar_collapsed') === 'true';
  });
  const [isJavaPlaygroundOpen, setIsJavaPlaygroundOpen] = useState(() => {
    return localStorage.getItem('dt_java_panel_open') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('dt_sidebar_collapsed', String(next));
      return next;
    });
  };

  const toggleJavaPlayground = () => {
    setIsJavaPlaygroundOpen((prev) => {
      const next = !prev;
      localStorage.setItem('dt_java_panel_open', String(next));
      return next;
    });
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + \ or Cmd + \ toggles Java Playground
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        toggleJavaPlayground();
      }
      // Ctrl + B or Cmd + B toggles Sidebar collapse
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-dark text-text-primary-dark">
      {/* Header */}
      <Header
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        onOpenSettings={() => onSelectTab('settings')}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleCollapseSidebar={toggleSidebarCollapse}
        isJavaPlaygroundOpen={isJavaPlaygroundOpen}
        onToggleJavaPlayground={toggleJavaPlayground}
      />

      {/* Main Content Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        {/* View Surface */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 transition-all duration-300">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
