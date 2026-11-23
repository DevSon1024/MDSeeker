import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { OutlineSidebar } from "./OutlineSidebar";
import { useUIStore } from "@/stores/uiStore";
import { useDocumentStore } from "@/stores/documentStore";
import { MarkdownDocument } from "@/types/markdown";

describe("OutlineSidebar component", () => {
  const sampleDocWithHeadings: MarkdownDocument = {
    blocks: [
      {
        type: "heading",
        level: 1,
        id: "project-overview",
        content: [{ type: "text", value: "Project Overview" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", value: "Some introductory text." }],
      },
      {
        type: "heading",
        level: 2,
        id: "architecture-details",
        content: [{ type: "text", value: "Architecture Details" }],
      },
      {
        type: "heading",
        level: 3,
        id: "data-flow",
        content: [{ type: "text", value: "Data Flow" }],
      },
    ],
    metadata: {
      title: "Project Overview",
      wordCount: 10,
      characterCount: 60,
      readingTimeMinutes: 0.1,
      frontmatter: null,
      hasTables: false,
      hasCodeBlocks: false,
      hasMath: false,
      hasMermaid: false,
      hasTaskLists: false,
      headingsCount: 3,
    },
    parserVersion: "pulldown-cmark-0.13",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.setState({ isSidebarOpen: true });
    useDocumentStore.setState({
      parsedDocument: null,
      document: null,
      documents: [],
      activeDocumentId: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders empty state placeholder when no headings exist", () => {
    render(<OutlineSidebar />);
    expect(screen.getByText("No Outline Available")).toBeDefined();
    expect(
      screen.getByText(
        "Document headings (# H1, ## H2) will appear here once an open document with headings is active."
      )
    ).toBeDefined();
  });

  it("renders hierarchical list of headings from parsed document", () => {
    useDocumentStore.setState({ parsedDocument: sampleDocWithHeadings });

    render(<OutlineSidebar />);
    expect(screen.getByText("Project Overview")).toBeDefined();
    expect(screen.getByText("Architecture Details")).toBeDefined();
    expect(screen.getByText("Data Flow")).toBeDefined();
  });

  it("handles clicking a heading item and attempts to scroll into view", () => {
    useDocumentStore.setState({ parsedDocument: sampleDocWithHeadings });

    const scrollIntoViewMock = vi.fn();
    const headingElement = document.createElement("div");
    headingElement.id = "architecture-details";
    headingElement.scrollIntoView = scrollIntoViewMock;
    document.body.appendChild(headingElement);

    render(<OutlineSidebar />);

    const item = screen.getByText("Architecture Details");
    fireEvent.click(item);

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });

    document.body.removeChild(headingElement);
  });

  it("closes the sidebar when close button is clicked", () => {
    render(<OutlineSidebar />);
    const closeBtn = screen.getByLabelText("Close outline sidebar");
    fireEvent.click(closeBtn);

    expect(useUIStore.getState().isSidebarOpen).toBe(false);
  });
});
