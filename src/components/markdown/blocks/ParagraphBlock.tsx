import React from "react";
import { ParagraphBlock as ParagraphBlockType } from "@/types/markdown";
import { MarkdownInline } from "../MarkdownInline";

export const ParagraphBlock: React.FC<{ node: ParagraphBlockType; docPath?: string }> = ({
  node,
  docPath,
}) => {
  return (
    <p
      className="text-[var(--fluent-text-primary)] last:mb-0"
      style={{
        fontSize: "var(--reader-font-size, 15px)",
        lineHeight: "var(--reader-line-height, 1.6)",
        marginBottom: "var(--reader-paragraph-spacing, 1em)",
      }}
    >
      {node.content.map((child, idx) => (
        <MarkdownInline key={idx} node={child} docPath={docPath} />
      ))}
    </p>
  );
};
