import React from "react";
import { FileText, X } from "lucide-react";
import { Tooltip } from "@/components/common/Tooltip";

export interface TabItem {
  id: string;
  title: string;
  path?: string;
  isActive: boolean;
  isModified?: boolean;
}

interface DocumentTabProps {
  tab: TabItem;
  onSelect?: (id: string) => void;
  onClose?: (id: string, e: React.MouseEvent) => void;
}

export function DocumentTab({ tab, onSelect, onClose }: DocumentTabProps) {
  const content = (
    <div
      onClick={() => onSelect?.(tab.id)}
      role="tab"
      aria-selected={tab.isActive}
      className={`fluent-tab group ${tab.isActive ? "active" : ""}`}
    >
      <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${tab.isActive ? "text-[var(--fluent-accent)]" : "text-[var(--fluent-text-tertiary)]"}`} />
      
      <span className="truncate max-w-[140px] text-[12px]">
        {tab.title}
      </span>

      {tab.isModified && (
        <span
          className="w-2 h-2 rounded-full bg-[var(--fluent-accent)] flex-shrink-0"
          title="Document modified"
        />
      )}

      {onClose && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose(tab.id, e);
          }}
          aria-label={`Close ${tab.title}`}
          className="fluent-tab-close opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  if (tab.path) {
    return (
      <Tooltip content={tab.path} position="bottom">
        {content}
      </Tooltip>
    );
  }

  return content;
}
