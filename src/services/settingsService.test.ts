import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_SETTINGS,
  validateAndMergeSettings,
  loadPersistedSettings,
  persistSettings,
  loadSavedSession,
  persistSession,
  SETTINGS_STORAGE_KEY,
  SESSION_STORAGE_KEY,
} from "./settingsService";

describe("settingsService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("validateAndMergeSettings", () => {
    it("returns DEFAULT_SETTINGS when passed null or undefined", () => {
      expect(validateAndMergeSettings(null)).toEqual(DEFAULT_SETTINGS);
      expect(validateAndMergeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
      expect(validateAndMergeSettings("not-an-object")).toEqual(DEFAULT_SETTINGS);
    });

    it("preserves valid custom values and supplies defaults for missing ones", () => {
      const partial = {
        appearance: {
          theme: "dark",
          accentColor: "#107c41",
          compactMode: true,
        },
        reader: {
          fontSize: 20,
        },
      };

      const result = validateAndMergeSettings(partial);
      expect(result.appearance.theme).toBe("dark");
      expect(result.appearance.accentColor).toBe("#107c41");
      expect(result.appearance.compactMode).toBe(true);
      expect(result.reader.fontSize).toBe(20);
      expect(result.reader.fontFamily).toBe(DEFAULT_SETTINGS.reader.fontFamily);
      expect(result.source.tabSize).toBe(DEFAULT_SETTINGS.source.tabSize);
    });

    it("falls back to defaults for invalid enum values or out-of-range numbers", () => {
      const invalid = {
        appearance: {
          theme: "rainbow",
          accentColor: "blue", // not hex
        },
        reader: {
          fontSize: 100, // too large (max 36)
          contentWidth: "extra-wide", // invalid enum
        },
        source: {
          tabSize: 8, // invalid enum (only 2 or 4)
        },
      };

      const result = validateAndMergeSettings(invalid);
      expect(result.appearance.theme).toBe(DEFAULT_SETTINGS.appearance.theme);
      expect(result.appearance.accentColor).toBe(DEFAULT_SETTINGS.appearance.accentColor);
      expect(result.reader.fontSize).toBe(DEFAULT_SETTINGS.reader.fontSize);
      expect(result.reader.contentWidth).toBe(DEFAULT_SETTINGS.reader.contentWidth);
      expect(result.source.tabSize).toBe(DEFAULT_SETTINGS.source.tabSize);
    });
  });

  describe("loadPersistedSettings and persistSettings", () => {
    it("returns defaults when localStorage is empty", () => {
      expect(loadPersistedSettings()).toEqual(DEFAULT_SETTINGS);
    });

    it("persists settings immediately and loads them back accurately", () => {
      const custom = {
        ...DEFAULT_SETTINGS,
        appearance: { ...DEFAULT_SETTINGS.appearance, theme: "light" as const },
      };

      persistSettings(custom, true);
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      expect(stored).toBeTruthy();

      const loaded = loadPersistedSettings();
      expect(loaded.appearance.theme).toBe("light");
    });

    it("recovers gracefully from corrupted JSON in localStorage", () => {
      localStorage.setItem(SETTINGS_STORAGE_KEY, "{corrupt-json");
      expect(loadPersistedSettings()).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe("loadSavedSession and persistSession", () => {
    it("returns null when no session is stored", () => {
      expect(loadSavedSession()).toBeNull();
    });

    it("persists and restores a valid session", () => {
      const session = {
        version: 1,
        openPaths: ["D:/docs/readme.md", "D:/docs/guide.md"],
        activePath: "D:/docs/readme.md",
        viewMode: "split" as const,
        timestamp: 123456789,
      };

      persistSession(session);
      const restored = loadSavedSession();
      expect(restored).toEqual(session);
    });

    it("removes session when null is passed to persistSession", () => {
      persistSession({
        version: 1,
        openPaths: ["a.md"],
        activePath: "a.md",
        viewMode: "reading",
        timestamp: Date.now(),
      });
      expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeTruthy();

      persistSession(null);
      expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
      expect(loadSavedSession()).toBeNull();
    });
  });
});
