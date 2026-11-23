import { describe, it, expect, beforeEach, vi } from "vitest";
import { useDocumentStore } from "./documentStore";
import * as docService from "@/services/documentService";
import { FileErrorResponse, LoadedDocument } from "@/types/document";

vi.mock("@/services/documentService", () => ({
  openMarkdownFileDialog: vi.fn(),
  readMarkdownFile: vi.fn(),
  validateMarkdownFile: vi.fn(),
  getFileMetadata: vi.fn(),
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

  beforeEach(() => {
    vi.clearAllMocks();
    useDocumentStore.setState({
      document: null,
      isLoading: false,
      error: null,
      isDraggingOver: false,
      currentRequestId: 0,
    });
  });

  it("initializes with default empty state", () => {
    const state = useDocumentStore.getState();
    expect(state.document).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.isDraggingOver).toBe(false);
  });

  it("loads document successfully by path", async () => {
    vi.mocked(docService.readMarkdownFile).mockResolvedValue(sampleDoc);

    const promise = useDocumentStore.getState().loadDocumentByPath("C:/docs/notes.md");
    expect(useDocumentStore.getState().isLoading).toBe(true);

    await promise;

    const state = useDocumentStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.document).toEqual(sampleDoc);
    expect(state.error).toBeNull();
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
    expect(state.error).toEqual(mockError);
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

    await useDocumentStore.getState().openDocumentDialog();

    expect(docService.readMarkdownFile).toHaveBeenCalledWith("C:/docs/guide.markdown");
    expect(useDocumentStore.getState().document?.fileName).toBe("guide.markdown");
  });

  it("closes the document cleanly", () => {
    useDocumentStore.setState({
      document: sampleDoc,
      error: { code: "SOME_ERR", message: "err" },
    });

    useDocumentStore.getState().closeDocument();

    const state = useDocumentStore.getState();
    expect(state.document).toBeNull();
    expect(state.error).toBeNull();
  });

  it("dismisses error message", () => {
    useDocumentStore.setState({
      error: { code: "ERR", message: "Some error" },
    });

    useDocumentStore.getState().dismissError();
    expect(useDocumentStore.getState().error).toBeNull();
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
});
