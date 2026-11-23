import { useEffect, useRef, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { openSearchPanel, closeSearchPanel } from "@codemirror/search";
import { createSourceEditorExtensions } from "../SourceEditorExtensions";
import { getThemeExtension, themeCompartment } from "../SourceEditorTheme";

interface UseSourceEditorProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  content: string;
  isDark: boolean;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
}

export interface SourceEditorHandle {
  openSearch: () => void;
  closeSearch: () => void;
  scrollToRatio: (ratio: number) => void;
  getScrollRatio: () => number;
}

export function useSourceEditor({
  containerRef,
  content,
  isDark,
  onScroll,
}: UseSourceEditorProps): SourceEditorHandle {
  const viewRef = useRef<EditorView | null>(null);
  const onScrollRef = useRef(onScroll);
  onScrollRef.current = onScroll;

  // Initialize CodeMirror instance once
  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = createSourceEditorExtensions({
      isDark,
      onScroll: (top, height, client) => {
        if (onScrollRef.current) {
          onScrollRef.current(top, height, client);
        }
      },
    });

    const state = EditorState.create({
      doc: content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Only initialize on mount

  // Update content when doc changes without recreating the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== content) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: content,
        },
      });
    }
  }, [content]);

  // Update theme dynamically using Compartment
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: themeCompartment.reconfigure(getThemeExtension(isDark)),
    });
  }, [isDark]);

  const openSearch = useCallback(() => {
    if (viewRef.current) {
      openSearchPanel(viewRef.current);
    }
  }, []);

  const closeSearch = useCallback(() => {
    if (viewRef.current) {
      closeSearchPanel(viewRef.current);
    }
  }, []);

  const scrollToRatio = useCallback((ratio: number) => {
    const view = viewRef.current;
    if (!view) return;

    const scroller = view.scrollDOM;
    if (!scroller) return;

    const maxScroll = scroller.scrollHeight - scroller.clientHeight;
    if (maxScroll > 0) {
      scroller.scrollTop = Math.max(0, Math.min(ratio * maxScroll, maxScroll));
    }
  }, []);

  const getScrollRatio = useCallback((): number => {
    const view = viewRef.current;
    if (!view) return 0;

    const scroller = view.scrollDOM;
    if (!scroller) return 0;

    const maxScroll = scroller.scrollHeight - scroller.clientHeight;
    return maxScroll > 0 ? scroller.scrollTop / maxScroll : 0;
  }, []);

  return {
    openSearch,
    closeSearch,
    scrollToRatio,
    getScrollRatio,
  };
}
