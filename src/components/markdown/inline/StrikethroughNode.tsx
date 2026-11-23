import React from "react";
import { StrikethroughInline } from "@/types/markdown";
import { MarkdownInline } from "../MarkdownInline";

export const StrikethroughNode: React.FC<{ node: StrikethroughInline; docPath?: string }> = ({
  node,
  docPath,
}) => {
  return (
    <del className="line-through opacity-75">
      {node.content.map((child, idx) => (
        <MarkdownInline key={idx} node={child} docPath={docPath} />
      ))}
    </del>
  );
};
