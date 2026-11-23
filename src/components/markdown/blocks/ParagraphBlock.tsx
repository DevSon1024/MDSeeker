import React from "react";
import { ParagraphBlock as ParagraphBlockType } from "@/types/markdown";
import { MarkdownInline } from "../MarkdownInline";

export const ParagraphBlock: React.FC<{ node: ParagraphBlockType; docPath?: string }> = ({
  node,
  docPath,
}) => {
  return (
    <p className="text-[14px] leading-relaxed mb-4 text-[var(--fluent-text-primary)] last:mb-0">
      {node.content.map((child, idx) => (
        <MarkdownInline key={idx} node={child} docPath={docPath} />
      ))}
    </p>
  );
};
