import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { InlineMath } from "./InlineMath";
import { BlockMath } from "./BlockMath";
import { MathErrorFallback } from "./MathErrorFallback";

describe("KaTeX Math Rendering Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders valid inline mathematical expression using KaTeX", () => {
    const { container } = render(
      <InlineMath node={{ type: "inlineMath", math: "E = mc^2" }} />
    );

    const katexEl = container.querySelector(".katex");
    expect(katexEl).not.toBeNull();
    expect(container.textContent).toContain("E=mc");
  });

  it("renders valid block mathematical expression in display mode", () => {
    render(
      <BlockMath node={{ type: "blockMath", math: "\\frac{1}{2} + \\frac{1}{3}" }} />
    );

    const region = screen.getByRole("region", { name: "Mathematical expression" });
    expect(region).toBeDefined();
    expect(region.querySelector(".katex-display")).not.toBeNull();
  });

  it("gracefully catches invalid LaTeX in inline math and renders fallback", () => {
    render(
      <InlineMath node={{ type: "inlineMath", math: "\\invalidCommand{xyz" }} />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(alert.textContent).toContain("$\\invalidCommand{xyz$");
  });

  it("gracefully catches invalid LaTeX in block math and preserves source", () => {
    render(
      <BlockMath node={{ type: "blockMath", math: "\\begin{matrix} unclosed" }} />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(screen.getByText("Math Expression Error")).toBeDefined();
    expect(alert.textContent).toContain("$$\\begin{matrix} unclosed$$");
  });

  it("MathErrorFallback renders inline and block variants with error details", () => {
    const { rerender } = render(
      <MathErrorFallback math="x^2" error="Unknown token" isInline />
    );
    expect(screen.getByRole("alert").textContent).toBe("$x^2$");

    rerender(
      <MathErrorFallback math="x^2" error="Unknown token" isInline={false} />
    );
    expect(screen.getByText("Math Expression Error")).toBeDefined();
    expect(screen.getByText("Unknown token")).toBeDefined();
  });
});
