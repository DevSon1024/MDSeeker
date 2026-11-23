import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "./appStore";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.setState({
      appInfo: null,
      theme: "system",
      viewMode: "reading",
      tabs: [],
      activeTabId: null,
    });
  });

  it("initializes with default state", () => {
    const state = useAppStore.getState();
    expect(state.appInfo).toBeNull();
    expect(state.theme).toBe("system");
    expect(state.viewMode).toBe("reading");
    expect(state.tabs).toEqual([]);
    expect(state.activeTabId).toBeNull();
  });

  it("updates app info correctly", () => {
    useAppStore.getState().setAppInfo({
      name: "MDSeeker",
      version: "0.1.0",
      identifier: "com.devson.mdseeker",
      platform: "windows",
    });

    const state = useAppStore.getState();
    expect(state.appInfo?.name).toBe("MDSeeker");
    expect(state.appInfo?.identifier).toBe("com.devson.mdseeker");
  });

  it("switches view mode", () => {
    useAppStore.getState().setViewMode("split");
    expect(useAppStore.getState().viewMode).toBe("split");

    useAppStore.getState().setViewMode("source");
    expect(useAppStore.getState().viewMode).toBe("source");
  });

  it("adds and switches tabs, ignoring duplicate paths", () => {
    const tab1 = {
      id: "tab-1",
      filePath: "C:/docs/readme.md",
      fileName: "readme.md",
      isModified: false,
      content: "# Hello",
    };

    const tab2 = {
      id: "tab-2",
      filePath: "C:/docs/guide.md",
      fileName: "guide.md",
      isModified: false,
      content: "# Guide",
    };

    useAppStore.getState().addTab(tab1);
    expect(useAppStore.getState().tabs).toHaveLength(1);
    expect(useAppStore.getState().activeTabId).toBe("tab-1");

    useAppStore.getState().addTab(tab2);
    expect(useAppStore.getState().tabs).toHaveLength(2);
    expect(useAppStore.getState().activeTabId).toBe("tab-2");

    // Add duplicate filePath
    useAppStore.getState().addTab({
      id: "tab-3",
      filePath: "C:/docs/readme.md",
      fileName: "readme.md",
      isModified: false,
      content: "# Different content",
    });
    // Should not add duplicate tab, but should activate existing tab
    expect(useAppStore.getState().tabs).toHaveLength(2);
    expect(useAppStore.getState().activeTabId).toBe("tab-1");
  });

  it("closes tab and updates activeTabId properly", () => {
    const tab1 = {
      id: "tab-1",
      filePath: "C:/docs/1.md",
      fileName: "1.md",
      isModified: false,
      content: "1",
    };
    const tab2 = {
      id: "tab-2",
      filePath: "C:/docs/2.md",
      fileName: "2.md",
      isModified: false,
      content: "2",
    };

    useAppStore.getState().addTab(tab1);
    useAppStore.getState().addTab(tab2);

    expect(useAppStore.getState().activeTabId).toBe("tab-2");

    // Close active tab
    useAppStore.getState().closeTab("tab-2");
    expect(useAppStore.getState().tabs).toHaveLength(1);
    expect(useAppStore.getState().activeTabId).toBe("tab-1");

    // Close remaining tab
    useAppStore.getState().closeTab("tab-1");
    expect(useAppStore.getState().tabs).toHaveLength(0);
    expect(useAppStore.getState().activeTabId).toBeNull();
  });
});
