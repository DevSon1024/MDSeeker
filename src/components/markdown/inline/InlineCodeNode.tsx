import React from "react";
import { CodeInline } from "@/types/markdown";

export const InlineCodeNode: React.FC<{ node: CodeInline }> = ({ node }) => {
  return (
    <code className="px-1.5 py-0.5 rounded-[var(--fluent-radius-sm)] bg-[var(--fluent-bg-subtle-active)] text-[var(--fluent-accent)] font-mono text-[12px] border border-[var(--fluent-border-subtle)] align-baseline">
      {node.code}
    </code>
  );
};
