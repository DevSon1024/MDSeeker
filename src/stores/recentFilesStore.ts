import { create } from "zustand";
import { RecentFile } from "@/types/settings";
import { useSettingsStore } from "./settingsStore";

export const RECENT_FILES_STORAGE_KEY = "mdseeker-recent-files";

export interface RecentFilesState {
  recentFiles: RecentFile[];
  addRecentFile: (path: string, fileName?: string) => void;
  removeRecentFile: (path: string) => void;
  clearRecentFiles: () => void;
  initRecentFiles: () => void;
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").toLowerCase();
}

function persistRecentFiles(list: RecentFile[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(RECENT_FILES_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Failed to persist recent files to storage:", err);
  }
}

export const useRecentFilesStore = create<RecentFilesState>((set, get) => ({
  recentFiles: [],

  addRecentFile: (filePath: string, fileName?: string) => {
    if (!filePath || filePath.trim().length === 0) return;

    const { privacy } = useSettingsStore.getState().settings;
    if (!privacy.rememberRecentFiles) return;

    const limit = privacy.recentFilesLimit || 10;
    const norm = normalizePath(filePath);

    const actualFileName =
      fileName || filePath.split(/[/\\]/).pop() || filePath;

    const filtered = get().recentFiles.filter(
      (item) => normalizePath(item.path) !== norm
    );

    const updated: RecentFile[] = [
      {
        path: filePath,
        fileName: actualFileName,
        lastOpened: Date.now(),
      },
      ...filtered,
    ].slice(0, limit);

    persistRecentFiles(updated);
    set({ recentFiles: updated });
  },

  removeRecentFile: (filePath: string) => {
    const norm = normalizePath(filePath);
    const updated = get().recentFiles.filter(
      (item) => normalizePath(item.path) !== norm
    );
    persistRecentFiles(updated);
    set({ recentFiles: updated });
  },

  clearRecentFiles: () => {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(RECENT_FILES_STORAGE_KEY);
      } catch (err) {
        console.warn("Failed to clear recent files from storage:", err);
      }
    }
    set({ recentFiles: [] });
  },

  initRecentFiles: () => {
    if (typeof localStorage === "undefined") return;

    const { privacy } = useSettingsStore.getState().settings;
    if (!privacy.rememberRecentFiles) {
      set({ recentFiles: [] });
      return;
    }

    try {
      const raw = localStorage.getItem(RECENT_FILES_STORAGE_KEY);
      if (!raw) {
        set({ recentFiles: [] });
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const valid = parsed
          .filter(
            (item): item is RecentFile =>
              item &&
              typeof item.path === "string" &&
              typeof item.fileName === "string" &&
              typeof item.lastOpened === "number"
          )
          .slice(0, privacy.recentFilesLimit || 10);
        set({ recentFiles: valid });
      }
    } catch (err) {
      console.warn("Failed to read recent files from storage:", err);
      set({ recentFiles: [] });
    }
  },
}));
