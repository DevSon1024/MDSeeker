import React, { useMemo } from "react";
import katex from "katex";
import { InlineMathInline } from "@/types/markdown";
import { MathErrorFallback } from "./MathErrorFallback";

export const InlineMath: React.FC<{ node: InlineMathInline }> = ({ node }) => {
  const result = useMemo(() => {
    try {
      const html = katex.renderToString(node.math, {
        displayMode: false,
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
    return <MathErrorFallback math={node.math} error={result.error || undefined} isInline />;
  }

  return (
    <span
      className="inline-math inline px-0.5 align-baseline select-text"
      dangerouslySetInnerHTML={{ __html: result.html }}
    />
  );
};
