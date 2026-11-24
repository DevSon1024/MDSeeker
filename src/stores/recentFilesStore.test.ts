import { describe, it, expect, beforeEach } from "vitest";
import { useRecentFilesStore, RECENT_FILES_STORAGE_KEY } from "./recentFilesStore";
import { useSettingsStore } from "./settingsStore";

describe("recentFilesStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.getState().resetAllSettings();
    useRecentFilesStore.getState().clearRecentFiles();
  });

  it("adds a recent file when rememberRecentFiles is enabled", () => {
    const store = useRecentFilesStore.getState();
    store.addRecentFile("D:/projects/readme.md", "readme.md");

    const recent = useRecentFilesStore.getState().recentFiles;
    expect(recent.length).toBe(1);
    expect(recent[0].path).toBe("D:/projects/readme.md");
    expect(recent[0].fileName).toBe("readme.md");
    expect(recent[0].lastOpened).toBeGreaterThan(0);
  });

  it("does not add recent files when rememberRecentFiles is false", () => {
    useSettingsStore.getState().updatePrivacy({ rememberRecentFiles: false });

    useRecentFilesStore.getState().addRecentFile("D:/test.md", "test.md");
    expect(useRecentFilesStore.getState().recentFiles.length).toBe(0);
  });

  it("deduplicates files by path and moves the newest to top", () => {
    const store = useRecentFilesStore.getState();
    store.addRecentFile("D:/file1.md", "file1.md");
    store.addRecentFile("D:/file2.md", "file2.md");
    store.addRecentFile("d:/file1.md", "file1.md"); // Re-add case-insensitive duplicate

    const recent = useRecentFilesStore.getState().recentFiles;
    expect(recent.length).toBe(2);
    expect(recent[0].path.toLowerCase()).toBe("d:/file1.md");
    expect(recent[1].path.toLowerCase()).toBe("d:/file2.md");
  });

  it("respects recent files limit", () => {
    useSettingsStore.getState().updatePrivacy({ recentFilesLimit: 5 });

    const store = useRecentFilesStore.getState();
    for (let i = 1; i <= 8; i++) {
      store.addRecentFile(`D:/file${i}.md`, `file${i}.md`);
    }

    const recent = useRecentFilesStore.getState().recentFiles;
    expect(recent.length).toBe(5);
    expect(recent[0].fileName).toBe("file8.md");
  });

  it("removes individual file and clears all files", () => {
    const store = useRecentFilesStore.getState();
    store.addRecentFile("D:/a.md", "a.md");
    store.addRecentFile("D:/b.md", "b.md");

    store.removeRecentFile("D:/a.md");
    expect(useRecentFilesStore.getState().recentFiles.length).toBe(1);
    expect(useRecentFilesStore.getState().recentFiles[0].fileName).toBe("b.md");

    store.clearRecentFiles();
    expect(useRecentFilesStore.getState().recentFiles.length).toBe(0);
    expect(localStorage.getItem(RECENT_FILES_STORAGE_KEY)).toBeNull();
  });
});
