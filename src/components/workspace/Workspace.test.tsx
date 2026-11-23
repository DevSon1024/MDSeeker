import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { Workspace } from "./Workspace";
import { useDocumentStore } from "@/stores/documentStore";
import { useUIStore } from "@/stores/uiStore";
import { LoadedDocument } from "@/types/document";
import { MarkdownDocument } from "@/types/markdown";

describe("Workspace Component", () => {
  const sampleDoc: LoadedDocument = {
    canonicalPath: "C:/docs/sample.md",
    fileName: "sample.md",
    fileExtension: "md",
    fileSizeBytes: 2048,
    lastModifiedTimestamp: 1700000000000,
    rawContent: "# Sample Document\n\nHello world content.",
  };

  const sampleParsed: MarkdownDocument = {
    blocks: [
      {
        type: "heading",
        level: 1,
        id: null,
        content: [{ type: "text", value: "Sample Document" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", value: "Hello world content." }],
      },
    ],
    metadata: {
      title: "Sample Document",
      wordCount: 5,
      characterCount: 30,
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
    useDocumentStore.setState({
      document: null,
      parsedDocument: null,
      isLoading: false,
      isParsing: false,
      error: null,
      parseError: null,
      isDraggingOver: false,
    });
    useUIStore.setState({
      viewMode: "reading",
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders EmptyWorkspace welcome screen when no document is open", () => {
    render(<Workspace />);
    expect(screen.getByText("Open Markdown File")).toBeDefined();
    expect(screen.getByText("or drag and drop files anywhere")).toBeDefined();
  });

  it("renders loading indicator when reading file", () => {
    useDocumentStore.setState({ isLoading: true });
    render(<Workspace />);
    expect(screen.getByText("Reading Markdown document...")).toBeDefined();
  });

  it("renders parsing indicator when document is loaded but parsing is in progress", () => {
    useDocumentStore.setState({
      document: sampleDoc,
      isParsing: true,
      parsedDocument: null,
    });
    render(<Workspace />);
    expect(screen.getByText("Parsing Markdown AST...")).toBeDefined();
  });

  it("renders MarkdownReader when document and parsed AST are loaded in reading mode", () => {
    useDocumentStore.setState({
      document: sampleDoc,
      parsedDocument: sampleParsed,
      isLoading: false,
      isParsing: false,
    });

    render(<Workspace />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Sample Document");
    expect(screen.getByText("Hello world content.")).toBeDefined();
  });

  it("renders source mode placeholder when viewMode is source and supports switching back", () => {
    useDocumentStore.setState({
      document: sampleDoc,
      parsedDocument: sampleParsed,
    });
    useUIStore.setState({ viewMode: "source" });

    render(<Workspace />);

    expect(screen.getByText("Source Inspection Mode")).toBeDefined();
    const switchBtn = screen.getByRole("button", { name: "Switch to Reading Mode" });
    fireEvent.click(switchBtn);

    expect(useUIStore.getState().viewMode).toBe("reading");
  });

  it("renders split mode placeholder when viewMode is split", () => {
    useDocumentStore.setState({
      document: sampleDoc,
      parsedDocument: sampleParsed,
    });
    useUIStore.setState({ viewMode: "split" });

    render(<Workspace />);

    expect(screen.getByText("Synchronized Split Mode")).toBeDefined();
  });

  it("renders parse error banner and falls back to raw content pre block", () => {
    useDocumentStore.setState({
      document: sampleDoc,
      parsedDocument: null,
      parseError: {
        code: "PARSE_ERR",
        message: "AST generation failed",
      },
    });

    render(<Workspace />);

    expect(screen.getByText("AST generation failed")).toBeDefined();
    expect(screen.getByText(/Could not parse formatted AST/)).toBeDefined();
    expect(screen.getByText(/# Sample Document/)).toBeDefined();
  });
});
