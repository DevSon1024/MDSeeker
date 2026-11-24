import React, { useRef, useEffect, useCallback } from "react";
import { MarkdownDocument } from "@/types/markdown";
import { MarkdownContent } from "./MarkdownContent";
import { useDocumentStore } from "@/stores/documentStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useUIStore } from "@/stores/uiStore";
import { ReaderSearchBar } from "@/components/reader/ReaderSearchBar";

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
  const { reader } = useSettingsStore((s) => s.settings);
  const isSearchOpen = useUIStore((s) => s.isSearchOpen);
  const toggleSearch = useUIStore((s) => s.toggleSearch);

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

  const widthClass =
    {
      narrow: "max-w-2xl",
      medium: "max-w-4xl",
      wide: "max-w-6xl",
      full: "max-w-full",
    }[reader.contentWidth] || "max-w-4xl";

  return (
    <div className="relative flex-1 h-full overflow-hidden flex flex-col">
      {/* Floating Find Bar in Reading View */}
      <ReaderSearchBar
        containerRef={containerRef}
        isOpen={isSearchOpen}
        onClose={toggleSearch}
      />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        role="region"
        aria-label="Markdown document content"
        style={{
          fontFamily: reader.fontFamily,
          fontSize: `${reader.fontSize}px`,
          lineHeight: reader.lineHeight,
          scrollBehavior: reader.smoothScrolling ? "smooth" : "auto",
          "--reader-paragraph-spacing": `${reader.paragraphSpacing}em`,
          "--reader-font-size": `${reader.fontSize}px`,
          "--reader-line-height": `${reader.lineHeight}`,
        } as React.CSSProperties}
        className="flex-1 h-full overflow-y-auto bg-[var(--fluent-bg-window)] text-[var(--fluent-text-primary)] px-6 py-8 sm:px-12 sm:py-10"
      >
        <div className={`${widthClass} mx-auto w-full transition-all duration-150`}>
          <MarkdownContent document={document} docPath={canonicalPath} />
        </div>
      </div>
    </div>
  );
};
