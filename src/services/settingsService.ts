import { AppSettings, SavedSession } from "@/types/settings";

export const SETTINGS_STORAGE_KEY = "mdseeker-settings";
export const SESSION_STORAGE_KEY = "mdseeker-saved-session";

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  appearance: {
    theme: "system",
    accentColor: "#0067c0",
    compactMode: false,
  },
  reader: {
    fontFamily: "Segoe UI Variable Text, Segoe UI, sans-serif",
    fontSize: 16,
    lineHeight: 1.6,
    paragraphSpacing: 1.0,
    contentWidth: "medium",
    showHeadingAnchors: true,
    smoothScrolling: true,
  },
  source: {
    fontFamily: "Cascadia Code, Consolas, monospace",
    fontSize: 13,
    lineHeight: 1.5,
    tabSize: 2,
    wordWrap: true,
    showLineNumbers: true,
    highlightActiveLine: true,
  },
  codeBlocks: {
    theme: "auto",
    showLineNumbers: true,
    wrapLongLines: false,
    showCopyButton: true,
  },
  behavior: {
    defaultView: "reading",
    restoreLastSession: false,
    confirmCloseWithMultipleTabs: false,
    rememberSidebarState: true,
  },
  privacy: {
    rememberRecentFiles: true,
    recentFilesLimit: 10,
  },
};

/**
 * Validates and merges an unverified settings object with default values.
 * Handles schema versioning and corrupt/missing fields gracefully.
 */
export function validateAndMergeSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_SETTINGS };
  }

  const obj = raw as Record<string, any>;

  return {
    version: typeof obj.version === "number" ? obj.version : DEFAULT_SETTINGS.version,
    appearance: {
      theme: ["light", "dark", "system"].includes(obj.appearance?.theme)
        ? obj.appearance.theme
        : DEFAULT_SETTINGS.appearance.theme,
      accentColor:
        typeof obj.appearance?.accentColor === "string" && obj.appearance.accentColor.startsWith("#")
          ? obj.appearance.accentColor
          : DEFAULT_SETTINGS.appearance.accentColor,
      compactMode:
        typeof obj.appearance?.compactMode === "boolean"
          ? obj.appearance.compactMode
          : DEFAULT_SETTINGS.appearance.compactMode,
    },
    reader: {
      fontFamily:
        typeof obj.reader?.fontFamily === "string" && obj.reader.fontFamily.trim().length > 0
          ? obj.reader.fontFamily
          : DEFAULT_SETTINGS.reader.fontFamily,
      fontSize:
        typeof obj.reader?.fontSize === "number" && obj.reader.fontSize >= 10 && obj.reader.fontSize <= 36
          ? obj.reader.fontSize
          : DEFAULT_SETTINGS.reader.fontSize,
      lineHeight:
        typeof obj.reader?.lineHeight === "number" && obj.reader.lineHeight >= 1.0 && obj.reader.lineHeight <= 3.0
          ? obj.reader.lineHeight
          : DEFAULT_SETTINGS.reader.lineHeight,
      paragraphSpacing:
        typeof obj.reader?.paragraphSpacing === "number" &&
        obj.reader.paragraphSpacing >= 0.2 &&
        obj.reader.paragraphSpacing <= 3.0
          ? obj.reader.paragraphSpacing
          : DEFAULT_SETTINGS.reader.paragraphSpacing,
      contentWidth: ["narrow", "medium", "wide", "full"].includes(obj.reader?.contentWidth)
        ? obj.reader.contentWidth
        : DEFAULT_SETTINGS.reader.contentWidth,
      showHeadingAnchors:
        typeof obj.reader?.showHeadingAnchors === "boolean"
          ? obj.reader.showHeadingAnchors
          : DEFAULT_SETTINGS.reader.showHeadingAnchors,
      smoothScrolling:
        typeof obj.reader?.smoothScrolling === "boolean"
          ? obj.reader.smoothScrolling
          : DEFAULT_SETTINGS.reader.smoothScrolling,
    },
    source: {
      fontFamily:
        typeof obj.source?.fontFamily === "string" && obj.source.fontFamily.trim().length > 0
          ? obj.source.fontFamily
          : DEFAULT_SETTINGS.source.fontFamily,
      fontSize:
        typeof obj.source?.fontSize === "number" && obj.source.fontSize >= 10 && obj.source.fontSize <= 32
          ? obj.source.fontSize
          : DEFAULT_SETTINGS.source.fontSize,
      lineHeight:
        typeof obj.source?.lineHeight === "number" && obj.source.lineHeight >= 1.0 && obj.source.lineHeight <= 2.5
          ? obj.source.lineHeight
          : DEFAULT_SETTINGS.source.lineHeight,
      tabSize: [2, 4].includes(obj.source?.tabSize) ? obj.source.tabSize : DEFAULT_SETTINGS.source.tabSize,
      wordWrap:
        typeof obj.source?.wordWrap === "boolean" ? obj.source.wordWrap : DEFAULT_SETTINGS.source.wordWrap,
      showLineNumbers:
        typeof obj.source?.showLineNumbers === "boolean"
          ? obj.source.showLineNumbers
          : DEFAULT_SETTINGS.source.showLineNumbers,
      highlightActiveLine:
        typeof obj.source?.highlightActiveLine === "boolean"
          ? obj.source.highlightActiveLine
          : DEFAULT_SETTINGS.source.highlightActiveLine,
    },
    codeBlocks: {
      theme: ["auto", "light", "dark"].includes(obj.codeBlocks?.theme)
        ? obj.codeBlocks.theme
        : DEFAULT_SETTINGS.codeBlocks.theme,
      showLineNumbers:
        typeof obj.codeBlocks?.showLineNumbers === "boolean"
          ? obj.codeBlocks.showLineNumbers
          : DEFAULT_SETTINGS.codeBlocks.showLineNumbers,
      wrapLongLines:
        typeof obj.codeBlocks?.wrapLongLines === "boolean"
          ? obj.codeBlocks.wrapLongLines
          : DEFAULT_SETTINGS.codeBlocks.wrapLongLines,
      showCopyButton:
        typeof obj.codeBlocks?.showCopyButton === "boolean"
          ? obj.codeBlocks.showCopyButton
          : DEFAULT_SETTINGS.codeBlocks.showCopyButton,
    },
    behavior: {
      defaultView: ["reading", "source", "split"].includes(obj.behavior?.defaultView)
        ? obj.behavior.defaultView
        : DEFAULT_SETTINGS.behavior.defaultView,
      restoreLastSession:
        typeof obj.behavior?.restoreLastSession === "boolean"
          ? obj.behavior.restoreLastSession
          : DEFAULT_SETTINGS.behavior.restoreLastSession,
      confirmCloseWithMultipleTabs:
        typeof obj.behavior?.confirmCloseWithMultipleTabs === "boolean"
          ? obj.behavior.confirmCloseWithMultipleTabs
          : DEFAULT_SETTINGS.behavior.confirmCloseWithMultipleTabs,
      rememberSidebarState:
        typeof obj.behavior?.rememberSidebarState === "boolean"
          ? obj.behavior.rememberSidebarState
          : DEFAULT_SETTINGS.behavior.rememberSidebarState,
    },
    privacy: {
      rememberRecentFiles:
        typeof obj.privacy?.rememberRecentFiles === "boolean"
          ? obj.privacy.rememberRecentFiles
          : DEFAULT_SETTINGS.privacy.rememberRecentFiles,
      recentFilesLimit:
        typeof obj.privacy?.recentFilesLimit === "number" && [5, 10, 20].includes(obj.privacy.recentFilesLimit)
          ? obj.privacy.recentFilesLimit
          : DEFAULT_SETTINGS.privacy.recentFilesLimit,
    },
  };
}

/**
 * Loads persisted settings from local storage with automatic fallback to defaults.
 */
export function loadPersistedSettings(): AppSettings {
  if (typeof localStorage === "undefined") {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    return validateAndMergeSettings(parsed);
  } catch (err) {
    console.warn("Failed to load persisted settings, falling back to defaults:", err);
    return { ...DEFAULT_SETTINGS };
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced persistence of settings to local storage.
 */
export function persistSettings(settings: AppSettings, immediate = false): void {
  if (typeof localStorage === "undefined") return;

  const save = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn("Failed to persist settings:", err);
    }
  };

  if (immediate) {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    save();
  } else {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(save, 100);
  }
}

/**
 * Loads a saved session from local storage.
 */
export function loadSavedSession(): SavedSession | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.openPaths)) {
      return parsed as SavedSession;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persists current session to local storage.
 */
export function persistSession(session: SavedSession | null): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (err) {
    console.warn("Failed to persist session:", err);
  }
}
