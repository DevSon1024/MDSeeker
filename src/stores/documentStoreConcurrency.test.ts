import { describe, it, expect, beforeEach, vi } from "vitest";
import { useDocumentStore } from "./documentStore";
import * as docService from "@/services/documentService";
import * as mdService from "@/services/markdownService";
import { LoadedDocument } from "@/types/document";
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

describe("documentStore Concurrency & Hardening", () => {
  const sampleDocA: LoadedDocument = {
    canonicalPath: "C:/docs/concurrencyA.md",
    fileName: "concurrencyA.md",
    fileExtension: "md",
    fileSizeBytes: 1024,
    lastModifiedTimestamp: 1700000000000,
    rawContent: "# Concurrency A",
  };

  const sampleParsed: MarkdownDocument = {
    blocks: [
      {
        type: "heading",
        level: 1,
        id: "concurrency",
        content: [{ type: "text", value: "Concurrency Test" }],
      },
    ],
    metadata: {
      title: "Concurrency Test",
      wordCount: 2,
      characterCount: 16,
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

  it("deduplicates concurrent in-flight openDocument calls for the same file path", async () => {
    let resolveRead: (doc: LoadedDocument) => void;
    const slowReadPromise = new Promise<LoadedDocument>((res) => {
      resolveRead = res;
    });

    vi.mocked(docService.readMarkdownFile).mockReturnValue(slowReadPromise);
    vi.mocked(mdService.parseMarkdown).mockResolvedValue(sampleParsed);

    // Call openDocument 3 times concurrently for identical path
    const p1 = useDocumentStore.getState().openDocument("C:/docs/concurrencyA.md");
    const p2 = useDocumentStore.getState().openDocument("C:/docs/concurrencyA.md");
    const p3 = useDocumentStore.getState().openDocument("C:/docs/concurrencyA.md");

    // Only one readMarkdownFile call should have been initiated
    expect(docService.readMarkdownFile).toHaveBeenCalledTimes(1);

    resolveRead!(sampleDocA);
    await Promise.all([p1, p2, p3]);

    const state = useDocumentStore.getState();
    expect(state.documents.length).toBe(1);
    expect(state.activeDocumentId).toBe("C:/docs/concurrencyA.md");
    expect(state.document?.fileName).toBe("concurrencyA.md");
  });

  it("safely discards stale document load results if the tab was closed while loading", async () => {
    let resolveRead: (doc: LoadedDocument) => void;
    const slowReadPromise = new Promise<LoadedDocument>((res) => {
      resolveRead = res;
    });

    vi.mocked(docService.readMarkdownFile).mockReturnValue(slowReadPromise);
    vi.mocked(mdService.parseMarkdown).mockResolvedValue(sampleParsed);

    const openPromise = useDocumentStore.getState().openDocument("C:/docs/concurrencyA.md");

    // Tab is created in optimistic loading state
    expect(useDocumentStore.getState().documents.length).toBe(1);

    // User closes the tab before read resolves
    useDocumentStore.getState().closeDocument("C:/docs/concurrencyA.md");
    expect(useDocumentStore.getState().documents.length).toBe(0);

    // Read finally resolves
    resolveRead!(sampleDocA);
    await openPromise;

    // Must not resurrect the closed tab
    const state = useDocumentStore.getState();
    expect(state.documents.length).toBe(0);
    expect(state.activeDocumentId).toBeNull();
    expect(state.document).toBeNull();
  });

  it("tracks generation per tab to discard outdated AST parsing results", async () => {
    vi.mocked(docService.readMarkdownFile).mockResolvedValue(sampleDocA);

    let resolveSlowParse: (parsed: MarkdownDocument) => void;
    const slowParsePromise = new Promise<MarkdownDocument>((res) => {
      resolveSlowParse = res;
    });
    vi.mocked(mdService.parseMarkdown).mockReturnValue(slowParsePromise);

    // Start open document
    const openPromise = useDocumentStore.getState().openDocument("C:/docs/concurrencyA.md");

    // Close the document during parsing phase
    await Promise.resolve(); // allow readMarkdownFile to finish
    useDocumentStore.getState().closeDocument("C:/docs/concurrencyA.md");

    // Now slow parser resolves
    resolveSlowParse!(sampleParsed);
    await openPromise;

    const state = useDocumentStore.getState();
    expect(state.documents.length).toBe(0);
    expect(state.parsedDocument).toBeNull();
  });

  it("updates document scroll position and retains it across tabs", () => {
    useDocumentStore.setState({
      documents: [
        {
          id: "C:/docs/doc1.md",
          canonicalPath: "C:/docs/doc1.md",
          fileName: "doc1.md",
          fileExtension: "md",
          fileSizeBytes: 100,
          lastModifiedTimestamp: 1000,
          rawContent: "Doc 1",
          parsedDocument: null,
          isLoading: false,
          isParsing: false,
          error: null,
          parseError: null,
          lastAccessedAt: Date.now(),
          readerScrollPosition: 0,
          sourceScrollPosition: 0,
        },
        {
          id: "C:/docs/doc2.md",
          canonicalPath: "C:/docs/doc2.md",
          fileName: "doc2.md",
          fileExtension: "md",
          fileSizeBytes: 200,
          lastModifiedTimestamp: 2000,
          rawContent: "Doc 2",
          parsedDocument: null,
          isLoading: false,
          isParsing: false,
          error: null,
          parseError: null,
          lastAccessedAt: Date.now(),
          readerScrollPosition: 0,
          sourceScrollPosition: 0,
        },
      ],
      activeDocumentId: "C:/docs/doc1.md",
    });

    useDocumentStore.getState().updateDocumentScrollPosition("C:/docs/doc1.md", "reader", 420);
    useDocumentStore.getState().updateDocumentScrollPosition("C:/docs/doc2.md", "source", 880);

    const doc1 = useDocumentStore.getState().documents.find((d) => d.id === "C:/docs/doc1.md");
    const doc2 = useDocumentStore.getState().documents.find((d) => d.id === "C:/docs/doc2.md");

    expect(doc1?.readerScrollPosition).toBe(420);
    expect(doc2?.sourceScrollPosition).toBe(880);
  });
});
