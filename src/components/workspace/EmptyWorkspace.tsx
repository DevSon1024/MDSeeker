import { FileText, FolderOpen, ArrowDownToLine, Command, Sparkles, CheckCircle2, AlertTriangle, X, Loader2, Code2, ListTree } from "lucide-react";
import { useDocumentStore } from "@/stores/documentStore";

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function EmptyWorkspace() {
  const {
    document,
    parsedDocument,
    isLoading,
    isParsing,
    error,
    parseError,
    isDraggingOver,
    openDocumentDialog,
    closeDocument,
    dismissError,
  } = useDocumentStore();

  const activeError = error || parseError;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[var(--fluent-bg-window)] text-[var(--fluent-text-primary)] select-none overflow-y-auto relative">
      {/* Drag & Drop Visual Overlay */}
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

      {/* Error Presentation Banner */}
      {activeError && (
        <div
          role="alert"
          className="mb-6 max-w-lg w-full rounded-[var(--fluent-radius-lg)] bg-rose-500/10 border border-rose-500/30 p-3.5 shadow-sm text-left flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-150"
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
      )}

      {/* Loading State Indicator */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[var(--fluent-accent)] animate-spin" />
          <p className="text-[13px] font-medium text-[var(--fluent-text-secondary)]">
            Reading Markdown document...
          </p>
        </div>
      ) : document ? (
        /* Loaded Document Information Card */
        <div className="max-w-lg w-full flex flex-col items-center text-center space-y-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] shadow-[var(--fluent-shadow-card)] flex items-center justify-center text-[var(--fluent-accent)]">
              <FileText className="w-10 h-10 stroke-[1.5]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1 w-full">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium mb-1">
              Document Loaded Successfully
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--fluent-text-primary)] truncate max-w-md mx-auto" title={document.fileName}>
              {document.fileName}
            </h1>
            {parsedDocument?.metadata?.title && parsedDocument.metadata.title !== document.fileName && (
              <p className="text-[13px] font-medium text-[var(--fluent-text-secondary)] truncate max-w-md mx-auto">
                {parsedDocument.metadata.title}
              </p>
            )}
            <p className="text-[11px] text-[var(--fluent-text-tertiary)] font-mono truncate max-w-md mx-auto" title={document.canonicalPath}>
              {document.canonicalPath}
            </p>
          </div>

          {/* Document Properties Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-left bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] rounded-[var(--fluent-radius-lg)] p-3 text-[12px] shadow-sm">
            <div>
              <span className="text-[10px] text-[var(--fluent-text-tertiary)] block">File Size</span>
              <span className="font-medium text-[var(--fluent-text-primary)]">
                {formatFileSize(document.fileSizeBytes)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--fluent-text-tertiary)] block">Format</span>
              <span className="font-medium text-[var(--fluent-text-primary)] uppercase">
                .{document.fileExtension} (UTF-8)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--fluent-text-tertiary)] block">AST Blocks</span>
              <span className="font-medium text-[var(--fluent-text-primary)]">
                {isParsing ? "Parsing..." : (parsedDocument ? `${parsedDocument.blocks.length} blocks` : "—")}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--fluent-text-tertiary)] block">Word Count</span>
              <span className="font-medium text-[var(--fluent-text-primary)]">
                {parsedDocument ? `${parsedDocument.metadata.wordCount.toLocaleString()}` : "—"}
              </span>
            </div>
          </div>

          {/* AST Capabilities & Features Status */}
          {parsedDocument && (
            <div className="w-full flex items-center justify-center gap-1.5 flex-wrap text-[11px]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] text-[var(--fluent-text-secondary)]">
                <ListTree className="w-3 h-3 text-[var(--fluent-accent)]" />
                {parsedDocument.metadata.headingsCount} Headings
              </span>
              {parsedDocument.metadata.hasTables && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] text-[var(--fluent-text-secondary)]">
                  Tables
                </span>
              )}
              {parsedDocument.metadata.hasCodeBlocks && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] text-[var(--fluent-text-secondary)]">
                  <Code2 className="w-3 h-3 text-[var(--fluent-accent)]" />
                  Code Blocks
                </span>
              )}
              {parsedDocument.metadata.hasMermaid && (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400">
                  Mermaid
                </span>
              )}
              {parsedDocument.metadata.hasTaskLists && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] text-[var(--fluent-text-secondary)]">
                  Task Lists
                </span>
              )}
              {parsedDocument.metadata.frontmatter && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] text-[var(--fluent-text-secondary)]">
                  Frontmatter
                </span>
              )}
            </div>
          )}

          {/* Notice about rendering */}
          <div className="text-[11px] text-[var(--fluent-text-secondary)] bg-[var(--fluent-bg-subtle-hover)] border border-[var(--fluent-border-subtle)] rounded-[var(--fluent-radius-md)] px-3.5 py-2 max-w-sm">
            {isParsing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--fluent-accent)]" />
                <span>Parsing AST via Rust pulldown-cmark engine...</span>
              </div>
            ) : parsedDocument ? (
              <span>
                Structured AST ready ({parsedDocument.parserVersion}). Formatted CommonMark visual reader will be implemented in Phase 05.
              </span>
            ) : (
              <span>
                Raw file loaded ({document.rawContent.length} chars). Ready for parsing.
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={openDocumentDialog}
              className="fluent-primary-btn text-[12px] py-2 px-3.5"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Open Another (Ctrl+O)</span>
            </button>
            <button
              type="button"
              onClick={closeDocument}
              className="fluent-icon-btn border border-[var(--fluent-border-card)] bg-[var(--fluent-bg-card)] hover:bg-[var(--fluent-bg-subtle-hover)] text-[12px] py-2 px-3.5 rounded-[var(--fluent-radius-md)]"
            >
              <X className="w-3.5 h-3.5 text-rose-500 mr-1" />
              <span>Close (Ctrl+W)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty Workspace Welcome Screen */
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
              onClick={openDocumentDialog}
              className="fluent-primary-btn w-full max-w-xs justify-center py-2.5 text-[13px]"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Open Markdown File</span>
            </button>
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
              <span>Ctrl+O to open · Ctrl+W to close · Ctrl+1/2/3 to switch modes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
