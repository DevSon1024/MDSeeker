import React from "react";
import { LinkInline } from "@/types/markdown";
import { MarkdownInline } from "../MarkdownInline";
import { handleLinkClick, isSafeUrl } from "../utils/linkSafety";
import { ExternalLink } from "lucide-react";

export const LinkNode: React.FC<{ node: LinkInline; docPath?: string }> = ({
  node,
  docPath,
}) => {
  const safe = isSafeUrl(node.url);
  const isExternal = node.url.startsWith("http://") || node.url.startsWith("https://");
  const hasImage = node.content.some((c) => c.type === "image");

  if (!safe) {
    // Unsafe URLs (e.g. javascript:) render as disabled/inert text
    return (
      <span
        title="Unsafe link blocked"
        className="text-[var(--fluent-text-secondary)] line-through cursor-not-allowed"
      >
        {node.content.map((child, idx) => (
          <MarkdownInline key={idx} node={child} docPath={docPath} />
        ))}
      </span>
    );
  }

  return (
    <a
      href={node.url}
      title={node.title ?? node.url}
      onClick={(e) => handleLinkClick(e, node.url)}
      className="text-[var(--fluent-accent)] hover:underline font-medium cursor-pointer inline-flex items-center gap-0.5 transition-colors"
    >
      <span>
        {node.content.map((child, idx) => (
          <MarkdownInline key={idx} node={child} docPath={docPath} />
        ))}
      </span>
      {isExternal && !hasImage && <ExternalLink className="w-3 h-3 opacity-70 inline flex-shrink-0" />}
    </a>
  );
};
