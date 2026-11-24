import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MarkdownReader } from "./MarkdownReader";
import { MarkdownDocument } from "@/types/markdown";

describe("MarkdownReader Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders H1 through H6 headings with semantic elements and IDs", () => {
    const doc: MarkdownDocument = {
      blocks: [
        {
          type: "heading",
          level: 1,
          id: "head-1",
          content: [{ type: "text", value: "Heading Level 1" }],
        },
        {
          type: "heading",
          level: 2,
          id: "head-2",
          content: [{ type: "text", value: "Heading Level 2" }],
        },
        {
          type: "heading",
          level: 3,
          id: null,
          content: [{ type: "text", value: "Heading Level 3" }],
        },
      ],
      metadata: {
        title: "Heading Level 1",
        wordCount: 9,
        characterCount: 45,
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

    render(<MarkdownReader document={doc} />);

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Heading Level 1");
    expect(h1.id).toBe("head-1");

    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2.textContent).toBe("Heading Level 2");
    expect(h2.id).toBe("head-2");

    const h3 = screen.getByRole("heading", { level: 3 });
    expect(h3.textContent).toBe("Heading Level 3");
  });

  it("renders paragraphs and nested inlines (strong, emphasis, strikethrough, code)", () => {
    const doc: MarkdownDocument = {
      blocks: [
        {
          type: "paragraph",
          content: [
            { type: "text", value: "Normal text with " },
            {
              type: "strong",
              content: [
                { type: "text", value: "bold and " },
                {
                  type: "emphasis",
                  content: [{ type: "text", value: "italic nested" }],
                },
              ],
            },
            { type: "text", value: " and " },
            {
              type: "strikethrough",
              content: [{ type: "text", value: "strikethrough" }],
            },
            { type: "text", value: " and " },
            { type: "code", code: "const x = 42;" },
          ],
        },
      ],
      metadata: {
        title: null,
        wordCount: 12,
        characterCount: 65,
        readingTimeMinutes: 0.1,
        frontmatter: null,
        hasTables: false,
        hasCodeBlocks: false,
        hasMath: false,
        hasMermaid: false,
        hasTaskLists: false,
        headingsCount: 0,
      },
      parserVersion: "pulldown-cmark-0.13",
    };

    render(<MarkdownReader document={doc} />);

    expect(screen.getByText("italic nested")).toBeDefined();
    expect(screen.getByText("strikethrough")).toBeDefined();
    expect(screen.getByText("const x = 42;")).toBeDefined();
  });

  it("renders safe links and blocks dangerous javascript links", () => {
    const doc: MarkdownDocument = {
      blocks: [
        {
          type: "paragraph",
          content: [
            {
              type: "link",
              url: "https://example.com/safe",
              title: "Safe Link Title",
              content: [{ type: "text", value: "Safe Link" }],
            },
            { type: "softBreak" },
            {
              type: "link",
              url: "javascript:alert(1)",
              title: null,
              content: [{ type: "text", value: "Dangerous Script" }],
            },
          ],
        },
      ],
      metadata: {
        title: null,
        wordCount: 4,
        characterCount: 25,
        readingTimeMinutes: 0.1,
        frontmatter: null,
        hasTables: false,
        hasCodeBlocks: false,
        hasMath: false,
        hasMermaid: false,
        hasTaskLists: false,
        headingsCount: 0,
      },
      parserVersion: "pulldown-cmark-0.13",
    };

    render(<MarkdownReader document={doc} />);

    const safeLink = screen.getByRole("link", { name: /Safe Link/ });
    expect(safeLink.getAttribute("href")).toBe("https://example.com/safe");

    // The dangerous link should NOT be an accessible link
    expect(screen.queryByRole("link", { name: /Dangerous Script/ })).toBeNull();
    // It is rendered as inert text
    expect(screen.getByText("Dangerous Script")).toBeDefined();
  });

  it("renders code blocks with language indicator and copy button", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
      writable: true,
    });

    const doc: MarkdownDocument = {
      blocks: [
        {
          type: "codeBlock",
          language: "rust",
          code: 'fn main() {\n    println!("Hello!");\n}',
          isFenced: true,
        },
      ],
      metadata: {
        title: null,
        wordCount: 4,
        characterCount: 35,
        readingTimeMinutes: 0.1,
        frontmatter: null,
        hasTables: false,
        hasCodeBlocks: true,
        hasMath: false,
        hasMermaid: false,
        hasTaskLists: false,
        headingsCount: 0,
      },
      parserVersion: "pulldown-cmark-0.13",
    };

    render(<MarkdownReader document={doc} />);

    expect(screen.getByText("RUST")).toBeDefined();
    expect(screen.getByText(/fn main\(\)/)).toBeDefined();

    const copyBtn = screen.getByRole("button", { name: "Copy code" });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('fn main() {\n    println!("Hello!");\n}');
  });

  it("renders lists and task lists with checkboxes", () => {
    const doc: MarkdownDocument = {
      blocks: [
        {
          type: "list",
          isOrdered: false,
          startNumber: null,
          isTight: true,
          items: [
            {
              checked: true,
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", value: "Done task item" }],
                },
              ],
            },
            {
              checked: false,
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", value: "Pending task item" }],
                },
              ],
            },
          ],
        },
      ],
      metadata: {
        title: null,
        wordCount: 6,
        characterCount: 30,
        readingTimeMinutes: 0.1,
        frontmatter: null,
        hasTables: false,
        hasCodeBlocks: false,
        hasMath: false,
        hasMermaid: false,
        hasTaskLists: true,
        headingsCount: 0,
      },
      parserVersion: "pulldown-cmark-0.13",
    };

    render(<MarkdownReader document={doc} />);

    expect(screen.getByText("Done task item")).toBeDefined();
    expect(screen.getByText("Pending task item")).toBeDefined();

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(2);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
  });

  it("renders GFM admonition blockquotes", () => {
    const doc: MarkdownDocument = {
      blocks: [
        {
          type: "blockquote",
          kind: "warning",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", value: "This is a critical warning message." }],
            },
          ],
        },
      ],
      metadata: {
        title: null,
        wordCount: 6,
        characterCount: 35,
        readingTimeMinutes: 0.1,
        frontmatter: null,
        hasTables: false,
        hasCodeBlocks: false,
        hasMath: false,
        hasMermaid: false,
        hasTaskLists: false,
        headingsCount: 0,
      },
      parserVersion: "pulldown-cmark-0.13",
    };

    render(<MarkdownReader document={doc} />);

    expect(screen.getByText("WARNING")).toBeDefined();
    expect(screen.getByText("This is a critical warning message.")).toBeDefined();
  });

  it("renders tables with headers, cells, and alignment", () => {
    const doc: MarkdownDocument = {
      blocks: [
        {
          type: "table",
          columns: [
            {
              align: "left",
              header: [{ type: "text", value: "Key" }],
            },
            {
              align: "right",
              header: [{ type: "text", value: "Value" }],
            },
          ],
          rows: [
            {
              cells: [
                [{ type: "text", value: "Item A" }],
                [{ type: "text", value: "100" }],
              ],
            },
          ],
        },
      ],
      metadata: {
        title: null,
        wordCount: 4,
        characterCount: 15,
        readingTimeMinutes: 0.1,
        frontmatter: null,
        hasTables: true,
        hasCodeBlocks: false,
        hasMath: false,
        hasMermaid: false,
        hasTaskLists: false,
        headingsCount: 0,
      },
      parserVersion: "pulldown-cmark-0.13",
    };

    render(<MarkdownReader document={doc} />);

    expect(screen.getByText("Key")).toBeDefined();
    expect(screen.getByText("Value")).toBeDefined();
    expect(screen.getByText("Item A")).toBeDefined();
    expect(screen.getByText("100")).toBeDefined();
  });

  it("renders sanitized HTML blocks without executing scripts", () => {
    const doc: MarkdownDocument = {
      blocks: [
        {
          type: "htmlBlock",
          content: '<div class="alert"><script>evil()</script>Sample text</div>',
        },
      ],
      metadata: {
        title: null,
        wordCount: 0,
        characterCount: 0,
        readingTimeMinutes: 0,
        frontmatter: null,
        hasTables: false,
        hasCodeBlocks: false,
        hasMath: false,
        hasMermaid: false,
        hasTaskLists: false,
        headingsCount: 0,
      },
      parserVersion: "pulldown-cmark-0.13",
    };

    const { container } = render(<MarkdownReader document={doc} />);

    expect(screen.getByText("Sample text")).toBeDefined();
    expect(container.querySelector("script")).toBeNull();
  });

  it("renders footnotes definitions and references", () => {
    const doc: MarkdownDocument = {
      blocks: [
        {
          type: "paragraph",
          content: [
            { type: "text", value: "Statement " },
            { type: "footnoteReference", label: "1" },
          ],
        },
        {
          type: "footnoteDefinition",
          label: "1",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", value: "Footnote explanation text" }],
            },
          ],
        },
      ],
      metadata: {
        title: null,
        wordCount: 5,
        characterCount: 30,
        readingTimeMinutes: 0.1,
        frontmatter: null,
        hasTables: false,
        hasCodeBlocks: false,
        hasMath: false,
        hasMermaid: false,
        hasTaskLists: false,
        headingsCount: 0,
      },
      parserVersion: "pulldown-cmark-0.13",
    };

    render(<MarkdownReader document={doc} />);

    expect(screen.getByText("[1]")).toBeDefined();
    expect(screen.getByText(/Footnote explanation text/)).toBeDefined();
  });

  it("renders frontmatter metadata disclosure card when present", () => {
    const doc: MarkdownDocument = {
      blocks: [
        {
          type: "paragraph",
          content: [{ type: "text", value: "Content with frontmatter" }],
        },
      ],
      metadata: {
        title: "Test Frontmatter",
        wordCount: 3,
        characterCount: 20,
        readingTimeMinutes: 0.1,
        frontmatter: "title: Test Frontmatter\nauthor: Devson\n",
        hasTables: false,
        hasCodeBlocks: false,
        hasMath: false,
        hasMermaid: false,
        hasTaskLists: false,
        headingsCount: 0,
      },
      parserVersion: "pulldown-cmark-0.13",
    };

    render(<MarkdownReader document={doc} />);

    const frontmatterBtn = screen.getByText("Document Metadata (Frontmatter)");
    expect(frontmatterBtn).toBeDefined();

    // Toggle frontmatter disclosure
    fireEvent.click(frontmatterBtn);
    expect(screen.getByText(/author: Devson/)).toBeDefined();
  });
});
