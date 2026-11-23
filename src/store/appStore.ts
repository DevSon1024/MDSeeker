import { create } from "zustand";
import { AppState, AppInfo, AppTheme, ViewMode, DocumentTab } from "@/types";

export const useAppStore = create<AppState>((set) => ({
  appInfo: null,
  theme: "system",
  viewMode: "reading",
  tabs: [],
  activeTabId: null,

  setAppInfo: (info: AppInfo) => set({ appInfo: info }),

  setTheme: (theme: AppTheme) => set({ theme }),

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

  addTab: (tab: DocumentTab) =>
    set((state) => {
      const existing = state.tabs.find((t) => t.filePath === tab.filePath);
      if (existing) {
        return { activeTabId: existing.id };
      }
      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      };
    }),

  closeTab: (id: string) =>
    set((state) => {
      const remainingTabs = state.tabs.filter((t) => t.id !== id);
      let nextActiveId = state.activeTabId;

      if (state.activeTabId === id) {
        nextActiveId = remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].id : null;
      }

      return {
        tabs: remainingTabs,
        activeTabId: nextActiveId,
      };
    }),

  setActiveTab: (id: string) => set({ activeTabId: id }),
}));
