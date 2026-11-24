import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "./settingsStore";
import { DEFAULT_SETTINGS } from "@/services/settingsService";

describe("settingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.getState().resetAllSettings();
  });

  it("initializes with default settings", () => {
    const { settings } = useSettingsStore.getState();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("opens and closes settings dialog", () => {
    const store = useSettingsStore.getState();
    expect(store.isSettingsOpen).toBe(false);

    store.openSettings("appearance");
    expect(useSettingsStore.getState().isSettingsOpen).toBe(true);
    expect(useSettingsStore.getState().activeCategory).toBe("appearance");

    store.closeSettings();
    expect(useSettingsStore.getState().isSettingsOpen).toBe(false);
  });

  it("updates appearance and reader settings", () => {
    useSettingsStore.getState().updateAppearance({ compactMode: true, accentColor: "#c42b1c" });
    expect(useSettingsStore.getState().settings.appearance.compactMode).toBe(true);
    expect(useSettingsStore.getState().settings.appearance.accentColor).toBe("#c42b1c");

    useSettingsStore.getState().updateReader({ fontSize: 22, contentWidth: "wide" });
    expect(useSettingsStore.getState().settings.reader.fontSize).toBe(22);
    expect(useSettingsStore.getState().settings.reader.contentWidth).toBe("wide");
  });

  it("updates source and code blocks settings", () => {
    useSettingsStore.getState().updateSource({ tabSize: 4, wordWrap: false });
    expect(useSettingsStore.getState().settings.source.tabSize).toBe(4);
    expect(useSettingsStore.getState().settings.source.wordWrap).toBe(false);

    useSettingsStore.getState().updateCodeBlocks({ showCopyButton: false, theme: "dark" });
    expect(useSettingsStore.getState().settings.codeBlocks.showCopyButton).toBe(false);
    expect(useSettingsStore.getState().settings.codeBlocks.theme).toBe("dark");
  });

  it("resets a single category without disturbing other categories", () => {
    // Modify reader and source
    useSettingsStore.getState().updateReader({ fontSize: 24 });
    useSettingsStore.getState().updateSource({ tabSize: 4 });

    expect(useSettingsStore.getState().settings.reader.fontSize).toBe(24);
    expect(useSettingsStore.getState().settings.source.tabSize).toBe(4);

    // Reset reader only
    useSettingsStore.getState().resetCategory("reader");

    expect(useSettingsStore.getState().settings.reader.fontSize).toBe(DEFAULT_SETTINGS.reader.fontSize);
    expect(useSettingsStore.getState().settings.source.tabSize).toBe(4);
  });

  it("resets all settings to defaults", () => {
    useSettingsStore.getState().updateAppearance({ compactMode: true });
    useSettingsStore.getState().updateReader({ fontSize: 26 });
    useSettingsStore.getState().updateBehavior({ restoreLastSession: true });

    useSettingsStore.getState().resetAllSettings();

    expect(useSettingsStore.getState().settings).toEqual(DEFAULT_SETTINGS);
  });
});
