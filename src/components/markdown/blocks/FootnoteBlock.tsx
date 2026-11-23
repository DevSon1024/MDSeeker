import React from "react";
import { FootnoteDefinitionBlock as FootnoteDefinitionBlockType } from "@/types/markdown";
import { MarkdownBlock } from "../MarkdownBlock";

export const FootnoteBlock: React.FC<{
  node: FootnoteDefinitionBlockType;
  docPath?: string;
}> = ({ node, docPath }) => {
  return (
    <div
      id={`fn-${node.label}`}
      className="my-2.5 text-[12px] text-[var(--fluent-text-secondary)] pl-3 border-l-2 border-[var(--fluent-border-divider)]"
    >
      <span className="font-mono font-bold text-[var(--fluent-accent)] mr-1.5">
        [{node.label}]:
      </span>
      <div className="inline">
        {node.content.map((child, idx) => (
          <MarkdownBlock key={idx} node={child} docPath={docPath} />
        ))}
      </div>
    </div>
  );
};
