import React from "react";
import { ListBlock as ListBlockType } from "@/types/markdown";
import { MarkdownBlock } from "../MarkdownBlock";

export const ListBlock: React.FC<{ node: ListBlockType; docPath?: string }> = ({
  node,
  docPath,
}) => {
  // Check if any items are task list items
  const hasTasks = node.items.some((item) => item.checked !== null);

  if (hasTasks) {
    return (
      <ul className="my-3 space-y-2 list-none pl-1">
        {node.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-[14px]">
            {item.checked !== null && (
              <input
                type="checkbox"
                checked={item.checked}
                readOnly
                aria-label={`Task item ${idx + 1}`}
                className="mt-1 h-4 w-4 rounded border-[var(--fluent-border-card)] accent-[var(--fluent-accent)] pointer-events-none flex-shrink-0"
              />
            )}
            <div className="flex-1 space-y-1">
              {item.content.map((child, cIdx) => (
                <MarkdownBlock key={cIdx} node={child} docPath={docPath} />
              ))}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (node.isOrdered) {
    return (
      <ol
        start={node.startNumber ?? 1}
        className={`my-3 pl-6 space-y-1.5 list-decimal text-[14px] text-[var(--fluent-text-primary)] ${
          node.isTight ? "space-y-1" : "space-y-2"
        }`}
      >
        {node.items.map((item, idx) => (
          <li key={idx} className="pl-1">
            {item.content.map((child, cIdx) => (
              <MarkdownBlock key={cIdx} node={child} docPath={docPath} />
            ))}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ul
      className={`my-3 pl-6 space-y-1.5 list-disc text-[14px] text-[var(--fluent-text-primary)] ${
        node.isTight ? "space-y-1" : "space-y-2"
      }`}
    >
      {node.items.map((item, idx) => (
        <li key={idx} className="pl-1">
          {item.content.map((child, cIdx) => (
            <MarkdownBlock key={cIdx} node={child} docPath={docPath} />
          ))}
        </li>
      ))}
    </ul>
  );
};
