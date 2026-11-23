import React, { useMemo } from "react";
import katex from "katex";
import { BlockMathBlock } from "@/types/markdown";
import { MathErrorFallback } from "./MathErrorFallback";

export const BlockMath: React.FC<{ node: BlockMathBlock }> = ({ node }) => {
  const result = useMemo(() => {
    try {
      const html = katex.renderToString(node.math, {
        displayMode: true,
        throwOnError: true,
        trust: false,
      });
      return { html, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { html: null, error: msg };
    }
  }, [node.math]);

  if (result.error || !result.html) {
    return <MathErrorFallback math={node.math} error={result.error || undefined} isInline={false} />;
  }

  return (
    <div
      role="region"
      aria-label="Mathematical expression"
      className="block-math my-4 py-2 px-4 overflow-x-auto text-center rounded-[var(--fluent-radius-md)] bg-[var(--fluent-bg-subtle-hover)] border border-[var(--fluent-border-subtle)] select-text"
      dangerouslySetInnerHTML={{ __html: result.html }}
    />
  );
};
