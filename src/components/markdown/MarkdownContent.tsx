import React, { useState } from "react";
import { MarkdownDocument } from "@/types/markdown";
import { MarkdownBlock } from "./MarkdownBlock";
import { ChevronDown, ChevronRight, Tag } from "lucide-react";

interface MarkdownContentProps {
  document: MarkdownDocument;
  docPath?: string;
}

/**
 * Renders the full collection of block nodes in a Markdown document.
 */
export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  document,
  docPath,
}) => {
  const [showFrontmatter, setShowFrontmatter] = useState(false);
  const { blocks, metadata } = document;

  return (
    <article className="prose-container w-full space-y-1">
      {/* Optional Frontmatter Disclosure Card */}
      {metadata.frontmatter && (
        <div className="mb-6 rounded-[var(--fluent-radius-md)] border border-[var(--fluent-border-card)] bg-[var(--fluent-bg-card)] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowFrontmatter(!showFrontmatter)}
            className="w-full flex items-center justify-between px-3.5 py-2 text-[12px] font-medium text-[var(--fluent-text-secondary)] hover:bg-[var(--fluent-bg-subtle-hover)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[var(--fluent-accent)]" />
              <span>Document Metadata (Frontmatter)</span>
            </div>
            {showFrontmatter ? (
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 opacity-70" />
            )}
          </button>

          {showFrontmatter && (
            <pre className="p-3.5 text-[11px] font-mono text-[var(--fluent-text-secondary)] bg-[var(--fluent-bg-subtle-hover)] border-t border-[var(--fluent-border-subtle)] overflow-x-auto whitespace-pre">
              {metadata.frontmatter}
            </pre>
          )}
        </div>
      )}

      {/* Render All Document Blocks */}
      {blocks.map((block, idx) => (
        <MarkdownBlock key={idx} node={block} docPath={docPath} />
      ))}
    </article>
  );
};
