export type ViewMode = "reading" | "source" | "split";
export type AppTheme = "light" | "dark" | "system";

export interface AppInfo {
  name: string;
  version: string;
  identifier: string;
  platform: string;
}

export interface DocumentTab {
  id: string;
  filePath: string;
  fileName: string;
  isModified: boolean;
  content: string;
}

export interface AppState {
  appInfo: AppInfo | null;
  theme: AppTheme;
  viewMode: ViewMode;
  tabs: DocumentTab[];
  activeTabId: string | null;
  setAppInfo: (info: AppInfo) => void;
  setTheme: (theme: AppTheme) => void;
  setViewMode: (mode: ViewMode) => void;
  addTab: (tab: DocumentTab) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
}
