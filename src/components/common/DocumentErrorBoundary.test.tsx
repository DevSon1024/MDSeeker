import { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DocumentErrorBoundary } from "./DocumentErrorBoundary";
import { useDocumentStore } from "@/stores/documentStore";

// Component that throws error conditionally
function ProblematicChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Simulated Document Crash");
  }
  return <div data-testid="normal-content">Document Content OK</div>;
}

describe("DocumentErrorBoundary", () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Suppress console.error during expected boundary catch tests
    console.error = vi.fn();
    useDocumentStore.setState({
      documents: [
        {
          id: "C:/docs/error.md",
          canonicalPath: "C:/docs/error.md",
          fileName: "error.md",
          fileExtension: "md",
          fileSizeBytes: 100,
          lastModifiedTimestamp: 1000,
          rawContent: "# Error Doc",
          parsedDocument: null,
          isLoading: false,
          isParsing: false,
          error: null,
          parseError: null,
          lastAccessedAt: Date.now(),
          readerScrollPosition: 0,
          sourceScrollPosition: 0,
        },
      ],
      activeDocumentId: "C:/docs/error.md",
    });
  });

  afterEach(() => {
    cleanup();
    console.error = originalConsoleError;
  });

  it("renders normal children when no error occurs", () => {
    render(
      <DocumentErrorBoundary documentTitle="Safe Document">
        <ProblematicChild shouldThrow={false} />
      </DocumentErrorBoundary>
    );

    expect(screen.getByTestId("normal-content")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("catches child error and displays Fluent error fallback", () => {
    render(
      <DocumentErrorBoundary documentId="C:/docs/error.md" documentTitle="Broken Document">
        <ProblematicChild shouldThrow={true} />
      </DocumentErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("Unable to Display Broken Document")).toBeDefined();
    expect(screen.getByText("Simulated Document Crash")).toBeDefined();
    expect(screen.getByText("Try Again")).toBeDefined();
    expect(screen.getByText("Close Tab")).toBeDefined();
  });

  it("invokes closeDocument when Close Tab button is clicked", () => {
    const closeSpy = vi.spyOn(useDocumentStore.getState(), "closeDocument");

    render(
      <DocumentErrorBoundary documentId="C:/docs/error.md" documentTitle="Broken Document">
        <ProblematicChild shouldThrow={true} />
      </DocumentErrorBoundary>
    );

    const closeBtn = screen.getByText("Close Tab");
    fireEvent.click(closeBtn);

    expect(closeSpy).toHaveBeenCalledWith("C:/docs/error.md");
  });

  it("re-renders children when Try Again button is clicked after error resolution", () => {
    function TestWrapper() {
      const [shouldFail, setShouldFail] = useState(true);
      return (
        <div>
          <button type="button" onClick={() => setShouldFail(false)}>
            Fix Error
          </button>
          <DocumentErrorBoundary documentId="C:/docs/error.md" documentTitle="Recoverable Document">
            <ProblematicChild shouldThrow={shouldFail} />
          </DocumentErrorBoundary>
        </div>
      );
    }

    render(<TestWrapper />);

    expect(screen.getByText("Unable to Display Recoverable Document")).toBeDefined();

    // Fix the error condition in state
    fireEvent.click(screen.getByText("Fix Error"));

    // Click Try Again on error boundary to reset hasError state
    const retryBtn = screen.getByText("Try Again");
    fireEvent.click(retryBtn);

    expect(screen.getByTestId("normal-content")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("toggles technical diagnostics visibility", () => {
    render(
      <DocumentErrorBoundary documentId="C:/docs/error.md" documentTitle="Broken Document">
        <ProblematicChild shouldThrow={true} />
      </DocumentErrorBoundary>
    );

    const toggleBtn = screen.getByText("Technical Diagnostics");
    expect(screen.queryByText(/Simulated Document Crash/)).toBeDefined();

    // Initially collapsed
    fireEvent.click(toggleBtn);
    // After expanding, details stack is shown in <pre>
    const preEl = document.querySelector("pre");
    expect(preEl).not.toBeNull();
    expect(preEl?.textContent).toContain("Simulated Document Crash");
  });
});
