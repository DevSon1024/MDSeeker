import React from "react";
import { EmphasisInline } from "@/types/markdown";
import { MarkdownInline } from "../MarkdownInline";

export const EmphasisNode: React.FC<{ node: EmphasisInline; docPath?: string }> = ({
  node,
  docPath,
}) => {
  return (
    <em className="italic">
      {node.content.map((child, idx) => (
        <MarkdownInline key={idx} node={child} docPath={docPath} />
      ))}
    </em>
  );
};
