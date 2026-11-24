import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  registerDefaultApp,
  isDefaultAppRegistered,
  openDefaultAppsSettings,
  closeApplicationWindow,
} from "./windowService";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useDocumentStore } from "@/stores/documentStore";
import { useSettingsStore } from "@/stores/settingsStore";
import * as settingsService from "@/services/settingsService";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: vi.fn(),
}));

vi.mock("@/services/settingsService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/settingsService")>();
  return {
    ...actual,
    flushPendingSettings: vi.fn(),
  };
});

describe("windowService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("registerDefaultApp", () => {
    it("invokes register_default_app Tauri command", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      await registerDefaultApp();
      expect(invoke).toHaveBeenCalledWith("register_default_app");
    });
  });

  describe("isDefaultAppRegistered", () => {
    it("returns true when registered", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(true);
      const res = await isDefaultAppRegistered();
      expect(res).toBe(true);
      expect(invoke).toHaveBeenCalledWith("is_default_app_registered");
    });

    it("returns false when command fails", async () => {
      vi.mocked(invoke).mockRejectedValueOnce(new Error("Registry access error"));
      const res = await isDefaultAppRegistered();
      expect(res).toBe(false);
    });
  });

  describe("openDefaultAppsSettings", () => {
    it("invokes open_default_apps_settings command", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      await openDefaultAppsSettings();
      expect(invoke).toHaveBeenCalledWith("open_default_apps_settings");
    });
  });

  describe("closeApplicationWindow", () => {
    it("flushes pending settings and destroys window on single tab", async () => {
      useDocumentStore.setState({ documents: [{ id: "1", filePath: "C:/doc.md", fileName: "doc.md" } as any] });
      useSettingsStore.setState({
        settings: {
          ...useSettingsStore.getState().settings,
          behavior: {
            ...useSettingsStore.getState().settings.behavior,
            confirmCloseWithMultipleTabs: true,
          },
        },
      });

      const destroyMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(getCurrentWindow).mockReturnValue({
        destroy: destroyMock,
      } as any);

      await closeApplicationWindow();

      expect(settingsService.flushPendingSettings).toHaveBeenCalled();
      expect(destroyMock).toHaveBeenCalled();
    });

    it("aborts close when user cancels multiple tab confirmation", async () => {
      useDocumentStore.setState({
        documents: [
          { id: "1", filePath: "C:/doc1.md", fileName: "doc1.md" } as any,
          { id: "2", filePath: "C:/doc2.md", fileName: "doc2.md" } as any,
        ],
      });
      useSettingsStore.setState({
        settings: {
          ...useSettingsStore.getState().settings,
          behavior: {
            ...useSettingsStore.getState().settings.behavior,
            confirmCloseWithMultipleTabs: true,
          },
        },
      });

      const originalConfirm = window.confirm;
      const confirmMock = vi.fn().mockReturnValue(false);
      window.confirm = confirmMock;
      const destroyMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(getCurrentWindow).mockReturnValue({
        destroy: destroyMock,
      } as any);

      await closeApplicationWindow();

      expect(confirmMock).toHaveBeenCalled();
      expect(destroyMock).not.toHaveBeenCalled();

      window.confirm = originalConfirm;
    });

    it("falls back to close_window command if destroy fails", async () => {
      useDocumentStore.setState({ documents: [] });
      const destroyMock = vi.fn().mockRejectedValue(new Error("Window destroy blocked"));
      vi.mocked(getCurrentWindow).mockReturnValue({
        destroy: destroyMock,
      } as any);
      vi.mocked(invoke).mockResolvedValue(undefined);

      await closeApplicationWindow();

      expect(invoke).toHaveBeenCalledWith("close_window");
    });
  });
});
