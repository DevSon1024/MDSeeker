import { FileText, Eye } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useDocumentStore } from "@/stores/documentStore";
import { formatFileSize } from "@/components/workspace/EmptyWorkspace";
import { Tooltip } from "@/components/common/Tooltip";

export function StatusBar() {
  const { viewMode } = useUIStore();
  const { document } = useDocumentStore();

  const formattedMode = viewMode.charAt(0).toUpperCase() + viewMode.slice(1);

  return (
    <footer
      aria-label="Application status bar"
      className="h-[var(--fluent-statusbar-height)] flex items-center justify-between px-3 border-t border-[var(--fluent-border-divider)] bg-[var(--fluent-bg-mica)] text-[var(--fluent-text-secondary)] text-[11px] select-none flex-shrink-0"
    >
      {/* Left: Document info */}
      <div className="flex items-center gap-2 max-w-sm truncate">
        <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${document ? "text-[var(--fluent-accent)]" : "text-[var(--fluent-text-tertiary)]"}`} />
        {document ? (
          <Tooltip content={document.canonicalPath} position="top">
            <span className="font-medium text-[var(--fluent-text-primary)] truncate cursor-default">
              {document.fileName}
            </span>
          </Tooltip>
        ) : (
          <span className="text-[var(--fluent-text-tertiary)] italic">
            No document loaded
          </span>
        )}
      </div>

      {/* Right: Word count, character count, view mode, encoding */}
      <div className="flex items-center gap-3">
        {/* Document size when loaded */}
        {document && (
          <>
            <span className="font-mono text-[var(--fluent-text-secondary)]">
              {formatFileSize(document.fileSizeBytes)}
            </span>
            <div className="h-3 w-[1px] bg-[var(--fluent-border-divider)]" />
          </>
        )}

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

        {/* Encoding standard Windows defaults */}
        <div className="text-[var(--fluent-text-tertiary)]">
          UTF-8
        </div>
      </div>
    </footer>
  );
}
