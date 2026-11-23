import React, { useRef, useEffect, useCallback } from "react";
import { MarkdownDocument } from "@/types/markdown";
import { MarkdownContent } from "./MarkdownContent";
import { useDocumentStore } from "@/stores/documentStore";

interface MarkdownReaderProps {
  document: MarkdownDocument;
  canonicalPath?: string;
  fileName?: string;
}

/**
 * Polished, Windows 11 Fluent-inspired Markdown reader workspace.
 */
export const MarkdownReader: React.FC<MarkdownReaderProps> = ({
  document,
  canonicalPath,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
  const getActiveDocument = useDocumentStore((s) => s.getActiveDocument);
  const updateDocumentScrollPosition = useDocumentStore((s) => s.updateDocumentScrollPosition);

  // Restore scroll position when active document changes or on mount
  useEffect(() => {
    if (!containerRef.current || !activeDocumentId) return;
    const activeDoc = getActiveDocument();
    if (activeDoc && typeof activeDoc.readerScrollPosition === "number") {
      containerRef.current.scrollTop = activeDoc.readerScrollPosition;
    }
  }, [activeDocumentId, getActiveDocument]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !activeDocumentId) return;
    updateDocumentScrollPosition(activeDocumentId, "reader", containerRef.current.scrollTop);
  }, [activeDocumentId, updateDocumentScrollPosition]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      role="region"
      aria-label="Markdown document content"
      className="flex-1 h-full overflow-y-auto bg-[var(--fluent-bg-window)] text-[var(--fluent-text-primary)] px-6 py-8 sm:px-12 sm:py-10"
    >
      <div className="max-w-4xl mx-auto w-full">
        <MarkdownContent document={document} docPath={canonicalPath} />
      </div>
    </div>
  );
};
