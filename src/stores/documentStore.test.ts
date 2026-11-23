import { describe, it, expect, beforeEach, vi } from "vitest";
import { useDocumentStore } from "./documentStore";
import * as docService from "@/services/documentService";
import * as mdService from "@/services/markdownService";
import { FileErrorResponse, LoadedDocument } from "@/types/document";
import { MarkdownDocument } from "@/types/markdown";

vi.mock("@/services/documentService", () => ({
  openMarkdownFileDialog: vi.fn(),
  readMarkdownFile: vi.fn(),
  validateMarkdownFile: vi.fn(),
  getFileMetadata: vi.fn(),
}));

vi.mock("@/services/markdownService", () => ({
  parseMarkdown: vi.fn(),
}));

describe("useDocumentStore", () => {
  const sampleDoc: LoadedDocument = {
    canonicalPath: "C:/docs/notes.md",
    fileName: "notes.md",
    fileExtension: "md",
    fileSizeBytes: 1024,
    lastModifiedTimestamp: 1700000000000,
    rawContent: "# My Notes\n\nContent here.",
  };

  const sampleParsed: MarkdownDocument = {
    blocks: [
      {
        type: "heading",
        level: 1,
        id: null,
        content: [{ type: "text", value: "My Notes" }],
      },
    ],
    metadata: {
      title: "My Notes",
      wordCount: 4,
      characterCount: 20,
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
      documents: [],
      activeDocumentId: null,
      document: null,
      parsedDocument: null,
      isLoading: false,
      isParsing: false,
      error: null,
      parseError: null,
      isDraggingOver: false,
      currentRequestId: 0,
    });
  });

  it("initializes with default empty state", () => {
    const state = useDocumentStore.getState();
    expect(state.document).toBeNull();
    expect(state.parsedDocument).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.isParsing).toBe(false);
    expect(state.error).toBeNull();
    expect(state.parseError).toBeNull();
    expect(state.isDraggingOver).toBe(false);
  });

  it("loads document and parses it successfully", async () => {
    vi.mocked(docService.readMarkdownFile).mockResolvedValue(sampleDoc);
    vi.mocked(mdService.parseMarkdown).mockResolvedValue(sampleParsed);

    const promise = useDocumentStore.getState().loadDocumentByPath("C:/docs/notes.md");
    expect(useDocumentStore.getState().isLoading).toBe(true);

    await promise;

    const state = useDocumentStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.isParsing).toBe(false);
    expect(state.document).toEqual(sampleDoc);
    expect(state.parsedDocument).toEqual(sampleParsed);
    expect(state.error).toBeNull();
    expect(state.parseError).toBeNull();
  });

  it("captures structured error on load failure", async () => {
    const mockError: FileErrorResponse = {
      code: "UNSUPPORTED_EXTENSION",
      message: "Only Markdown documents are supported.",
      path: "test.pdf",
    };
    vi.mocked(docService.readMarkdownFile).mockRejectedValue(mockError);

    await useDocumentStore.getState().loadDocumentByPath("test.pdf");

    const state = useDocumentStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.document).toBeNull();
    expect(state.parsedDocument).toBeNull();
    expect(state.error).toEqual(mockError);
  });

  it("preserves loaded raw document if parsing fails", async () => {
    vi.mocked(docService.readMarkdownFile).mockResolvedValue(sampleDoc);
    vi.mocked(mdService.parseMarkdown).mockRejectedValue({
      code: "PARSE_ERROR",
      message: "Failed to parse syntax.",
    });

    await useDocumentStore.getState().loadDocumentByPath("C:/docs/notes.md");

    const state = useDocumentStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.isParsing).toBe(false);
    expect(state.document).toEqual(sampleDoc);
    expect(state.parsedDocument).toBeNull();
    expect(state.parseError).toEqual({
      code: "PARSE_ERROR",
      message: "Failed to parse syntax.",
    });
  });

  it("handles file dialog cancellation without error", async () => {
    vi.mocked(docService.openMarkdownFileDialog).mockResolvedValue(null);

    await useDocumentStore.getState().openDocumentDialog();

    const state = useDocumentStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.document).toBeNull();
    expect(state.error).toBeNull();
    expect(docService.readMarkdownFile).not.toHaveBeenCalled();
  });

  it("loads document selected via dialog", async () => {
    vi.mocked(docService.openMarkdownFileDialog).mockResolvedValue("C:/docs/guide.markdown");
    vi.mocked(docService.readMarkdownFile).mockResolvedValue({
      ...sampleDoc,
      fileName: "guide.markdown",
      canonicalPath: "C:/docs/guide.markdown",
    });
    vi.mocked(mdService.parseMarkdown).mockResolvedValue(sampleParsed);

    await useDocumentStore.getState().openDocumentDialog();

    expect(docService.readMarkdownFile).toHaveBeenCalledWith("C:/docs/guide.markdown");
    expect(useDocumentStore.getState().document?.fileName).toBe("guide.markdown");
  });

  it("closes the document cleanly", () => {
    useDocumentStore.setState({
      document: sampleDoc,
      parsedDocument: sampleParsed,
      error: { code: "SOME_ERR", message: "err" },
    });

    useDocumentStore.getState().closeDocument();

    const state = useDocumentStore.getState();
    expect(state.document).toBeNull();
    expect(state.parsedDocument).toBeNull();
    expect(state.error).toBeNull();
    expect(state.parseError).toBeNull();
  });

  it("dismisses error message", () => {
    useDocumentStore.setState({
      error: { code: "ERR", message: "Some error" },
      parseError: { code: "PARSE_ERR", message: "Parse error" },
    });

    useDocumentStore.getState().dismissError();
    expect(useDocumentStore.getState().error).toBeNull();
    expect(useDocumentStore.getState().parseError).toBeNull();
  });

  it("updates dragging over state", () => {
    useDocumentStore.getState().setIsDraggingOver(true);
    expect(useDocumentStore.getState().isDraggingOver).toBe(true);

    useDocumentStore.getState().setIsDraggingOver(false);
    expect(useDocumentStore.getState().isDraggingOver).toBe(false);
  });

  it("prevents slower stale requests from overwriting newer selections", async () => {
    let resolveFirst: (val: LoadedDocument) => void;
    const firstPromise = new Promise<LoadedDocument>((resolve) => {
      resolveFirst = resolve;
    });

    const secondDoc: LoadedDocument = {
      ...sampleDoc,
      fileName: "second.md",
      canonicalPath: "C:/docs/second.md",
    };

    vi.mocked(docService.readMarkdownFile)
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce(secondDoc);
    vi.mocked(mdService.parseMarkdown).mockResolvedValue(sampleParsed);

    // Launch first request
    const p1 = useDocumentStore.getState().loadDocumentByPath("C:/docs/first.md");
    // Launch second request immediately
    const p2 = useDocumentStore.getState().loadDocumentByPath("C:/docs/second.md");

    // Second completes first
    await p2;
    expect(useDocumentStore.getState().document?.fileName).toBe("second.md");

    // Now first completes late
    resolveFirst!(sampleDoc);
    await p1;

    // Must still be second.md!
    expect(useDocumentStore.getState().document?.fileName).toBe("second.md");
  });

  describe("Phase 08: Multi-Document Management", () => {
    const docA: LoadedDocument = {
      canonicalPath: "C:/docs/fileA.md",
      fileName: "fileA.md",
      fileExtension: "md",
      fileSizeBytes: 100,
      lastModifiedTimestamp: 1000,
      rawContent: "# File A",
    };

    const docB: LoadedDocument = {
      canonicalPath: "C:/docs/fileB.md",
      fileName: "fileB.md",
      fileExtension: "md",
      fileSizeBytes: 200,
      lastModifiedTimestamp: 2000,
      rawContent: "# File B",
    };

    const docC: LoadedDocument = {
      canonicalPath: "C:/docs/fileC.md",
      fileName: "fileC.md",
      fileExtension: "md",
      fileSizeBytes: 300,
      lastModifiedTimestamp: 3000,
      rawContent: "# File C",
    };

    it("opens multiple documents and maintains independent tab state", async () => {
      vi.mocked(docService.readMarkdownFile)
        .mockResolvedValueOnce(docA)
        .mockResolvedValueOnce(docB);
      vi.mocked(mdService.parseMarkdown).mockResolvedValue(sampleParsed);

      await useDocumentStore.getState().openDocument("C:/docs/fileA.md");
      await useDocumentStore.getState().openDocument("C:/docs/fileB.md");

      const state = useDocumentStore.getState();
      expect(state.documents.length).toBe(2);
      expect(state.activeDocumentId).toBe("C:/docs/fileB.md");
      expect(state.document?.fileName).toBe("fileB.md");
    });

    it("detects duplicate open path and focuses existing tab without adding duplicate", async () => {
      vi.mocked(docService.readMarkdownFile).mockResolvedValue(docA);
      vi.mocked(mdService.parseMarkdown).mockResolvedValue(sampleParsed);

      await useDocumentStore.getState().openDocument("C:/docs/fileA.md");
      expect(useDocumentStore.getState().documents.length).toBe(1);

      // Re-open with different case and backslashes
      await useDocumentStore.getState().openDocument("c:\\docs\\filea.md");
      expect(useDocumentStore.getState().documents.length).toBe(1);
      expect(useDocumentStore.getState().activeDocumentId).toBe("C:/docs/fileA.md");
    });

    it("activates left neighbor when active tab is closed", async () => {
      vi.mocked(docService.readMarkdownFile)
        .mockResolvedValueOnce(docA)
        .mockResolvedValueOnce(docB)
        .mockResolvedValueOnce(docC);
      vi.mocked(mdService.parseMarkdown).mockResolvedValue(sampleParsed);

      await useDocumentStore.getState().openDocument("C:/docs/fileA.md");
      await useDocumentStore.getState().openDocument("C:/docs/fileB.md");
      await useDocumentStore.getState().openDocument("C:/docs/fileC.md");

      expect(useDocumentStore.getState().documents.length).toBe(3);
      expect(useDocumentStore.getState().activeDocumentId).toBe("C:/docs/fileC.md");

      // Close active fileC (index 2) -> should activate fileB (index 1)
      useDocumentStore.getState().closeDocument("C:/docs/fileC.md");
      expect(useDocumentStore.getState().documents.length).toBe(2);
      expect(useDocumentStore.getState().activeDocumentId).toBe("C:/docs/fileB.md");
      expect(useDocumentStore.getState().document?.fileName).toBe("fileB.md");

      // Close fileA (index 0) while fileB (index 1) is active -> fileB remains active
      useDocumentStore.getState().closeDocument("C:/docs/fileA.md");
      expect(useDocumentStore.getState().documents.length).toBe(1);
      expect(useDocumentStore.getState().activeDocumentId).toBe("C:/docs/fileB.md");

      // Close last remaining tab -> state resets to null
      useDocumentStore.getState().closeDocument("C:/docs/fileB.md");
      expect(useDocumentStore.getState().documents.length).toBe(0);
      expect(useDocumentStore.getState().activeDocumentId).toBeNull();
      expect(useDocumentStore.getState().document).toBeNull();
    });

    it("supports closing other documents", async () => {
      vi.mocked(docService.readMarkdownFile)
        .mockResolvedValueOnce(docA)
        .mockResolvedValueOnce(docB)
        .mockResolvedValueOnce(docC);
      vi.mocked(mdService.parseMarkdown).mockResolvedValue(sampleParsed);

      await useDocumentStore.getState().openDocument("C:/docs/fileA.md");
      await useDocumentStore.getState().openDocument("C:/docs/fileB.md");
      await useDocumentStore.getState().openDocument("C:/docs/fileC.md");

      useDocumentStore.getState().closeOtherDocuments("C:/docs/fileB.md");
      const state = useDocumentStore.getState();
      expect(state.documents.length).toBe(1);
      expect(state.activeDocumentId).toBe("C:/docs/fileB.md");
      expect(state.documents[0].fileName).toBe("fileB.md");
    });

    it("supports closing tabs to the right", async () => {
      vi.mocked(docService.readMarkdownFile)
        .mockResolvedValueOnce(docA)
        .mockResolvedValueOnce(docB)
        .mockResolvedValueOnce(docC);
      vi.mocked(mdService.parseMarkdown).mockResolvedValue(sampleParsed);

      await useDocumentStore.getState().openDocument("C:/docs/fileA.md");
      await useDocumentStore.getState().openDocument("C:/docs/fileB.md");
      await useDocumentStore.getState().openDocument("C:/docs/fileC.md");

      useDocumentStore.getState().closeTabsToTheRight("C:/docs/fileA.md");
      const state = useDocumentStore.getState();
      expect(state.documents.length).toBe(1);
      expect(state.documents[0].fileName).toBe("fileA.md");
      expect(state.activeDocumentId).toBe("C:/docs/fileA.md");
    });

    it("supports closing all documents", async () => {
      vi.mocked(docService.readMarkdownFile)
        .mockResolvedValueOnce(docA)
        .mockResolvedValueOnce(docB);
      vi.mocked(mdService.parseMarkdown).mockResolvedValue(sampleParsed);

      await useDocumentStore.getState().openDocument("C:/docs/fileA.md");
      await useDocumentStore.getState().openDocument("C:/docs/fileB.md");

      useDocumentStore.getState().closeAllDocuments();
      const state = useDocumentStore.getState();
      expect(state.documents.length).toBe(0);
      expect(state.activeDocumentId).toBeNull();
      expect(state.document).toBeNull();
    });

    it("reorders documents correctly", async () => {
      vi.mocked(docService.readMarkdownFile)
        .mockResolvedValueOnce(docA)
        .mockResolvedValueOnce(docB)
        .mockResolvedValueOnce(docC);
      vi.mocked(mdService.parseMarkdown).mockResolvedValue(sampleParsed);

      await useDocumentStore.getState().openDocument("C:/docs/fileA.md");
      await useDocumentStore.getState().openDocument("C:/docs/fileB.md");
      await useDocumentStore.getState().openDocument("C:/docs/fileC.md");

      // Reorder: move fileA (index 0) to index 2
      useDocumentStore.getState().reorderDocuments(0, 2);
      const docs = useDocumentStore.getState().documents;
      expect(docs.map((d) => d.fileName)).toEqual(["fileB.md", "fileC.md", "fileA.md"]);
    });

    it("cycles through tabs with keyboard navigation actions", async () => {
      vi.mocked(docService.readMarkdownFile)
        .mockResolvedValueOnce(docA)
        .mockResolvedValueOnce(docB)
        .mockResolvedValueOnce(docC);
      vi.mocked(mdService.parseMarkdown).mockResolvedValue(sampleParsed);

      await useDocumentStore.getState().openDocument("C:/docs/fileA.md");
      await useDocumentStore.getState().openDocument("C:/docs/fileB.md");
      await useDocumentStore.getState().openDocument("C:/docs/fileC.md");

      // Currently active: C (index 2)
      useDocumentStore.getState().activateNextTab(); // wrap to 0 (fileA)
      expect(useDocumentStore.getState().activeDocumentId).toBe("C:/docs/fileA.md");

      useDocumentStore.getState().activatePreviousTab(); // wrap back to 2 (fileC)
      expect(useDocumentStore.getState().activeDocumentId).toBe("C:/docs/fileC.md");

      useDocumentStore.getState().activateTabByIndex(1); // switch directly to fileB
      expect(useDocumentStore.getState().activeDocumentId).toBe("C:/docs/fileB.md");
    });

    it("tracks and retains independent scroll positions per document", async () => {
      vi.mocked(docService.readMarkdownFile)
        .mockResolvedValueOnce(docA)
        .mockResolvedValueOnce(docB);
      vi.mocked(mdService.parseMarkdown).mockResolvedValue(sampleParsed);

      await useDocumentStore.getState().openDocument("C:/docs/fileA.md");
      await useDocumentStore.getState().openDocument("C:/docs/fileB.md");

      useDocumentStore.getState().updateDocumentScrollPosition("C:/docs/fileA.md", "reader", 350);
      useDocumentStore.getState().updateDocumentScrollPosition("C:/docs/fileA.md", "source", 120);
      useDocumentStore.getState().updateDocumentScrollPosition("C:/docs/fileB.md", "reader", 500);

      const docs = useDocumentStore.getState().documents;
      const docAState = docs.find((d) => d.id === "C:/docs/fileA.md");
      const docBState = docs.find((d) => d.id === "C:/docs/fileB.md");

      expect(docAState?.readerScrollPosition).toBe(350);
      expect(docAState?.sourceScrollPosition).toBe(120);
      expect(docBState?.readerScrollPosition).toBe(500);
      expect(docBState?.sourceScrollPosition).toBe(0);
    });
  });
});
