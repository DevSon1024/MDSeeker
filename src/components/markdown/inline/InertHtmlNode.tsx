import React from "react";
import { InlineHtmlInline } from "@/types/markdown";

/**
 * Renders raw inline HTML tags as safe, inert text.
 * Never executes scripts or uses dangerouslySetInnerHTML.
 */
export const InertHtmlNode: React.FC<{ node: InlineHtmlInline }> = ({ node }) => {
  return (
    <span
      title="Inert HTML snippet"
      className="font-mono text-[11px] text-[var(--fluent-text-tertiary)] bg-[var(--fluent-bg-subtle-hover)] px-1 py-0.5 rounded"
    >
      {node.content}
    </span>
  );
};
