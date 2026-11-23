import React from "react";
import { MarkdownDocument } from "@/types/markdown";
import { MarkdownContent } from "./MarkdownContent";

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
  return (
    <div
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
