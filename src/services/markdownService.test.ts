import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseMarkdown } from "./markdownService";
import { invoke } from "@tauri-apps/api/core";
import { MarkdownDocument } from "@/types/markdown";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("markdownService", () => {
  const mockParsedDoc: MarkdownDocument = {
    blocks: [
      {
        type: "heading",
        level: 1,
        id: null,
        content: [{ type: "text", value: "Welcome to MDSeeker" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", value: "This is a test paragraph." }],
      },
    ],
    metadata: {
      title: "Welcome to MDSeeker",
      wordCount: 8,
      characterCount: 45,
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

  it("calls parse_markdown Tauri command with content and options", async () => {
    vi.mocked(invoke).mockResolvedValue(mockParsedDoc);

    const result = await parseMarkdown("# Welcome to MDSeeker\n\nThis is a test paragraph.", {
      tables: true,
      strikethrough: true,
    });

    expect(invoke).toHaveBeenCalledWith("parse_markdown", {
      content: "# Welcome to MDSeeker\n\nThis is a test paragraph.",
      options: {
        tables: true,
        strikethrough: true,
      },
    });
    expect(result).toEqual(mockParsedDoc);
  });

  it("handles structured parse error thrown from backend", async () => {
    const backendError = {
      code: "INVALID_SYNTAX",
      message: "Parsing failed.",
    };
    vi.mocked(invoke).mockRejectedValue(backendError);

    await expect(parseMarkdown("bad text")).rejects.toEqual(backendError);
  });

  it("normalizes unknown string error into structured ParseError", async () => {
    vi.mocked(invoke).mockRejectedValue("Unknown IPC error");

    await expect(parseMarkdown("test")).rejects.toEqual({
      code: "PARSE_FAILED",
      message: "Unknown IPC error",
      details: undefined,
    });
  });
});
