import { create } from "zustand";
import {
  AppSettings,
  AppearanceSettings,
  ReaderSettings,
  SourceSettings,
  CodeBlockSettings,
  BehaviorSettings,
  PrivacySettings,
} from "@/types/settings";
import {
  DEFAULT_SETTINGS,
  loadPersistedSettings,
  persistSettings,
} from "@/services/settingsService";
import { useUIStore } from "./uiStore";

export type SettingsCategory =
  | "general"
  | "appearance"
  | "reader"
  | "source"
  | "codeBlocks"
  | "privacy"
  | "about";

export interface SettingsState {
  settings: AppSettings;
  isSettingsOpen: boolean;
  activeCategory: SettingsCategory;

  openSettings: (category?: SettingsCategory) => void;
  closeSettings: () => void;
  setActiveCategory: (category: SettingsCategory) => void;

  updateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  updateAppearance: (partial: Partial<AppearanceSettings>) => void;
  updateReader: (partial: Partial<ReaderSettings>) => void;
  updateSource: (partial: Partial<SourceSettings>) => void;
  updateCodeBlocks: (partial: Partial<CodeBlockSettings>) => void;
  updateBehavior: (partial: Partial<BehaviorSettings>) => void;
  updatePrivacy: (partial: Partial<PrivacySettings>) => void;

  resetCategory: (category: keyof Omit<AppSettings, "version">) => void;
  resetAllSettings: () => void;

  initSettings: () => void;
}

/**
 * Applies visual appearance settings (accent color, compact mode) directly to the DOM.
 */
export function applyAppearanceToDOM(appearance: AppearanceSettings) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // Apply accent color & derived subtle tint
  const accent = appearance.accentColor || DEFAULT_SETTINGS.appearance.accentColor;
  root.style.setProperty("--fluent-accent", accent);
  root.style.setProperty("--fluent-focus-border", accent);

  // Hex to rgba subtle tint
  if (accent.startsWith("#") && accent.length === 7) {
    const r = parseInt(accent.slice(1, 3), 16);
    const g = parseInt(accent.slice(3, 5), 16);
    const b = parseInt(accent.slice(5, 7), 16);
    root.style.setProperty("--fluent-accent-subtle", `rgba(${r}, ${g}, ${b}, 0.12)`);
  }

  // Compact mode layout density
  if (appearance.compactMode) {
    root.style.setProperty("--fluent-tabbar-height", "34px");
    root.style.setProperty("--fluent-toolbar-height", "38px");
    root.classList.add("fluent-compact");
  } else {
    root.style.removeProperty("--fluent-tabbar-height");
    root.style.removeProperty("--fluent-toolbar-height");
    root.classList.remove("fluent-compact");
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  isSettingsOpen: false,
  activeCategory: "general",

  openSettings: (category?: SettingsCategory) => {
    set({
      isSettingsOpen: true,
      activeCategory: category || get().activeCategory,
    });
  },

  closeSettings: () => {
    set({ isSettingsOpen: false });
  },

  setActiveCategory: (category: SettingsCategory) => {
    set({ activeCategory: category });
  },

  updateSettings: (updater: (prev: AppSettings) => AppSettings) => {
    const next = updater(get().settings);
    persistSettings(next);
    applyAppearanceToDOM(next.appearance);
    set({ settings: next });
  },

  updateAppearance: (partial: Partial<AppearanceSettings>) => {
    const current = get().settings;
    const nextAppearance = { ...current.appearance, ...partial };
    const next = { ...current, appearance: nextAppearance };

    // Synchronize theme with uiStore
    if (partial.theme && partial.theme !== useUIStore.getState().theme) {
      useUIStore.getState().setTheme(partial.theme);
    }

    applyAppearanceToDOM(nextAppearance);
    persistSettings(next);
    set({ settings: next });
  },

  updateReader: (partial: Partial<ReaderSettings>) => {
    const current = get().settings;
    const next = {
      ...current,
      reader: { ...current.reader, ...partial },
    };
    persistSettings(next);
    set({ settings: next });
  },

  updateSource: (partial: Partial<SourceSettings>) => {
    const current = get().settings;
    const next = {
      ...current,
      source: { ...current.source, ...partial },
    };
    persistSettings(next);
    set({ settings: next });
  },

  updateCodeBlocks: (partial: Partial<CodeBlockSettings>) => {
    const current = get().settings;
    const next = {
      ...current,
      codeBlocks: { ...current.codeBlocks, ...partial },
    };
    persistSettings(next);
    set({ settings: next });
  },

  updateBehavior: (partial: Partial<BehaviorSettings>) => {
    const current = get().settings;
    const next = {
      ...current,
      behavior: { ...current.behavior, ...partial },
    };
    persistSettings(next);
    set({ settings: next });
  },

  updatePrivacy: (partial: Partial<PrivacySettings>) => {
    const current = get().settings;
    const next = {
      ...current,
      privacy: { ...current.privacy, ...partial },
    };
    persistSettings(next);
    set({ settings: next });
  },

  resetCategory: (category: keyof Omit<AppSettings, "version">) => {
    const current = get().settings;
    const defaultCategory = DEFAULT_SETTINGS[category];
    const next = {
      ...current,
      [category]: { ...defaultCategory },
    };

    if (category === "appearance") {
      applyAppearanceToDOM(DEFAULT_SETTINGS.appearance);
      useUIStore.getState().setTheme(DEFAULT_SETTINGS.appearance.theme);
    }

    persistSettings(next, true);
    set({ settings: next });
  },

  resetAllSettings: () => {
    const defaults = { ...DEFAULT_SETTINGS };
    applyAppearanceToDOM(defaults.appearance);
    useUIStore.getState().setTheme(defaults.appearance.theme);
    persistSettings(defaults, true);
    set({ settings: defaults });
  },

  initSettings: () => {
    const loaded = loadPersistedSettings();
    applyAppearanceToDOM(loaded.appearance);

    // Sync theme with uiStore
    if (loaded.appearance.theme) {
      useUIStore.getState().setTheme(loaded.appearance.theme);
    }

    set({ settings: loaded });
  },
}));
