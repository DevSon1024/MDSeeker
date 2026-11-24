// Polyfill for Happy-DOM environment bug where Node.prototype.nodeName returns "" for Elements
if (typeof Node !== "undefined" && Node.prototype) {
  const origDesc = Object.getOwnPropertyDescriptor(Node.prototype, "nodeName");
  if (origDesc?.get) {
    Object.defineProperty(Node.prototype, "nodeName", {
      get(this: Node) {
        return (this as Element).tagName || origDesc.get!.call(this);
      },
      configurable: true,
      enumerable: false,
    });
  }
}

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { sanitizeHtml, sanitizeStyleString, isHtmlVisuallyEmpty } from "./utils/htmlSanitizer";
import { groupMarkdownBlocks } from "./utils/htmlBlockGrouper";
import { MarkdownReader } from "./MarkdownReader";
import { MarkdownDocument } from "@/types/markdown";

// Mock Tauri plugin-opener
vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: vi.fn().mockResolvedValue(undefined),
}));

// Mock @tauri-apps/api/core
vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: vi.fn((path: string) => `asset://localhost/${encodeURIComponent(path)}`),
  invoke: vi.fn(),
}));

describe("HTML Sanitizer & Security", () => {
  it("strips malicious <script> tags completely", () => {
    const malicious = '<div>Hello <script>alert("xss")</script>World</div>';
    const cleaned = sanitizeHtml(malicious);
    expect(cleaned).toContain("Hello ");
    expect(cleaned).toContain("World");
    expect(cleaned).not.toContain("script");
    expect(cleaned).not.toContain("alert");
  });

  it("strips dangerous <iframe>, <object>, and <embed> tags", () => {
    const dangerous = `
      <iframe src="https://evil.com"></iframe>
      <object data="evil.swf"></object>
      <embed src="evil.swf" />
      <p>Safe paragraph</p>
    `;
    const cleaned = sanitizeHtml(dangerous);
    expect(cleaned).not.toContain("iframe");
    expect(cleaned).not.toContain("object");
    expect(cleaned).not.toContain("embed");
    expect(cleaned).toContain("<p>Safe paragraph</p>");
  });

  it("strips inline event handlers (onerror, onclick, onload, etc.)", () => {
    const malicious = '<img src="invalid.png" onerror="alert(1)" onclick="steal()" onload="hack()" />';
    const cleaned = sanitizeHtml(malicious);
    expect(cleaned).not.toContain("onerror");
    expect(cleaned).not.toContain("onclick");
    expect(cleaned).not.toContain("onload");
    expect(cleaned).not.toContain("alert");
  });

  it("strips javascript: and vbscript: URIs from links and images", () => {
    const malicious = `
      <a href="javascript:alert(1)">Click me</a>
      <a href="vbscript:msgbox(1)">VisualBasic</a>
      <img src="javascript:alert(2)" />
    `;
    const cleaned = sanitizeHtml(malicious);
    expect(cleaned).not.toContain("javascript:");
    expect(cleaned).not.toContain("vbscript:");
  });

  it("sanitizes CSS styles against an allowlist and blocks dangerous properties", () => {
    // Blocks url(), expression(), position: fixed/absolute
    expect(sanitizeStyleString("position: fixed; top: 0;")).toBe("");
    expect(sanitizeStyleString("background-image: url('http://evil.com/x.png');")).toBe("");
    expect(sanitizeStyleString("width: expression(alert(1));")).toBe("");

    // Retains safe CSS properties
    const safeStyle = "text-align: center; max-width: 600px; color: #ff0000; font-size: 14px;";
    const cleaned = sanitizeStyleString(safeStyle);
    expect(cleaned).toContain("text-align: center");
    expect(cleaned).toContain("max-width: 600px");
    expect(cleaned).toContain("color: #ff0000");
    expect(cleaned).toContain("font-size: 14px");
  });

  it("secures valid external links with target=_blank and rel=noopener noreferrer", () => {
    const html = '<a href="https://github.com/devson/mdseeker">Project Repository</a>';
    const cleaned = sanitizeHtml(html);
    expect(cleaned).toContain('href="https://github.com/devson/mdseeker"');
    expect(cleaned).toContain('target="_blank"');
    expect(cleaned).toContain('rel="noopener noreferrer"');
    expect(cleaned).toContain("mdseeker-html-link");
  });

  it("resolves relative local image paths to asset URLs using docPath", () => {
    const html = '<img src="docs/screenshots/preview.png" alt="Preview" />';
    const cleaned = sanitizeHtml(html, {
      docPath: "C:\\Users\\DEVENDRA\\Projects\\MDSeeker\\README.md",
    });
    expect(cleaned).toContain('alt="Preview"');
    expect(cleaned).toContain("asset://localhost/");
    expect(cleaned).toContain("preview.png");
    expect(cleaned).toContain('loading="lazy"');
  });

  it("detects visually empty HTML", () => {
    expect(isHtmlVisuallyEmpty("")).toBe(true);
    expect(isHtmlVisuallyEmpty("   \n\t  ")).toBe(true);
    expect(isHtmlVisuallyEmpty("<div>   </div>")).toBe(true);
    expect(isHtmlVisuallyEmpty("<div><p></p></div>")).toBe(true);
    expect(isHtmlVisuallyEmpty("<div><span>Hello</span></div>")).toBe(false);
    expect(isHtmlVisuallyEmpty('<img src="logo.png" />')).toBe(false);
    expect(isHtmlVisuallyEmpty("<hr>")).toBe(false);
  });
});

describe("Container Grouping & Mixed HTML/Markdown", () => {
  it("groups blocks enclosed by <div align='center'> and </div>", () => {
    const blocks = [
      {
        type: "htmlBlock" as const,
        content: '<div align="center">',
      },
      {
        type: "heading" as const,
        level: 1 as const,
        id: "title",
        content: [{ type: "text" as const, value: "Centered Project Title" }],
      },
      {
        type: "paragraph" as const,
        content: [{ type: "text" as const, value: "A fast Markdown viewer" }],
      },
      {
        type: "htmlBlock" as const,
        content: "</div>",
      },
    ];

    const grouped = groupMarkdownBlocks(blocks);
    expect(grouped.length).toBe(1);
    expect(grouped[0].type).toBe("container");

    if (grouped[0].type === "container") {
      expect(grouped[0].tag).toBe("div");
      expect(grouped[0].align).toBe("center");
      expect(grouped[0].children.length).toBe(2);
    }
  });

  it("groups blocks enclosed by <details><summary>...</summary> and </details>", () => {
    const blocks = [
      {
        type: "htmlBlock" as const,
        content: "<details><summary>Click for setup guide</summary>",
      },
      {
        type: "paragraph" as const,
        content: [{ type: "text" as const, value: "Step 1: Install dependencies" }],
      },
      {
        type: "htmlBlock" as const,
        content: "</details>",
      },
    ];

    const grouped = groupMarkdownBlocks(blocks);
    expect(grouped.length).toBe(1);
    expect(grouped[0].type).toBe("container");

    if (grouped[0].type === "container") {
      expect(grouped[0].tag).toBe("details");
      expect(grouped[0].summaryHtml).toBe("Click for setup guide");
      expect(grouped[0].children.length).toBe(1);
    }
  });
});

describe("MarkdownReader Full HTML Integration", () => {
  const baseMetadata = {
    title: null,
    wordCount: 10,
    characterCount: 50,
    readingTimeMinutes: 0.1,
    frontmatter: null,
    hasTables: false,
    hasCodeBlocks: false,
    hasMath: false,
    hasMermaid: false,
    hasTaskLists: false,
    headingsCount: 1,
  };

  it("renders a GitHub README banner with centered logo, heading, and description", () => {
    const doc: MarkdownDocument = {
      blocks: [
        {
          type: "htmlBlock",
          content: `
            <div align="center">
              <img src="https://example.com/logo.png" width="96" height="96" alt="MDSeeker Logo" />
              <h1>MDSeeker Desktop</h1>
              <p>Blazing-fast Markdown Reader for Windows</p>
            </div>
          `,
        },
      ],
      metadata: baseMetadata,
      parserVersion: "pulldown-cmark-0.13",
    };

    render(<MarkdownReader document={doc} />);

    expect(screen.getByText("MDSeeker Desktop")).toBeDefined();
    expect(screen.getByText("Blazing-fast Markdown Reader for Windows")).toBeDefined();
    const img = screen.getByAltText("MDSeeker Logo") as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.getAttribute("width")).toBe("96");
    expect(img.getAttribute("height")).toBe("96");
  });

  it("renders HTML tables with proper rows, cells, and alignment", () => {
    const doc: MarkdownDocument = {
      blocks: [
        {
          type: "htmlBlock",
          content: `
            <table class="features-table">
              <thead>
                <tr>
                  <th align="left">Feature</th>
                  <th align="center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>HTML Support</td>
                  <td>Enabled</td>
                </tr>
              </tbody>
            </table>
          `,
        },
      ],
      metadata: baseMetadata,
      parserVersion: "pulldown-cmark-0.13",
    };

    render(<MarkdownReader document={doc} />);

    expect(screen.getByText("Feature")).toBeDefined();
    expect(screen.getByText("Status")).toBeDefined();
    expect(screen.getByText("HTML Support")).toBeDefined();
    expect(screen.getByText("Enabled")).toBeDefined();
  });

  it("renders inline HTML tags like <kbd>, <sub>, <sup>, and <code> inside paragraphs", () => {
    const doc: MarkdownDocument = {
      blocks: [
        {
          type: "paragraph",
          content: [
            { type: "text", value: "Press " },
            { type: "inlineHtml", content: "<kbd>Ctrl</kbd>" },
            { type: "text", value: " + " },
            { type: "inlineHtml", content: "<kbd>P</kbd>" },
            { type: "text", value: " to open Command Palette. Chemical: H" },
            { type: "inlineHtml", content: "<sub>2</sub>" },
            { type: "text", value: "O, Math: 2" },
            { type: "inlineHtml", content: "<sup>10</sup>" },
          ],
        },
      ],
      metadata: baseMetadata,
      parserVersion: "pulldown-cmark-0.13",
    };

    render(<MarkdownReader document={doc} />);

    expect(screen.getByText("Ctrl")).toBeDefined();
    expect(screen.getByText("P")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("10")).toBeDefined();
  });
});
