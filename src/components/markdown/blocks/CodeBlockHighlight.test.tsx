import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { CodeBlock } from "./CodeBlock";
import * as highlightService from "@/services/highlightService";
import mermaid from "mermaid";

describe("CodeBlock Syntax Highlighting", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("delegates to MermaidBlock when language is 'mermaid'", async () => {
    vi.spyOn(mermaid, "render").mockResolvedValueOnce({
      svg: '<svg><text>Mermaid Diagram Content</text></svg>',
      diagramType: "flowchart",
    });

    render(
      <CodeBlock
        node={{
          type: "codeBlock",
          language: "mermaid",
          code: "graph TD; A-->B;",
          isFenced: true,
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("figure", { name: "Mermaid diagram" })).toBeDefined();
    });
  });

  it("renders structured tokens with syntax colors and font styles", async () => {
    vi.spyOn(highlightService, "highlightCode").mockResolvedValueOnce({
      language: "Rust",
      lines: [
        {
          tokens: [
            { content: "fn ", color: "#b48ead", fontStyle: "bold" },
            { content: "main", color: "#8fa1b3", fontStyle: "normal" },
            { content: "() {\n", color: "#c0c5ce" },
          ],
        },
        {
          tokens: [
            { content: "    ", color: undefined },
            { content: "let ", color: "#b48ead", fontStyle: "bold" },
            { content: "x = 42;\n", color: "#d08770" },
          ],
        },
      ],
    });

    render(
      <CodeBlock
        node={{
          type: "codeBlock",
          language: "rust",
          code: "fn main() {\n    let x = 42;\n",
          isFenced: true,
        }}
      />
    );

    // Initial label
    expect(screen.getByText("RUST")).toBeDefined();

    await waitFor(() => {
      const fnToken = screen.getByText((_, element) => element?.textContent === "fn ");
      expect(fnToken.style.color).toBe("#b48ead");
      expect(fnToken.style.fontWeight).toBe("bold");

      const numToken = screen.getByText((_, element) => element?.textContent === "x = 42;\n");
      expect(numToken.style.color).toBe("#d08770");
    });
  });

  it("copies original code when Copy button is clicked", async () => {
    const sampleCode = "console.log('hello world');";
    render(
      <CodeBlock
        node={{
          type: "codeBlock",
          language: "js",
          code: sampleCode,
          isFenced: true,
        }}
      />
    );

    const copyBtn = screen.getByRole("button", { name: "Copy code" });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sampleCode);

    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeDefined();
    });
  });
});
