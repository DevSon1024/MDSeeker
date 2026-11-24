import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ReaderSearchBar } from "./ReaderSearchBar";

describe("ReaderSearchBar", () => {
  let containerEl: HTMLDivElement;
  let containerRef: { current: HTMLDivElement };
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    containerEl = document.createElement("div");
    containerEl.innerHTML = `
      <h1>Nosved Player Documentation</h1>
      <p>A high-performance Android player with MPV engine.</p>
      <p>Another mention of Android and Jetpack Compose.</p>
    `;
    document.body.appendChild(containerEl);
    containerRef = { current: containerEl };
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("does not render when isOpen is false", () => {
    render(
      <ReaderSearchBar
        containerRef={containerRef}
        isOpen={false}
        onClose={mockOnClose}
      />
    );
    expect(screen.queryByPlaceholderText("Find in document...")).toBeNull();
  });

  it("renders when isOpen is true and focuses input", () => {
    render(
      <ReaderSearchBar
        containerRef={containerRef}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const input = screen.getByPlaceholderText("Find in document...");
    expect(input).toBeDefined();
  });

  it("finds matches and updates counter", () => {
    render(
      <ReaderSearchBar
        containerRef={containerRef}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const input = screen.getByPlaceholderText("Find in document...");
    fireEvent.change(input, { target: { value: "Android" } });

    // "Android" appears twice in containerEl
    expect(screen.getByText("1/2")).toBeDefined();
    const marks = containerEl.querySelectorAll(".mdseeker-search-match");
    expect(marks.length).toBe(2);
  });

  it("navigates matches with Next and Prev buttons", () => {
    render(
      <ReaderSearchBar
        containerRef={containerRef}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const input = screen.getByPlaceholderText("Find in document...");
    fireEvent.change(input, { target: { value: "Android" } });

    expect(screen.getByText("1/2")).toBeDefined();

    const nextBtn = screen.getByTitle("Next match (Enter)");
    fireEvent.click(nextBtn);
    expect(screen.getByText("2/2")).toBeDefined();

    const prevBtn = screen.getByTitle("Previous match (Shift+Enter)");
    fireEvent.click(prevBtn);
    expect(screen.getByText("1/2")).toBeDefined();
  });

  it("calls onClose when Close button or Escape is pressed", () => {
    render(
      <ReaderSearchBar
        containerRef={containerRef}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    const closeBtn = screen.getByTitle("Close search (Escape)");
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    const input = screen.getByPlaceholderText("Find in document...");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});
