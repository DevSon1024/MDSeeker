import React, { useMemo } from "react";
import { HtmlBlock as HtmlBlockType } from "@/types/markdown";
import { sanitizeHtml, isHtmlVisuallyEmpty } from "../utils/htmlSanitizer";
import { handleLinkClick } from "../utils/linkSafety";

interface HtmlBlockProps {
  node: HtmlBlockType;
  docPath?: string;
}

/**
 * Renders sanitized HTML blocks embedded in Markdown documents.
 * Protects against XSS, executes no scripts, and resolves local relative images.
 */
export const HtmlBlock: React.FC<HtmlBlockProps> = ({ node, docPath }) => {
  const sanitized = useMemo(() => {
    return sanitizeHtml(node.content, { docPath });
  }, [node.content, docPath]);

  if (isHtmlVisuallyEmpty(sanitized)) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (anchor) {
      const href = anchor.getAttribute("href");
      if (href) {
        handleLinkClick(e as unknown as React.MouseEvent<HTMLAnchorElement>, href);
      }
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLDivElement, Event>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      target.classList.add("mdseeker-html-img-error");
      const img = target as HTMLImageElement;
      if (!img.title) {
        img.title = `Failed to load image: ${img.getAttribute("src") || ""}`;
      }
    }
  };

  return (
    <div
      className="mdseeker-html-block my-1 text-[var(--fluent-text-primary)]"
      dangerouslySetInnerHTML={{ __html: sanitized }}
      onClick={handleClick}
      onErrorCapture={handleImageError}
    />
  );
};
