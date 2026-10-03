import { create } from 'zustand';

interface UIStoreState {
  isSidebarCollapsed: boolean;
  isJavaPlaygroundOpen: boolean;
  prevSidebarCollapsed: boolean;
  isSyllabusFoldedInCompilerMode: boolean;

  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setJavaPlaygroundOpen: (open: boolean) => void;
  toggleJavaPlayground: () => void;
  toggleSyllabusInCompilerMode: () => void;
}

const STORAGE_KEY_SIDEBAR = 'dt_sidebar_collapsed';
const STORAGE_KEY_PLAYGROUND = 'dt_java_panel_open';

export const useUIStore = create<UIStoreState>((set, get) => {
  const initialSidebar = localStorage.getItem(STORAGE_KEY_SIDEBAR) === 'true';
  const initialPlayground = localStorage.getItem(STORAGE_KEY_PLAYGROUND) === 'true';

  return {
    // If playground was already open on reload, default sidebar to collapsed
    isSidebarCollapsed: initialPlayground ? true : initialSidebar,
    isJavaPlaygroundOpen: initialPlayground,
    prevSidebarCollapsed: initialSidebar,
    isSyllabusFoldedInCompilerMode: true, // Auto-folded by default when compiler is open

    setSidebarCollapsed: (collapsed: boolean) => {
      localStorage.setItem(STORAGE_KEY_SIDEBAR, String(collapsed));
      set({ isSidebarCollapsed: collapsed });
    },

    toggleSidebarCollapsed: () => {
      const next = !get().isSidebarCollapsed;
      localStorage.setItem(STORAGE_KEY_SIDEBAR, String(next));
      set({ isSidebarCollapsed: next });
    },

    setJavaPlaygroundOpen: (open: boolean) => {
      const { isSidebarCollapsed, prevSidebarCollapsed } = get();
      localStorage.setItem(STORAGE_KEY_PLAYGROUND, String(open));

      if (open) {
        // Auto-fold sidebar and remember previous state
        localStorage.setItem(STORAGE_KEY_SIDEBAR, 'true');
        set({
          isJavaPlaygroundOpen: true,
          prevSidebarCollapsed: isSidebarCollapsed,
          isSidebarCollapsed: true,
        });
      } else {
        // Restore sidebar state
        localStorage.setItem(STORAGE_KEY_SIDEBAR, String(prevSidebarCollapsed));
        set({
          isJavaPlaygroundOpen: false,
          isSidebarCollapsed: prevSidebarCollapsed,
        });
      }
    },

    toggleJavaPlayground: () => {
      const current = get().isJavaPlaygroundOpen;
      get().setJavaPlaygroundOpen(!current);
    },

    toggleSyllabusInCompilerMode: () => {
      set((state) => ({
        isSyllabusFoldedInCompilerMode: !state.isSyllabusFoldedInCompilerMode,
      }));
    },
  };
});
