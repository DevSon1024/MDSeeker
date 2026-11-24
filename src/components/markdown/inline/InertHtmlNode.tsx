import React, { useMemo } from "react";
import { InlineHtmlInline } from "@/types/markdown";
import { sanitizeHtml, isHtmlVisuallyEmpty } from "../utils/htmlSanitizer";
import { handleLinkClick } from "../utils/linkSafety";

interface HtmlInlineProps {
  node: InlineHtmlInline;
  docPath?: string;
}

/**
 * Renders sanitized inline HTML tags (e.g. <kbd>, <code>, <span>, <sub>, <sup>, <img>, <a>).
 * Protects against XSS, executes no scripts, and resolves local relative images.
 */
export const HtmlInlineNode: React.FC<HtmlInlineProps> = ({ node, docPath }) => {
  const sanitized = useMemo(() => {
    return sanitizeHtml(node.content, { docPath, isInline: true });
  }, [node.content, docPath]);

  if (isHtmlVisuallyEmpty(sanitized)) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (anchor) {
      const href = anchor.getAttribute("href");
      if (href) {
        handleLinkClick(e as unknown as React.MouseEvent<HTMLAnchorElement>, href);
      }
    }
  };

  return (
    <span
      className="mdseeker-html-inline"
      dangerouslySetInnerHTML={{ __html: sanitized }}
      onClick={handleClick}
    />
  );
};

// Backward-compatible alias
export const InertHtmlNode = HtmlInlineNode;
