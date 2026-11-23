import { create } from "zustand";

export type AppTheme = "light" | "dark" | "system";
export type ViewMode = "reading" | "source" | "split";

export interface UIState {
  theme: AppTheme;
  isSidebarOpen: boolean;
  viewMode: ViewMode;
  isMaximized: boolean;
  isSearchOpen: boolean;

  setTheme: (theme: AppTheme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setIsMaximized: (max: boolean) => void;
  toggleSearch: () => void;
  initTheme: () => void;
}

const THEME_STORAGE_KEY = "mdseeker-theme";

function applyThemeToDOM(theme: AppTheme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.setAttribute("data-theme", theme);

  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // System
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

export const useUIStore = create<UIState>((set) => ({
  theme: "system",
  isSidebarOpen: false,
  viewMode: "reading",
  isMaximized: false,
  isSearchOpen: false,

  setTheme: (theme: AppTheme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage may fail in restricted environments
    }
    applyThemeToDOM(theme);
    set({ theme });
  },

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

  setIsMaximized: (max: boolean) => set({ isMaximized: max }),

  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  initTheme: () => {
    let savedTheme: AppTheme = "system";
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        savedTheme = stored;
      }
    } catch {
      // Fallback to system
    }

    applyThemeToDOM(savedTheme);
    set({ theme: savedTheme });

    // Listen to system theme changes when set to "system"
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        const currentTheme = useUIStore.getState().theme;
        if (currentTheme === "system") {
          applyThemeToDOM("system");
        }
      };
      mediaQuery.addEventListener("change", handler);
    }
  },
}));
