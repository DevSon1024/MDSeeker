import React from "react";
import { HeadingBlock as HeadingBlockType } from "@/types/markdown";
import { MarkdownInline } from "../MarkdownInline";
import { inlinesToSlug } from "@/components/sidebar/outlineUtils";

export const HeadingBlock: React.FC<{ node: HeadingBlockType; docPath?: string }> = ({
  node,
  docPath,
}) => {
  const content = node.content.map((child, idx) => (
    <MarkdownInline key={idx} node={child} docPath={docPath} />
  ));

  const id = node.id || inlinesToSlug(node.content);

  switch (node.level) {
    case 1:
      return (
        <h1
          id={id}
          className="text-2xl font-bold tracking-tight text-[var(--fluent-text-primary)] mt-8 mb-4 pb-2 border-b border-[var(--fluent-border-divider)] first:mt-0"
        >
          {content}
        </h1>
      );
    case 2:
      return (
        <h2
          id={id}
          className="text-xl font-bold tracking-tight text-[var(--fluent-text-primary)] mt-6 mb-3 pb-1.5 border-b border-[var(--fluent-border-subtle)] first:mt-0"
        >
          {content}
        </h2>
      );
    case 3:
      return (
        <h3
          id={id}
          className="text-lg font-semibold text-[var(--fluent-text-primary)] mt-5 mb-2.5 first:mt-0"
        >
          {content}
        </h3>
      );
    case 4:
      return (
        <h4
          id={id}
          className="text-[15px] font-semibold text-[var(--fluent-text-primary)] mt-4 mb-2 first:mt-0"
        >
          {content}
        </h4>
      );
    case 5:
      return (
        <h5
          id={id}
          className="text-[13px] font-semibold text-[var(--fluent-text-primary)] mt-3 mb-1.5 first:mt-0"
        >
          {content}
        </h5>
      );
    case 6:
      return (
        <h6
          id={id}
          className="text-[12px] font-semibold uppercase tracking-wider text-[var(--fluent-text-secondary)] mt-3 mb-1 first:mt-0"
        >
          {content}
        </h6>
      );
    default:
      return (
        <h4 id={id} className="text-base font-semibold text-[var(--fluent-text-primary)] my-2">
          {content}
        </h4>
      );
  }
};
