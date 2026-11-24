import React from "react";
import { InlineNode } from "@/types/markdown";
import { TextNode } from "./inline/TextNode";
import { EmphasisNode } from "./inline/EmphasisNode";
import { StrongNode } from "./inline/StrongNode";
import { StrikethroughNode } from "./inline/StrikethroughNode";
import { InlineCodeNode } from "./inline/InlineCodeNode";
import { LinkNode } from "./inline/LinkNode";
import { ImageNode } from "./inline/ImageNode";
import { BreakNode } from "./inline/BreakNode";
import { InertHtmlNode } from "./inline/InertHtmlNode";
import { InlineMath } from "./math/InlineMath";

interface MarkdownInlineProps {
  node: InlineNode;
  docPath?: string;
}

/**
 * Dispatches inline Markdown AST nodes to their corresponding semantic components.
 */
export const MarkdownInline: React.FC<MarkdownInlineProps> = ({ node, docPath }) => {
  switch (node.type) {
    case "text":
      return <TextNode node={node} />;
    case "emphasis":
      return <EmphasisNode node={node} docPath={docPath} />;
    case "strong":
      return <StrongNode node={node} docPath={docPath} />;
    case "strikethrough":
      return <StrikethroughNode node={node} docPath={docPath} />;
    case "code":
      return <InlineCodeNode node={node} />;
    case "link":
      return <LinkNode node={node} docPath={docPath} />;
    case "image":
      return <ImageNode node={node} docPath={docPath} />;
    case "softBreak":
    case "hardBreak":
      return <BreakNode node={node} />;
    case "inlineHtml":
      return <InertHtmlNode node={node} docPath={docPath} />;
    case "footnoteReference":
      return (
        <sup className="px-0.5 font-mono text-[10px] select-none">
          <a
            href={`#fn-${node.label}`}
            className="text-[var(--fluent-accent)] hover:underline"
            title={`Footnote ${node.label}`}
          >
            [{node.label}]
          </a>
        </sup>
      );
    case "inlineMath":
      return <InlineMath node={node} />;
    default:
      // Graceful fallback for unexpected or future inline variants
      return null;
  }
};
