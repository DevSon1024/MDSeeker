import React, { useState } from "react";
import { ImageInline } from "@/types/markdown";
import { isSafeImageUrl, resolveImageUrl } from "../utils/imageSafety";
import { ImageOff } from "lucide-react";

export const ImageNode: React.FC<{ node: ImageInline; docPath?: string }> = ({
  node,
  docPath,
}) => {
  const [hasError, setHasError] = useState(false);
  const safe = isSafeImageUrl(node.url);
  const resolvedSrc = safe ? resolveImageUrl(node.url, docPath) : "";

  if (!safe || hasError || !resolvedSrc) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 my-1.5 rounded-[var(--fluent-radius-md)] bg-[var(--fluent-bg-subtle-hover)] border border-dashed border-[var(--fluent-border-card)] text-[12px] text-[var(--fluent-text-secondary)] max-w-md">
        <ImageOff className="w-4 h-4 text-[var(--fluent-text-tertiary)] flex-shrink-0" />
        <span className="truncate" title={node.url}>
          {node.alt || "Image unavailable"}: <span className="font-mono text-[11px] opacity-75">{node.url}</span>
        </span>
      </span>
    );
  }

  return (
    <span className="my-3 inline-block max-w-full">
      <img
        src={resolvedSrc}
        alt={node.alt}
        title={node.title ?? undefined}
        onError={() => setHasError(true)}
        loading="lazy"
        className="max-w-full h-auto rounded-[var(--fluent-radius-md)] border border-[var(--fluent-border-card)] shadow-sm object-contain max-h-[520px]"
      />
      {node.title && (
        <span className="block text-center text-[11px] text-[var(--fluent-text-tertiary)] italic mt-1">
          {node.title}
        </span>
      )}
    </span>
  );
};
