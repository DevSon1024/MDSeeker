import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TabBar } from "./TabBar";
import { useDocumentStore } from "@/stores/documentStore";
import { OpenDocument } from "@/types/document";

vi.mock("@/services/documentService", () => ({
  openMarkdownFileDialog: vi.fn(),
  readMarkdownFile: vi.fn(),
  validateMarkdownFile: vi.fn(),
  getFileMetadata: vi.fn(),
  revealInFileExplorer: vi.fn(),
}));

describe("TabBar component", () => {
  const createMockDoc = (id: string, name: string): OpenDocument => ({
    id,
    canonicalPath: id,
    fileName: name,
    fileExtension: "md",
    fileSizeBytes: 1024,
    lastModifiedTimestamp: 1000,
    rawContent: `# ${name}`,
    parsedDocument: null,
    isLoading: false,
    isParsing: false,
    error: null,
    parseError: null,
    lastAccessedAt: Date.now(),
    readerScrollPosition: 0,
    sourceScrollPosition: 0,
  });

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

  afterEach(() => {
    cleanup();
  });

  it("renders welcome tab when no documents are open", () => {
    render(<TabBar />);
    expect(screen.getByText("Welcome")).toBeDefined();
    expect(screen.getByLabelText("Open Markdown file")).toBeDefined();
  });

  it("renders multiple open document tabs", () => {
    const doc1 = createMockDoc("C:/docs/one.md", "one.md");
    const doc2 = createMockDoc("C:/docs/two.md", "two.md");

    useDocumentStore.setState({
      documents: [doc1, doc2],
      activeDocumentId: "C:/docs/one.md",
    });

    render(<TabBar />);
    expect(screen.getByText("one.md")).toBeDefined();
    expect(screen.getByText("two.md")).toBeDefined();
  });

  it("switches active tab when tab is clicked", () => {
    const doc1 = createMockDoc("C:/docs/one.md", "one.md");
    const doc2 = createMockDoc("C:/docs/two.md", "two.md");

    useDocumentStore.setState({
      documents: [doc1, doc2],
      activeDocumentId: "C:/docs/one.md",
    });

    const setActiveSpy = vi.spyOn(useDocumentStore.getState(), "setActiveDocument");

    render(<TabBar />);
    const tab2 = screen.getByText("two.md");
    fireEvent.click(tab2);

    expect(setActiveSpy).toHaveBeenCalledWith("C:/docs/two.md");
  });

  it("closes tab on close button click", () => {
    const doc1 = createMockDoc("C:/docs/one.md", "one.md");

    useDocumentStore.setState({
      documents: [doc1],
      activeDocumentId: "C:/docs/one.md",
    });

    const closeSpy = vi.spyOn(useDocumentStore.getState(), "closeDocument");

    render(<TabBar />);
    const closeBtn = screen.getByLabelText("Close one.md");
    fireEvent.click(closeBtn);

    expect(closeSpy).toHaveBeenCalledWith("C:/docs/one.md");
  });

  it("closes tab on middle-click (auxclick with button 1)", () => {
    const doc1 = createMockDoc("C:/docs/one.md", "one.md");

    useDocumentStore.setState({
      documents: [doc1],
      activeDocumentId: "C:/docs/one.md",
    });

    const closeSpy = vi.spyOn(useDocumentStore.getState(), "closeDocument");

    render(<TabBar />);
    const tabItem = screen.getByText("one.md").closest('[role="tab"]')!;
    fireEvent.mouseDown(tabItem, { button: 1 });

    expect(closeSpy).toHaveBeenCalledWith("C:/docs/one.md");
  });

  it("opens file dialog when plus button is clicked", () => {
    const dialogSpy = vi.spyOn(useDocumentStore.getState(), "openDocumentDialog");

    render(<TabBar />);
    const plusBtn = screen.getByLabelText("Open Markdown file");
    fireEvent.click(plusBtn);

    expect(dialogSpy).toHaveBeenCalled();
  });

  it("displays context menu on right click and handles close other tabs", () => {
    const doc1 = createMockDoc("C:/docs/one.md", "one.md");
    const doc2 = createMockDoc("C:/docs/two.md", "two.md");

    useDocumentStore.setState({
      documents: [doc1, doc2],
      activeDocumentId: "C:/docs/one.md",
    });

    const closeOtherSpy = vi.spyOn(useDocumentStore.getState(), "closeOtherDocuments");

    render(<TabBar />);
    const tabItem = screen.getByText("one.md").closest('[role="tab"]')!;
    fireEvent.contextMenu(tabItem, { clientX: 100, clientY: 50 });

    expect(screen.getByText("Close Other Tabs")).toBeDefined();
    fireEvent.click(screen.getByText("Close Other Tabs"));

    expect(closeOtherSpy).toHaveBeenCalledWith("C:/docs/one.md");
  });
});
