import React from "react";
import { FileText, X, Loader2, AlertCircle } from "lucide-react";
import { Tooltip } from "@/components/common/Tooltip";

export interface TabItem {
  id: string;
  title: string;
  path?: string;
  isActive: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  isModified?: boolean;
}

interface DocumentTabProps {
  tab: TabItem;
  onSelect?: (id: string) => void;
  onClose?: (id: string, e: React.MouseEvent) => void;
  onContextMenu?: (id: string, e: React.MouseEvent) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function DocumentTab({
  tab,
  onSelect,
  onClose,
  onContextMenu,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
}: DocumentTabProps) {
  const content = (
    <div
      onClick={() => onSelect?.(tab.id)}
      onMouseDown={(e) => {
        // Middle mouse button closes tab
        if (e.button === 1) {
          e.preventDefault();
          onClose?.(tab.id, e);
        }
      }}
      onAuxClick={(e) => {
        // Middle mouse button closes tab
        if (e.button === 1) {
          e.preventDefault();
          onClose?.(tab.id, e);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(tab.id, e);
      }}
      role="tab"
      aria-selected={tab.isActive}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`fluent-tab group cursor-default transition-all ${
        tab.isActive ? "active" : ""
      }`}
    >
      {/* Icon or Status Indicator */}
      {tab.isLoading ? (
        <Loader2 className="w-3.5 h-3.5 text-[var(--fluent-accent)] animate-spin flex-shrink-0" />
      ) : tab.hasError ? (
        <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
      ) : (
        <FileText
          className={`w-3.5 h-3.5 flex-shrink-0 ${
            tab.isActive
              ? "text-[var(--fluent-accent)]"
              : "text-[var(--fluent-text-tertiary)] group-hover:text-[var(--fluent-text-secondary)]"
          }`}
        />
      )}

      {/* Tab Title */}
      <span className="truncate max-w-[140px] text-[12px] select-none">
        {tab.title}
      </span>

      {tab.isModified && (
        <span
          className="w-2 h-2 rounded-full bg-[var(--fluent-accent)] flex-shrink-0"
          title="Document modified"
        />
      )}

      {/* Close Tab Button */}
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
