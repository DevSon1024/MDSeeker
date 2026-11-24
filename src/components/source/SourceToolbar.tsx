import { useState } from "react";
import { FileCode, Lock, Copy, Check, Link2, Unlink } from "lucide-react";
import { Tooltip } from "@/components/common/Tooltip";

interface SourceToolbarProps {
  fileName?: string;
  lineCount: number;
  charCount: number;
  rawContent: string;
  showSyncToggle?: boolean;
  isSyncEnabled?: boolean;
  onToggleSync?: () => void;
}

export function SourceToolbar({
  fileName,
  lineCount,
  charCount,
  rawContent,
  showSyncToggle,
  isSyncEnabled = true,
  onToggleSync,
}: SourceToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(rawContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy source content:", err);
    }
  };

  return (
    <div
      role="toolbar"
      aria-label="Source editor toolbar"
      className="h-[34px] flex items-center justify-between px-3 border-b border-[var(--fluent-border-divider)] bg-[var(--fluent-bg-mica)] text-[11px] text-[var(--fluent-text-secondary)] select-none flex-shrink-0"
    >
      {/* Left: File, language, and read-only status */}
      <div className="flex items-center gap-2 max-w-sm truncate">
        <div className="flex items-center gap-1.5 font-medium text-[var(--fluent-text-primary)] truncate">
          <FileCode className="w-3.5 h-3.5 text-[var(--fluent-accent)] flex-shrink-0" />
          <span className="truncate">{fileName || "source.md"}</span>
        </div>

        <span className="px-1.5 py-0.5 rounded-[var(--fluent-radius-xs)] bg-[var(--fluent-bg-subtle-hover)] border border-[var(--fluent-border-subtle)] text-[10px] font-mono text-[var(--fluent-text-tertiary)]">
          Markdown
        </span>

        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--fluent-radius-xs)] bg-[var(--fluent-bg-subtle-hover)] text-[10px] font-semibold text-[var(--fluent-text-tertiary)]">
          <Lock className="w-2.5 h-2.5" />
          READ-ONLY
        </span>
      </div>

      {/* Right: Line count, Search, Sync toggle, Copy action */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-1.5 text-[var(--fluent-text-tertiary)] font-mono text-[10.5px]">
          <span>{lineCount.toLocaleString()} lines</span>
          <span>·</span>
          <span>{charCount.toLocaleString()} chars</span>
        </div>

        <div className="h-3 w-[1px] bg-[var(--fluent-border-divider)] hidden sm:block" />

        {/* Sync Scroll Toggle in Split View */}
        {showSyncToggle && onToggleSync && (
          <Tooltip
            content={isSyncEnabled ? "Disable synchronized scrolling" : "Enable synchronized scrolling"}
            position="bottom"
          >
            <button
              type="button"
              onClick={onToggleSync}
              aria-label={isSyncEnabled ? "Disable scroll sync" : "Enable scroll sync"}
              className={`p-1 rounded-[var(--fluent-radius-sm)] transition-colors ${
                isSyncEnabled
                  ? "text-[var(--fluent-accent)] bg-[var(--fluent-accent-subtle)]"
                  : "text-[var(--fluent-text-tertiary)] hover:text-[var(--fluent-text-primary)]"
              }`}
            >
              {isSyncEnabled ? <Link2 className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>
        )}

        {/* Copy All Action */}
        <Tooltip content="Copy full source to clipboard" position="bottom">
          <button
            type="button"
            onClick={handleCopyAll}
            aria-label={copied ? "Full source copied" : "Copy full source"}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--fluent-radius-sm)] border border-[var(--fluent-border-subtle)] bg-[var(--fluent-bg-card)] hover:bg-[var(--fluent-bg-subtle-hover)] text-[10.5px] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy All</span>
              </>
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
