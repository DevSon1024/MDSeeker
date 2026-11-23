import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useUIStore } from "@/stores/uiStore";
import { useDocumentStore } from "@/stores/documentStore";
import { TitleBar } from "./window/TitleBar";
import { TabBar } from "./tabs/TabBar";
import { ReaderToolbar } from "./toolbar/ReaderToolbar";
import { OutlineSidebar } from "./sidebar/OutlineSidebar";
import { EmptyWorkspace } from "./workspace/EmptyWorkspace";
import { StatusBar } from "./status/StatusBar";
import { LoadedDocument } from "@/types/document";

const sampleDoc: LoadedDocument = {
  canonicalPath: "C:/projects/README.md",
  fileName: "README.md",
  fileExtension: "md",
  fileSizeBytes: 2048,
  lastModifiedTimestamp: 1700000000000,
  rawContent: "# Welcome to MDSeeker",
};

describe("Phase 03 Components & Document Integration", () => {
  beforeEach(() => {
    useUIStore.setState({
      theme: "system",
      isSidebarOpen: false,
      viewMode: "reading",
      isMaximized: false,
      isSearchOpen: false,
    });
    useDocumentStore.setState({
      document: null,
      isLoading: false,
      error: null,
      isDraggingOver: false,
      currentRequestId: 0,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("TitleBar and WindowControls", () => {
    it("renders title bar with branding and window controls", () => {
      render(<TitleBar />);
      expect(screen.getByText("MDSeeker")).toBeDefined();
      expect(screen.getByLabelText("Minimize")).toBeDefined();
      expect(screen.getByLabelText("Maximize")).toBeDefined();
      expect(screen.getByLabelText("Close")).toBeDefined();
    });

    it("displays loaded document filename in title bar", () => {
      useDocumentStore.setState({ document: sampleDoc });
      render(<TitleBar />);
      expect(screen.getByText("README.md")).toBeDefined();
    });
  });

  describe("TabBar", () => {
    it("renders welcome tab when no document is open", () => {
      render(<TabBar />);
      expect(screen.getByText("Welcome")).toBeDefined();
      expect(screen.getByLabelText("Open Markdown file")).toBeDefined();
    });

    it("renders active document tab and triggers close on close button click", () => {
      useDocumentStore.setState({ document: sampleDoc });
      const closeSpy = vi.spyOn(useDocumentStore.getState(), "closeDocument");

      render(<TabBar />);
      expect(screen.getByText("README.md")).toBeDefined();

      const closeTabBtn = screen.getByLabelText("Close README.md");
      fireEvent.click(closeTabBtn);
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe("ReaderToolbar", () => {
    it("renders sidebar toggle and updates store on click", () => {
      render(<ReaderToolbar />);
      const sidebarToggle = screen.getByLabelText("Show Outline Sidebar");
      fireEvent.click(sidebarToggle);
      expect(useUIStore.getState().isSidebarOpen).toBe(true);
    });

    it("switches view modes on button click", () => {
      render(<ReaderToolbar />);
      const sourceBtn = screen.getByLabelText("Source mode");
      fireEvent.click(sourceBtn);
      expect(useUIStore.getState().viewMode).toBe("source");

      const splitBtn = screen.getByLabelText("Split mode");
      fireEvent.click(splitBtn);
      expect(useUIStore.getState().viewMode).toBe("split");
    });
  });

  describe("OutlineSidebar", () => {
    it("renders empty outline placeholder", () => {
      useUIStore.setState({ isSidebarOpen: true });
      render(<OutlineSidebar />);
      expect(screen.getByText("Outline")).toBeDefined();
      expect(screen.getByText("No Outline Available")).toBeDefined();
    });
  });

  describe("EmptyWorkspace", () => {
    it("renders empty state when no document is loaded", () => {
      render(<EmptyWorkspace />);
      expect(screen.getByRole("heading", { name: "MDSeeker" })).toBeDefined();
      expect(screen.getByText(".md")).toBeDefined();
      expect(screen.getByText(".markdown")).toBeDefined();
      expect(screen.getByRole("button", { name: /Open Markdown File/i })).toBeDefined();
    });

    it("renders loaded document state when document is present", () => {
      useDocumentStore.setState({ document: sampleDoc });
      render(<EmptyWorkspace />);

      expect(screen.getByText("Document Loaded Successfully")).toBeDefined();
      expect(screen.getByText("README.md")).toBeDefined();
      expect(screen.getByText("C:/projects/README.md")).toBeDefined();
      expect(screen.getByText("2 KB")).toBeDefined();
      expect(screen.getByRole("button", { name: /Open Another/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /Close/i })).toBeDefined();
    });

    it("renders error banner when error is present", () => {
      useDocumentStore.setState({
        error: {
          code: "FILE_TOO_LARGE",
          message: "File exceeds 20 MB limit.",
          path: "huge.md",
        },
      });

      render(<EmptyWorkspace />);
      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText("FILE TOO LARGE")).toBeDefined();
      expect(screen.getByText("File exceeds 20 MB limit.")).toBeDefined();

      const dismissBtn = screen.getByLabelText("Dismiss error");
      fireEvent.click(dismissBtn);
      expect(useDocumentStore.getState().error).toBeNull();
    });
  });

  describe("StatusBar", () => {
    it("renders placeholder status when no document is loaded", () => {
      render(<StatusBar />);
      expect(screen.getByText("No document loaded")).toBeDefined();
      expect(screen.getByText("Reading Mode")).toBeDefined();
      expect(screen.getByText("UTF-8")).toBeDefined();
    });

    it("displays document filename and size when document is loaded", () => {
      useDocumentStore.setState({ document: sampleDoc });
      render(<StatusBar />);
      expect(screen.getByText("README.md")).toBeDefined();
      expect(screen.getByText("2 KB")).toBeDefined();
      expect(screen.getByText("Reading Mode")).toBeDefined();
      expect(screen.getByText("UTF-8")).toBeDefined();
    });
  });
});
