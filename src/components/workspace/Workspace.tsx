import { useDocumentStore } from "@/stores/documentStore";
import { useUIStore } from "@/stores/uiStore";
import { EmptyWorkspace } from "./EmptyWorkspace";
import { MarkdownReader } from "@/components/markdown/MarkdownReader";
import { MarkdownSourceEditor } from "@/components/source/MarkdownSourceEditor";
import { SplitWorkspace } from "./SplitWorkspace";
import { ArrowDownToLine, AlertTriangle, X, Loader2 } from "lucide-react";

export function Workspace() {
  const { viewMode } = useUIStore();
  const {
    document,
    parsedDocument,
    isLoading,
    isParsing,
    error,
    parseError,
    isDraggingOver,
    dismissError,
  } = useDocumentStore();

  const activeError = error || parseError;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[var(--fluent-bg-window)] text-[var(--fluent-text-primary)]">
      {/* Global Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-[var(--fluent-accent)]/15 border-2 border-dashed border-[var(--fluent-accent)] backdrop-blur-sm z-50 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
          <div className="p-4 rounded-2xl bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] shadow-[var(--fluent-shadow-flyout)] flex flex-col items-center gap-2">
            <ArrowDownToLine className="w-8 h-8 text-[var(--fluent-accent)] animate-bounce" />
            <span className="text-[14px] font-semibold text-[var(--fluent-text-primary)]">
              Drop Markdown file to open
            </span>
            <span className="text-[12px] text-[var(--fluent-text-secondary)]">
              Supports .md and .markdown
            </span>
          </div>
        </div>
      )}

      {/* Floating Error Notification Banner */}
      {activeError && (
        <div className="p-4 pb-0 z-40 max-w-2xl mx-auto w-full">
          <div
            role="alert"
            className="rounded-[var(--fluent-radius-lg)] bg-rose-500/10 border border-rose-500/30 p-3.5 shadow-sm text-left flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-rose-600 dark:text-rose-400">
                  {activeError.code.replace(/_/g, " ")}
                </span>
                <button
                  type="button"
                  onClick={dismissError}
                  aria-label="Dismiss error"
                  className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 p-0.5 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[12px] text-[var(--fluent-text-primary)] font-medium">
                {activeError.message}
              </p>
              {"path" in activeError && typeof activeError.path === "string" && (
                <p className="text-[11px] text-[var(--fluent-text-secondary)] font-mono truncate max-w-md">
                  Path: {activeError.path}
                </p>
              )}
              {typeof activeError.details === "string" && (
                <p className="text-[11px] text-[var(--fluent-text-tertiary)] italic">
                  {activeError.details}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Switching Area */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[var(--fluent-accent)] animate-spin" />
          <p className="text-[13px] font-medium text-[var(--fluent-text-secondary)]">
            Reading Markdown document...
          </p>
        </div>
      ) : !document ? (
        /* Empty Workspace Welcome Screen */
        <EmptyWorkspace />
      ) : isParsing && !parsedDocument ? (
        /* Document loaded, initial AST parsing in progress */
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[var(--fluent-accent)] animate-spin" />
          <p className="text-[13px] font-medium text-[var(--fluent-text-secondary)]">
            Parsing Markdown AST...
          </p>
        </div>
      ) : (
        /* Active Document View Based on ViewMode */
        viewMode === "reading" ? (
          parsedDocument ? (
            <MarkdownReader
              document={parsedDocument}
              canonicalPath={document.canonicalPath}
              fileName={document.fileName}
            />
          ) : (
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="mb-3 text-[12px] text-amber-500 font-medium">
                Could not parse formatted AST. Displaying raw document content:
              </div>
              <pre className="flex-1 p-4 rounded-[var(--fluent-radius-md)] bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] overflow-auto font-mono text-[13px] text-[var(--fluent-text-primary)]">
                {document.rawContent}
              </pre>
            </div>
          )
        ) : viewMode === "source" ? (
          <MarkdownSourceEditor
            content={document.rawContent}
            fileName={document.fileName}
          />
        ) : (
          <SplitWorkspace
            document={document}
            parsedDocument={parsedDocument}
          />
        )
      )}
    </div>
  );
}
