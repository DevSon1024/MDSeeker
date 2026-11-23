import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { MarkdownSourceEditor } from "./MarkdownSourceEditor";
import { useUIStore } from "@/stores/uiStore";

describe("MarkdownSourceEditor Component", () => {
  const sampleContent = "# Hello CodeMirror\n\nLine 3 of markdown text.";

  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.setState({
      theme: "light",
    });

    // Mock clipboard
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders container region and SourceToolbar with file info", () => {
    render(
      <MarkdownSourceEditor
        content={sampleContent}
        fileName="readme.md"
      />
    );

    expect(screen.getByRole("region", { name: "Markdown source inspection viewer" })).toBeDefined();
    expect(screen.getByText("readme.md")).toBeDefined();
    expect(screen.getByText("Markdown")).toBeDefined();
    expect(screen.getByText("READ-ONLY")).toBeDefined();
    expect(screen.getByText("3 lines")).toBeDefined();
    expect(screen.getByText(/chars/)).toBeDefined();
  });

  it("enforces read-only behavior in CodeMirror editor instance", () => {
    const { container } = render(
      <MarkdownSourceEditor
        content={sampleContent}
        fileName="test.md"
      />
    );

    const cmEditor = container.querySelector(".cm-editor");
    expect(cmEditor).not.toBeNull();

    const cmContent = container.querySelector(".cm-content");
    expect(cmContent).not.toBeNull();
    // In Happy-DOM / CodeMirror, contenteditable is false for read-only
    expect(cmContent?.getAttribute("contenteditable")).toBe("false");
  });

  it("copies full source text to clipboard when Copy All is clicked", async () => {
    render(
      <MarkdownSourceEditor
        content={sampleContent}
        fileName="readme.md"
      />
    );

    const copyBtn = screen.getByRole("button", { name: /Copy full source/i });
    expect(copyBtn).toBeDefined();

    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sampleContent);
    await waitFor(() => {
      expect(screen.getByText("Copied")).toBeDefined();
    });
  });

  it("handles empty document content gracefully", () => {
    render(
      <MarkdownSourceEditor
        content=""
        fileName="empty.md"
      />
    );

    expect(screen.getByText("0 lines")).toBeDefined();
    expect(screen.getByText("0 chars")).toBeDefined();
  });

  it("renders sync toggle button when showSyncToggle is true", () => {
    const onToggleSync = vi.fn();
    render(
      <MarkdownSourceEditor
        content={sampleContent}
        fileName="sync.md"
        showSyncToggle={true}
        isSyncEnabled={true}
        onToggleSync={onToggleSync}
      />
    );

    const syncBtn = screen.getByRole("button", { name: /Disable scroll sync/i });
    expect(syncBtn).toBeDefined();

    fireEvent.click(syncBtn);
    expect(onToggleSync).toHaveBeenCalledTimes(1);
  });

  it("triggers search panel on find button click", () => {
    const { container } = render(
      <MarkdownSourceEditor
        content={sampleContent}
        fileName="find.md"
      />
    );

    const findBtn = screen.getByRole("button", { name: "Find in source" });
    expect(findBtn).toBeDefined();

    fireEvent.click(findBtn);
    // CodeMirror search panel inserts .cm-panels
    const searchPanel = container.querySelector(".cm-panels");
    expect(searchPanel).not.toBeNull();
  });
});
