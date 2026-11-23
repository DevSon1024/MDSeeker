import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { SplitWorkspace } from "./SplitWorkspace";
import { LoadedDocument } from "@/types/document";
import { MarkdownDocument } from "@/types/markdown";

describe("SplitWorkspace Component", () => {
  const sampleDoc: LoadedDocument = {
    canonicalPath: "C:/docs/sample.md",
    fileName: "sample.md",
    fileExtension: "md",
    fileSizeBytes: 1024,
    lastModifiedTimestamp: 1700000000000,
    rawContent: "# Split View Test\n\nTesting dual-pane layout.",
  };

  const sampleParsed: MarkdownDocument = {
    blocks: [
      {
        type: "heading",
        level: 1,
        id: null,
        content: [{ type: "text", value: "Split View Test" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", value: "Testing dual-pane layout." }],
      },
    ],
    metadata: {
      title: "Split View Test",
      wordCount: 5,
      characterCount: 35,
      readingTimeMinutes: 0.1,
      frontmatter: null,
      hasTables: false,
      hasCodeBlocks: false,
      hasMath: false,
      hasMermaid: false,
      hasTaskLists: false,
      headingsCount: 1,
    },
    parserVersion: "pulldown-cmark-0.13",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders both reading pane and source inspection pane side by side", () => {
    render(
      <SplitWorkspace
        document={sampleDoc}
        parsedDocument={sampleParsed}
      />
    );

    expect(screen.getByRole("region", { name: "Split reading pane" })).toBeDefined();
    expect(screen.getByRole("region", { name: "Markdown source inspection viewer" })).toBeDefined();
    expect(screen.getByRole("separator", { name: "Resize split panels" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Split View Test");
  });

  it("renders fallback message when parsedDocument is null", () => {
    render(
      <SplitWorkspace
        document={sampleDoc}
        parsedDocument={null}
      />
    );

    expect(screen.getByText(/Could not parse formatted AST/)).toBeDefined();
    expect(screen.getByRole("region", { name: "Markdown source inspection viewer" })).toBeDefined();
  });

  it("adjusts split ratio via keyboard arrow keys on separator", () => {
    render(
      <SplitWorkspace
        document={sampleDoc}
        parsedDocument={sampleParsed}
      />
    );

    const separator = screen.getByRole("separator", { name: "Resize split panels" });
    fireEvent.keyDown(separator, { key: "ArrowLeft" });
    // Left pane width style should now be 45% (0.5 - 0.05)
    const readingPane = screen.getByRole("region", { name: "Split reading pane" }).parentElement;
    expect(readingPane?.style.width).toBe("45%");

    fireEvent.keyDown(separator, { key: "ArrowRight" });
    expect(readingPane?.style.width).toBe("50%");
  });

  it("supports scroll sync toggle in source toolbar", () => {
    render(
      <SplitWorkspace
        document={sampleDoc}
        parsedDocument={sampleParsed}
      />
    );

    const syncBtn = screen.getByRole("button", { name: /Disable scroll sync/i });
    expect(syncBtn).toBeDefined();

    fireEvent.click(syncBtn);
    expect(screen.getByRole("button", { name: /Enable scroll sync/i })).toBeDefined();
  });
});
