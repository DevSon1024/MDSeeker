import { useState } from "react";
import { FileText, FolderOpen, ArrowDownToLine, Command, Sparkles } from "lucide-react";

export function EmptyWorkspace() {
  const [showNotice, setShowNotice] = useState(false);

  const handleOpenClick = () => {
    // Clearly indicate placeholder without simulating fake document opening
    setShowNotice(true);
    setTimeout(() => setShowNotice(false), 3500);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[var(--fluent-bg-window)] text-[var(--fluent-text-primary)] select-none overflow-y-auto">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
        {/* App Logo Emblem */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] shadow-[var(--fluent-shadow-card)] flex items-center justify-center text-[var(--fluent-accent)]">
            <FileText className="w-10 h-10 stroke-[1.5]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--fluent-accent)] text-[var(--fluent-accent-text)] flex items-center justify-center shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Welcome Heading & Description */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--fluent-text-primary)]">
            MDSeeker
          </h1>
          <p className="text-[13px] text-[var(--fluent-text-secondary)] leading-normal max-w-sm">
            A lightweight, Windows-first Markdown viewer engineered with Rust and Tauri for high performance and clarity.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col items-center gap-2 w-full pt-1">
          <button
            type="button"
            onClick={handleOpenClick}
            className="fluent-primary-btn w-full max-w-xs justify-center py-2.5 text-[13px]"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open Markdown File</span>
          </button>

          {showNotice && (
            <div className="text-[11px] text-[var(--fluent-accent)] font-medium bg-[var(--fluent-accent-subtle)] px-3 py-1.5 rounded-[var(--fluent-radius-md)] border border-[var(--fluent-accent)]/20 animate-in fade-in duration-150">
              Document loading will be enabled in Phase 03: Rust File Management
            </div>
          )}
        </div>

        {/* Drag and Drop Visual Hint */}
        <div className="w-full max-w-xs border border-dashed border-[var(--fluent-border-divider)] rounded-[var(--fluent-radius-lg)] p-4 flex flex-col items-center justify-center gap-2 bg-[var(--fluent-bg-subtle-hover)] text-[var(--fluent-text-secondary)]">
          <ArrowDownToLine className="w-5 h-5 text-[var(--fluent-text-tertiary)]" />
          <span className="text-[12px]">or drag and drop files anywhere</span>
        </div>

        {/* Supported Extension Badges & Keyboard Shortcut Hints */}
        <div className="pt-2 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[var(--fluent-text-tertiary)] mr-1">Supported:</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-[var(--fluent-radius-sm)] bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] text-[var(--fluent-text-secondary)]">
              .md
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-[var(--fluent-radius-sm)] bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] text-[var(--fluent-text-secondary)]">
              .markdown
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[var(--fluent-text-tertiary)]">
            <Command className="w-3 h-3" />
            <span>Ctrl+O to open · Ctrl+W to close tab · Ctrl+1/2/3 to switch modes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
