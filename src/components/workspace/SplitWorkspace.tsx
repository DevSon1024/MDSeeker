import { useState, useRef, useCallback } from "react";
import { LoadedDocument } from "@/types/document";
import { MarkdownDocument } from "@/types/markdown";
import { MarkdownContent } from "@/components/markdown/MarkdownContent";
import { MarkdownSourceEditor } from "@/components/source/MarkdownSourceEditor";
import { SourceEditorHandle } from "@/components/source/hooks/useSourceEditor";
import { AlertTriangle } from "lucide-react";

interface SplitWorkspaceProps {
  document: LoadedDocument;
  parsedDocument: MarkdownDocument | null;
}

export function SplitWorkspace({ document, parsedDocument }: SplitWorkspaceProps) {
  const [splitRatio, setSplitRatio] = useState(0.5); // 50/50 default
  const [isDragging, setIsDragging] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const readerScrollRef = useRef<HTMLDivElement>(null);
  const sourceEditorRef = useRef<SourceEditorHandle>(null);
  const isSyncingRef = useRef(false);

  // Synchronized scrolling: Reader -> Source
  const handleReaderScroll = useCallback(() => {
    if (!isSyncEnabled || isSyncingRef.current || !readerScrollRef.current) return;

    const el = readerScrollRef.current;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;

    const ratio = el.scrollTop / maxScroll;
    isSyncingRef.current = true;
    sourceEditorRef.current?.scrollToRatio(ratio);
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 40);
  }, [isSyncEnabled]);

  // Synchronized scrolling: Source -> Reader
  const handleSourceScroll = useCallback(
    (scrollTop: number, scrollHeight: number, clientHeight: number) => {
      if (!isSyncEnabled || isSyncingRef.current || !readerScrollRef.current) return;

      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 0) return;

      const ratio = scrollTop / maxScroll;
      isSyncingRef.current = true;
      const el = readerScrollRef.current;
      const targetScroll = ratio * (el.scrollHeight - el.clientHeight);
      el.scrollTop = targetScroll;
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 40);
    },
    [isSyncEnabled]
  );

  // Resizable Divider Pointer Events
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;

    // Minimum width of 280px on either side
    const minRatio = Math.max(0.2, 280 / rect.width);
    const maxRatio = Math.min(0.8, 1 - 280 / rect.width);

    const rawRatio = (e.clientX - rect.left) / rect.width;
    const clampedRatio = Math.max(minRatio, Math.min(rawRatio, maxRatio));
    setSplitRatio(clampedRatio);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if capture already lost
    }
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`flex-1 flex overflow-hidden relative w-full h-full bg-[var(--fluent-bg-window)] ${
        isDragging ? "select-none cursor-col-resize" : ""
      }`}
    >
      {/* Left Pane: Reading View */}
      <div
        style={{ width: `${splitRatio * 100}%` }}
        className="h-full overflow-hidden flex flex-col min-w-[240px] border-r border-[var(--fluent-border-divider)]"
      >
        <div
          ref={readerScrollRef}
          onScroll={handleReaderScroll}
          role="region"
          aria-label="Split reading pane"
          className="flex-1 h-full overflow-y-auto px-6 py-8"
        >
          {parsedDocument ? (
            <MarkdownContent
              document={parsedDocument}
              docPath={document.canonicalPath}
            />
          ) : (
            <div className="p-4 rounded-[var(--fluent-radius-md)] bg-rose-500/10 border border-rose-500/30 text-[12px] flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Could not parse formatted AST. Inspect raw source in the adjacent panel.</span>
            </div>
          )}
        </div>
      </div>

      {/* Center Draggable Resizer Divider */}
      <div
        onPointerDown={handlePointerDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize split panels"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            setSplitRatio((r) => Math.max(0.2, r - 0.05));
          } else if (e.key === "ArrowRight") {
            setSplitRatio((r) => Math.min(0.8, r + 0.05));
          }
        }}
        className={`w-1.5 hover:w-2 bg-[var(--fluent-border-divider)] hover:bg-[var(--fluent-accent)] transition-all cursor-col-resize select-none flex-shrink-0 z-10 flex items-center justify-center group focus:outline-none focus:ring-1 focus:ring-[var(--fluent-accent)] ${
          isDragging ? "bg-[var(--fluent-accent)] w-2" : ""
        }`}
      >
        <div className="w-0.5 h-6 bg-[var(--fluent-border-card)] group-hover:bg-white rounded-full transition-colors" />
      </div>

      {/* Right Pane: CodeMirror Source View */}
      <div
        style={{ width: `${(1 - splitRatio) * 100}%` }}
        className="h-full overflow-hidden flex flex-col min-w-[240px]"
      >
        <MarkdownSourceEditor
          ref={sourceEditorRef}
          content={document.rawContent}
          fileName={document.fileName}
          onScroll={handleSourceScroll}
          showSyncToggle={true}
          isSyncEnabled={isSyncEnabled}
          onToggleSync={() => setIsSyncEnabled(!isSyncEnabled)}
        />
      </div>
    </div>
  );
}
