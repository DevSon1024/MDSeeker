import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "./uiStore";

describe("useUIStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useUIStore.setState({
      theme: "system",
      isSidebarOpen: false,
      viewMode: "reading",
      isMaximized: false,
      isSearchOpen: false,
    });
  });

  it("initializes with default state", () => {
    const state = useUIStore.getState();
    expect(state.theme).toBe("system");
    expect(state.isSidebarOpen).toBe(false);
    expect(state.viewMode).toBe("reading");
    expect(state.isMaximized).toBe(false);
    expect(state.isSearchOpen).toBe(false);
  });

  it("updates and persists theme", () => {
    useUIStore.getState().setTheme("dark");
    expect(useUIStore.getState().theme).toBe("dark");
    expect(localStorage.getItem("mdseeker-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    useUIStore.getState().setTheme("light");
    expect(useUIStore.getState().theme).toBe("light");
    expect(localStorage.getItem("mdseeker-theme")).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("toggles and sets sidebar state", () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarOpen).toBe(true);

    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarOpen).toBe(false);

    useUIStore.getState().setSidebarOpen(true);
    expect(useUIStore.getState().isSidebarOpen).toBe(true);
  });

  it("changes view mode", () => {
    useUIStore.getState().setViewMode("split");
    expect(useUIStore.getState().viewMode).toBe("split");

    useUIStore.getState().setViewMode("source");
    expect(useUIStore.getState().viewMode).toBe("source");

    useUIStore.getState().setViewMode("reading");
    expect(useUIStore.getState().viewMode).toBe("reading");
  });

  it("tracks maximized state and search toggle", () => {
    useUIStore.getState().setIsMaximized(true);
    expect(useUIStore.getState().isMaximized).toBe(true);

    useUIStore.getState().toggleSearch();
    expect(useUIStore.getState().isSearchOpen).toBe(true);
  });

  it("initializes theme from localStorage", () => {
    localStorage.setItem("mdseeker-theme", "dark");
    useUIStore.getState().initTheme();
    expect(useUIStore.getState().theme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
