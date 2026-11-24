import { useRef, useImperativeHandle, forwardRef, useState, useEffect, useMemo, useCallback } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useDocumentStore } from "@/stores/documentStore";
import { SourceToolbar } from "./SourceToolbar";
import { useSourceEditor, SourceEditorHandle } from "./hooks/useSourceEditor";
import { ReaderSearchBar } from "@/components/reader/ReaderSearchBar";

export interface MarkdownSourceEditorProps {
  content: string;
  fileName?: string;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  showSyncToggle?: boolean;
  isSyncEnabled?: boolean;
  onToggleSync?: () => void;
}

export const MarkdownSourceEditor = forwardRef<SourceEditorHandle, MarkdownSourceEditorProps>(
  function MarkdownSourceEditor(
    {
      content,
      fileName,
      onScroll,
      showSyncToggle,
      isSyncEnabled,
      onToggleSync,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useUIStore();

    // Check system preference dynamically
    const [isDark, setIsDark] = useState(() => {
      if (typeof document === "undefined") return false;
      if (theme === "dark") return true;
      if (theme === "light") return false;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    useEffect(() => {
      if (theme === "dark") {
        setIsDark(true);
      } else if (theme === "light") {
        setIsDark(false);
      } else {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        setIsDark(media.matches);
        const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
      }
    }, [theme]);

    const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
    const getActiveDocument = useDocumentStore((s) => s.getActiveDocument);
    const updateDocumentScrollPosition = useDocumentStore((s) => s.updateDocumentScrollPosition);
    const isSearchOpen = useUIStore((s) => s.isSearchOpen);
    const toggleSearch = useUIStore((s) => s.toggleSearch);

    const handleScroll = useCallback(
      (scrollTop: number, scrollHeight: number, clientHeight: number) => {
        if (activeDocumentId) {
          updateDocumentScrollPosition(activeDocumentId, "source", scrollTop);
        }
        if (onScroll) {
          onScroll(scrollTop, scrollHeight, clientHeight);
        }
      },
      [activeDocumentId, updateDocumentScrollPosition, onScroll]
    );

    const handle = useSourceEditor({
      containerRef,
      content,
      isDark,
      onScroll: handleScroll,
    });

    useImperativeHandle(ref, () => handle, [handle]);

    // Restore scroll position when active document changes or on mount
    useEffect(() => {
      if (!activeDocumentId) return;
      const activeDoc = getActiveDocument();
      if (activeDoc && typeof activeDoc.sourceScrollPosition === "number") {
        handle.scrollToPosition(activeDoc.sourceScrollPosition);
      }
    }, [activeDocumentId, getActiveDocument, handle]);

    const lineCount = useMemo(() => {
      return content.length === 0 ? 0 : content.split("\n").length;
    }, [content]);

    return (
      <div
        role="region"
        aria-label="Markdown source inspection viewer"
        className="flex-1 flex flex-col h-full w-full overflow-hidden bg-[var(--fluent-bg-window)] select-text relative"
      >
        {/* Contextual Source Toolbar */}
        <SourceToolbar
          fileName={fileName}
          lineCount={lineCount}
          charCount={content.length}
          rawContent={content}
          showSyncToggle={showSyncToggle}
          isSyncEnabled={isSyncEnabled}
          onToggleSync={onToggleSync}
        />

        {/* Source Mode Floating Search Bar */}
        <div className="relative flex-1 h-full overflow-hidden">
          <ReaderSearchBar
            editorView={handle.getView()}
            isOpen={isSearchOpen}
            onClose={toggleSearch}
            showAdvancedOptions={true}
          />

          {/* CodeMirror Mounting Container */}
          <div
            ref={containerRef}
            className="w-full h-full overflow-hidden cursor-text font-mono"
          />
        </div>
      </div>
    );
  }
);
