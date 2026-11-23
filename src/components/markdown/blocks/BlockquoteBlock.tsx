import React from "react";
import { BlockquoteBlock as BlockquoteBlockType } from "@/types/markdown";
import { MarkdownBlock } from "../MarkdownBlock";
import { Info, Lightbulb, AlertCircle, AlertTriangle, ShieldAlert } from "lucide-react";

export const BlockquoteBlock: React.FC<{ node: BlockquoteBlockType; docPath?: string }> = ({
  node,
  docPath,
}) => {
  // GFM Admonition variations
  if (node.kind) {
    const kind = node.kind.toLowerCase();
    let config = {
      label: "NOTE",
      icon: <Info className="w-4 h-4 text-blue-500" />,
      border: "border-blue-500/40",
      bg: "bg-blue-500/5",
      text: "text-blue-600 dark:text-blue-400",
    };

    if (kind === "tip") {
      config = {
        label: "TIP",
        icon: <Lightbulb className="w-4 h-4 text-emerald-500" />,
        border: "border-emerald-500/40",
        bg: "bg-emerald-500/5",
        text: "text-emerald-600 dark:text-emerald-400",
      };
    } else if (kind === "important") {
      config = {
        label: "IMPORTANT",
        icon: <AlertCircle className="w-4 h-4 text-purple-500" />,
        border: "border-purple-500/40",
        bg: "bg-purple-500/5",
        text: "text-purple-600 dark:text-purple-400",
      };
    } else if (kind === "warning") {
      config = {
        label: "WARNING",
        icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
        border: "border-amber-500/40",
        bg: "bg-amber-500/5",
        text: "text-amber-600 dark:text-amber-400",
      };
    } else if (kind === "caution") {
      config = {
        label: "CAUTION",
        icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
        border: "border-rose-500/40",
        bg: "bg-rose-500/5",
        text: "text-rose-600 dark:text-rose-400",
      };
    }

    return (
      <div
        className={`my-4 rounded-[var(--fluent-radius-md)] border-l-4 ${config.border} ${config.bg} p-3.5 space-y-1.5`}
      >
        <div className={`flex items-center gap-1.5 font-bold text-[12px] ${config.text}`}>
          {config.icon}
          <span>{config.label}</span>
        </div>
        <div className="text-[13px] text-[var(--fluent-text-primary)]">
          {node.content.map((child, idx) => (
            <MarkdownBlock key={idx} node={child} docPath={docPath} />
          ))}
        </div>
      </div>
    );
  }

  // Standard Fluent Blockquote
  return (
    <blockquote className="my-4 pl-4 py-1 border-l-4 border-[var(--fluent-accent)] bg-[var(--fluent-bg-subtle-hover)] rounded-r-[var(--fluent-radius-md)] text-[var(--fluent-text-secondary)] italic">
      {node.content.map((child, idx) => (
        <MarkdownBlock key={idx} node={child} docPath={docPath} />
      ))}
    </blockquote>
  );
};
