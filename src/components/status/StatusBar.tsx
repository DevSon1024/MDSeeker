import { FileText, Eye } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

export function StatusBar() {
  const { viewMode } = useUIStore();

  const formattedMode = viewMode.charAt(0).toUpperCase() + viewMode.slice(1);

  return (
    <footer
      aria-label="Application status bar"
      className="h-[var(--fluent-statusbar-height)] flex items-center justify-between px-3 border-t border-[var(--fluent-border-divider)] bg-[var(--fluent-bg-mica)] text-[var(--fluent-text-secondary)] text-[11px] select-none flex-shrink-0"
    >
      {/* Left: Document info placeholder */}
      <div className="flex items-center gap-2">
        <FileText className="w-3.5 h-3.5 text-[var(--fluent-text-tertiary)]" />
        <span className="text-[var(--fluent-text-tertiary)] italic">
          No document loaded
        </span>
      </div>

      {/* Right: Word count, character count, view mode, encoding */}
      <div className="flex items-center gap-3">
        {/* Statistics placeholders clearly distinguishing unavailable data */}
        <div className="hidden sm:flex items-center gap-2 text-[var(--fluent-text-tertiary)]">
          <span>— words</span>
          <span>·</span>
          <span>— characters</span>
          <span>·</span>
          <span>— min read</span>
        </div>

        <div className="h-3 w-[1px] bg-[var(--fluent-border-divider)] hidden sm:block" />

        {/* View Mode Indicator */}
        <div className="flex items-center gap-1.5 font-medium text-[var(--fluent-text-secondary)]">
          <Eye className="w-3 h-3 text-[var(--fluent-accent)]" />
          <span>{formattedMode} Mode</span>
        </div>

        <div className="h-3 w-[1px] bg-[var(--fluent-border-divider)]" />

        {/* Encoding / Line endings standard Windows defaults */}
        <div className="text-[var(--fluent-text-tertiary)]">
          UTF-8
        </div>
      </div>
    </footer>
  );
}
