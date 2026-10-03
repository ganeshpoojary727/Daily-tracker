import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { JavaPlaygroundPanel } from '../compiler/JavaPlaygroundPanel';
import { useUIStore } from '../../store/useUIStore';
import { ViewTab } from '../../types';

interface LayoutProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, onSelectTab, children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);
  const isJavaPlaygroundOpen = useUIStore((state) => state.isJavaPlaygroundOpen);
  const toggleSidebarCollapsed = useUIStore((state) => state.toggleSidebarCollapsed);
  const toggleJavaPlayground = useUIStore((state) => state.toggleJavaPlayground);
  const setJavaPlaygroundOpen = useUIStore((state) => state.setJavaPlaygroundOpen);

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
        toggleSidebarCollapsed();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleJavaPlayground, toggleSidebarCollapsed]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-dark text-text-primary-dark">
      {/* Header */}
      <Header
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        onOpenSettings={() => onSelectTab('settings')}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleCollapseSidebar={toggleSidebarCollapsed}
        isJavaPlaygroundOpen={isJavaPlaygroundOpen}
        onToggleJavaPlayground={toggleJavaPlayground}
      />

      {/* Main Content Body */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Collapsible Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />

        {/* View Surface - smoothly resizes when Java Playground opens */}
        <main
          className={`flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 transition-all duration-300 ${
            isJavaPlaygroundOpen ? 'lg:mr-[500px] xl:mr-[520px]' : ''
          }`}
        >
          <div className={`mx-auto ${isJavaPlaygroundOpen ? 'w-full max-w-none' : 'max-w-7xl'}`}>{children}</div>
        </main>

        {/* Right-Side Java Compiler & Playground Panel */}
        <JavaPlaygroundPanel
          isOpen={isJavaPlaygroundOpen}
          onClose={() => setJavaPlaygroundOpen(false)}
        />
      </div>
    </div>
  );
};
