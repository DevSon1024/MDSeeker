import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { initIncomingFileService } from "./incomingFileService";
import * as docService from "./documentService";
import * as tauriEvent from "@tauri-apps/api/event";

vi.mock("./documentService", () => ({
  getPendingFiles: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
}));

describe("incomingFileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("subscribes to incoming-files event and drains pending startup files", async () => {
    const unlistenMock = vi.fn();
    vi.mocked(tauriEvent.listen).mockResolvedValue(unlistenMock);
    vi.mocked(docService.getPendingFiles).mockResolvedValue([
      "C:/docs/startup1.md",
      "C:/docs/startup2.markdown",
    ]);

    const callback = vi.fn();
    const unlisten = await initIncomingFileService(callback);

    expect(tauriEvent.listen).toHaveBeenCalledWith("incoming-files", expect.any(Function));
    expect(docService.getPendingFiles).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith([
      "C:/docs/startup1.md",
      "C:/docs/startup2.markdown",
    ]);

    unlisten();
    expect(unlistenMock).toHaveBeenCalled();
  });

  it("handles live incoming-files event notification with payload", async () => {
    let eventHandler: (event: { payload: string[] }) => Promise<void>;
    vi.mocked(tauriEvent.listen).mockImplementation((_event, handler) => {
      eventHandler = handler as any;
      return Promise.resolve(vi.fn());
    });
    vi.mocked(docService.getPendingFiles).mockResolvedValue([]);

    const callback = vi.fn();
    await initIncomingFileService(callback);

    // Initial startup had no files
    expect(callback).not.toHaveBeenCalled();

    // Now simulate live event from second instance
    await eventHandler!({ payload: ["C:/docs/second_instance.md"] });

    expect(callback).toHaveBeenCalledWith(["C:/docs/second_instance.md"]);
  });

  it("falls back to draining queue when event payload is empty", async () => {
    let eventHandler: (event: { payload: any }) => Promise<void>;
    vi.mocked(tauriEvent.listen).mockImplementation((_event, handler) => {
      eventHandler = handler as any;
      return Promise.resolve(vi.fn());
    });
    // First call (startup) returns empty; second call (event fallback) returns files
    vi.mocked(docService.getPendingFiles)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(["C:/docs/fallback.md"]);

    const callback = vi.fn();
    await initIncomingFileService(callback);

    // Simulate event with empty payload
    await eventHandler!({ payload: [] });

    expect(docService.getPendingFiles).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith(["C:/docs/fallback.md"]);
  });

  it("gracefully handles listener registration failure in non-Tauri environments", async () => {
    vi.mocked(tauriEvent.listen).mockRejectedValue(new Error("Tauri IPC not available"));
    vi.mocked(docService.getPendingFiles).mockResolvedValue(["C:/docs/startup.md"]);

    const callback = vi.fn();
    const unlisten = await initIncomingFileService(callback);

    expect(callback).toHaveBeenCalledWith(["C:/docs/startup.md"]);
    expect(typeof unlisten).toBe("function");
    // Calling unlisten does not throw
    expect(() => unlisten()).not.toThrow();
  });
});
