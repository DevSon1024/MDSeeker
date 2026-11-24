import React from "react";
import { BlockNode } from "@/types/markdown";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { ParagraphBlock } from "./blocks/ParagraphBlock";
import { BlockquoteBlock } from "./blocks/BlockquoteBlock";
import { ListBlock } from "./blocks/ListBlock";
import { CodeBlock } from "./blocks/CodeBlock";
import { TableBlock } from "./blocks/TableBlock";
import { ThematicBreakBlock } from "./blocks/ThematicBreakBlock";
import { HtmlBlock } from "./blocks/HtmlBlock";
import { FootnoteBlock } from "./blocks/FootnoteBlock";
import { BlockMath } from "./math/BlockMath";

interface MarkdownBlockProps {
  node: BlockNode;
  docPath?: string;
}

/**
 * Dispatches block-level Markdown AST nodes to their dedicated visual components.
 */
export const MarkdownBlock: React.FC<MarkdownBlockProps> = ({ node, docPath }) => {
  switch (node.type) {
    case "heading":
      return <HeadingBlock node={node} docPath={docPath} />;
    case "paragraph":
      return <ParagraphBlock node={node} docPath={docPath} />;
    case "blockquote":
      return <BlockquoteBlock node={node} docPath={docPath} />;
    case "list":
      return <ListBlock node={node} docPath={docPath} />;
    case "codeBlock":
      return <CodeBlock node={node} />;
    case "table":
      return <TableBlock node={node} docPath={docPath} />;
    case "thematicBreak":
      return <ThematicBreakBlock />;
    case "htmlBlock":
      return <HtmlBlock node={node} docPath={docPath} />;
    case "footnoteDefinition":
      return <FootnoteBlock node={node} docPath={docPath} />;
    case "blockMath":
      return <BlockMath node={node} />;
    default:
      return null;
  }
};
