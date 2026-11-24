import React, { useMemo, useState } from "react";
import { MarkdownDocument } from "@/types/markdown";
import { MarkdownBlock } from "./MarkdownBlock";
import { ChevronDown, ChevronRight, Tag } from "lucide-react";
import { groupMarkdownBlocks, GroupedItem } from "./utils/htmlBlockGrouper";
import { sanitizeHtml } from "./utils/htmlSanitizer";

interface MarkdownContentProps {
  document: MarkdownDocument;
  docPath?: string;
}

/**
 * Recursively renders an individual block or an HTML container wrapping multiple blocks.
 */
const GroupedItemRenderer: React.FC<{
  item: GroupedItem;
  docPath?: string;
}> = ({ item, docPath }) => {
  if (item.type === "block") {
    return <MarkdownBlock node={item.block} docPath={docPath} />;
  }

  if (item.tag === "details") {
    const cleanSummary = item.summaryHtml
      ? sanitizeHtml(item.summaryHtml, { docPath, isInline: true })
      : "Details";

    return (
      <details className="mdseeker-html-details my-3">
        <summary
          className="cursor-pointer font-medium text-[var(--fluent-text-primary)]"
          dangerouslySetInnerHTML={{ __html: cleanSummary }}
        />
        <div className="mdseeker-details-content space-y-1">
          {item.children.map((child, idx) => (
            <GroupedItemRenderer key={idx} item={child} docPath={docPath} />
          ))}
        </div>
      </details>
    );
  }

  const isCentered = item.align === "center" || item.tag === "center";
  const isRight = item.align === "right";

  return (
    <div
      className={`w-full my-2 ${isCentered ? "text-center" : isRight ? "text-right" : ""}`}
      style={{
        textAlign: isCentered ? "center" : isRight ? "right" : undefined,
      }}
    >
      {item.children.map((child, idx) => (
        <GroupedItemRenderer key={idx} item={child} docPath={docPath} />
      ))}
    </div>
  );
};

/**
 * Renders the full collection of block nodes in a Markdown document.
 * Automatically wraps content enclosed by HTML container blocks (e.g. details, div, center).
 */
export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  document,
  docPath,
}) => {
  const [showFrontmatter, setShowFrontmatter] = useState(false);
  const { blocks, metadata } = document;

  const grouped = useMemo(() => {
    return groupMarkdownBlocks(blocks);
  }, [blocks]);

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

      {/* Render All Document Blocks and HTML Containers */}
      {grouped.map((item, idx) => (
        <GroupedItemRenderer key={idx} item={item} docPath={docPath} />
      ))}
    </article>
  );
};
