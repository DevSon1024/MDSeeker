import React from "react";
import { StrongInline } from "@/types/markdown";
import { MarkdownInline } from "../MarkdownInline";

export const StrongNode: React.FC<{ node: StrongInline; docPath?: string }> = ({
  node,
  docPath,
}) => {
  return (
    <strong className="font-semibold text-[var(--fluent-text-primary)]">
      {node.content.map((child, idx) => (
        <MarkdownInline key={idx} node={child} docPath={docPath} />
      ))}
    </strong>
  );
};
