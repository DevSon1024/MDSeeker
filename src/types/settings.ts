import { AppTheme, ViewMode } from "@/stores/uiStore";

export type ContentWidth = "narrow" | "medium" | "wide" | "full";

export interface AppearanceSettings {
  theme: AppTheme;
  accentColor: string;
  compactMode: boolean;
}

export interface ReaderSettings {
  fontFamily: string;
  fontSize: number; // in pixels (12 - 28)
  lineHeight: number; // multiplier (1.2 - 2.4)
  paragraphSpacing: number; // in em (0.5 - 2.5)
  contentWidth: ContentWidth;
  showHeadingAnchors: boolean;
  smoothScrolling: boolean;
}

export interface SourceSettings {
  fontFamily: string;
  fontSize: number; // in pixels (11 - 24)
  lineHeight: number; // multiplier (1.2 - 2.2)
  tabSize: number; // 2 or 4
  wordWrap: boolean;
  showLineNumbers: boolean;
  highlightActiveLine: boolean;
}

export interface CodeBlockSettings {
  theme: string; // "auto" | "light" | "dark"
  showLineNumbers: boolean;
  wrapLongLines: boolean;
  showCopyButton: boolean;
}

export interface BehaviorSettings {
  defaultView: ViewMode;
  restoreLastSession: boolean;
  confirmCloseWithMultipleTabs: boolean;
  rememberSidebarState: boolean;
}

export interface PrivacySettings {
  rememberRecentFiles: boolean;
  recentFilesLimit: number; // 5, 10, 20
}

export interface AppSettings {
  version: number;
  appearance: AppearanceSettings;
  reader: ReaderSettings;
  source: SourceSettings;
  codeBlocks: CodeBlockSettings;
  behavior: BehaviorSettings;
  privacy: PrivacySettings;
}

export interface RecentFile {
  path: string;
  fileName: string;
  lastOpened: number;
}

export interface SavedSession {
  version: number;
  openPaths: string[];
  activePath: string | null;
  viewMode: ViewMode;
  timestamp: number;
}
