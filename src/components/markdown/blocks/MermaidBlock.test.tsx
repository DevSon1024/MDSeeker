import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { MermaidBlock } from "./MermaidBlock";
import mermaid from "mermaid";
import { useUIStore } from "@/stores/uiStore";

describe("MermaidBlock Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.setState({ theme: "light" });

    // Mock clipboard
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

  it("renders sanitized SVG when mermaid rendering succeeds", async () => {
    vi.spyOn(mermaid, "render").mockResolvedValueOnce({
      svg: '<svg class="mermaid-test"><g><text>Start Node</text></g><script>malicious()</script></svg>',
      diagramType: "flowchart",
    });

    render(<MermaidBlock code="graph TD; A-->B;" />);

    await waitFor(() => {
      const figure = screen.getByRole("figure", { name: "Mermaid diagram" });
      expect(figure).toBeDefined();
      expect(figure.textContent).toContain("Start Node");
      // Script tags must be stripped by DOMPurify
      expect(figure.querySelector("script")).toBeNull();
    });
  });

  it("renders error card with expandable source when mermaid rendering fails", async () => {
    vi.spyOn(mermaid, "render").mockRejectedValueOnce(
      new Error("Parse error on line 2: Unexpected token")
    );

    render(<MermaidBlock code="invalid syntax diagram -->>" />);

    await waitFor(() => {
      expect(screen.getByRole("alert", { name: "Mermaid diagram error" })).toBeDefined();
      expect(screen.getByText("Diagram rendering failed")).toBeDefined();
      expect(screen.getByText(/Parse error on line 2/)).toBeDefined();
    });

    // Toggle source visibility
    const showBtn = screen.getByRole("button", { name: /Show source/i });
    expect(showBtn).toBeDefined();
    fireEvent.click(showBtn);

    expect(screen.getByText("invalid syntax diagram -->>")).toBeDefined();
    expect(screen.getByRole("button", { name: /Hide source/i })).toBeDefined();
  });

  it("copies diagram code when copy button is clicked in error card", async () => {
    vi.spyOn(mermaid, "render").mockRejectedValueOnce(new Error("Syntax error"));

    render(<MermaidBlock code={"flowchart LR\n A --- B"} />);

    await waitFor(() => {
      expect(screen.getByText("Diagram rendering failed")).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: /Show source/i }));

    const copyBtn = screen.getByRole("button", { name: "Copy Mermaid code" });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("flowchart LR\n A --- B");
  });
});
