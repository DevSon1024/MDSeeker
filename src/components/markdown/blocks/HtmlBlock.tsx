import React from "react";
import { HtmlBlock as HtmlBlockType } from "@/types/markdown";

/**
 * Inert representation of raw HTML blocks.
 * Never executes scripts or uses dangerouslySetInnerHTML.
 */
export const HtmlBlock: React.FC<{ node: HtmlBlockType }> = ({ node }) => {
  return (
    <div
      title="Inert HTML Block"
      className="my-3 p-3 rounded-[var(--fluent-radius-md)] bg-[var(--fluent-bg-subtle-hover)] border border-[var(--fluent-border-subtle)] font-mono text-[11px] text-[var(--fluent-text-tertiary)] overflow-x-auto whitespace-pre-wrap select-text"
    >
      {node.content}
    </div>
  );
};
