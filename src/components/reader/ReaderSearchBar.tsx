import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";
import { SearchQuery, setSearchQuery, findNext, findPrevious } from "@codemirror/search";
import { EditorView } from "@codemirror/view";
import { Tooltip } from "@/components/common/Tooltip";

export interface ReaderSearchBarProps {
  containerRef?: React.RefObject<HTMLDivElement | null>;
  editorView?: EditorView | null;
  isOpen: boolean;
  onClose: () => void;
  showAdvancedOptions?: boolean;
}

const HIGHLIGHT_CLASS = "mdseeker-search-match";
const ACTIVE_CLASS = "mdseeker-search-match-active";

export const ReaderSearchBar: React.FC<ReaderSearchBarProps> = ({
  containerRef,
  editorView,
  isOpen,
  onClose,
  showAdvancedOptions = true,
}) => {
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regexp, setRegexp] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasRegexError, setHasRegexError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clears all rendered highlight markers in DOM container (Reading Mode)
  const clearReadingHighlights = useCallback(() => {
    if (!containerRef?.current) return;
    const marks = containerRef.current.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize();
      }
    });
  }, [containerRef]);

  // Highlights active match in DOM (Reading Mode)
  const highlightActiveDomMatch = (matches: Element[], activeIdx: number) => {
    matches.forEach((m, idx) => {
      if (idx === activeIdx) {
        m.classList.add(
          ACTIVE_CLASS,
          "ring-2",
          "ring-[var(--fluent-accent)]",
          "bg-amber-400",
          "dark:bg-amber-400/60"
        );
        m.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        m.classList.remove(
          ACTIVE_CLASS,
          "ring-2",
          "ring-[var(--fluent-accent)]",
          "bg-amber-400",
          "dark:bg-amber-400/60"
        );
      }
    });
  };

  const getDomMatches = useCallback((): Element[] => {
    if (!containerRef?.current) return [];
    return Array.from(containerRef.current.querySelectorAll(`.${HIGHLIGHT_CLASS}`));
  }, [containerRef]);

  // Execute DOM-based search in container (Reading Mode)
  const performReadingSearch = useCallback(
    (
      searchQuery: string,
      isCase: boolean,
      isWord: boolean,
      isRegex: boolean
    ) => {
      clearReadingHighlights();
      setHasRegexError(false);

      if (!containerRef?.current || !searchQuery.trim()) {
        setMatchCount(0);
        setCurrentIndex(0);
        return;
      }

      let regex: RegExp;
      try {
        if (isRegex) {
          regex = new RegExp(searchQuery, isCase ? "g" : "gi");
        } else {
          const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const pattern = isWord ? `\\b${escaped}\\b` : escaped;
          regex = new RegExp(pattern, isCase ? "g" : "gi");
        }
      } catch {
        setHasRegexError(true);
        setMatchCount(0);
        setCurrentIndex(0);
        return;
      }

      const root = containerRef.current;
      const matches: Element[] = [];

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          const parentTag = node.parentElement?.tagName.toLowerCase();
          if (
            parentTag === "script" ||
            parentTag === "style" ||
            parentTag === "textarea" ||
            parentTag === "input" ||
            parentTag === "mark"
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          if (!node.textContent) return NodeFilter.FILTER_SKIP;
          regex.lastIndex = 0;
          return regex.test(node.textContent)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        },
      });

      const textNodes: Text[] = [];
      let currentNode = walker.nextNode();
      while (currentNode) {
        textNodes.push(currentNode as Text);
        currentNode = walker.nextNode();
      }

      for (const textNode of textNodes) {
        const text = textNode.textContent || "";
        regex.lastIndex = 0;
        let match: RegExpExecArray | null;
        let lastIndex = 0;
        const fragment = document.createDocumentFragment();
        let hasMatchesInNode = false;

        while ((match = regex.exec(text)) !== null) {
          // Prevent infinite loop on empty match
          if (match[0].length === 0) {
            regex.lastIndex++;
            continue;
          }

          hasMatchesInNode = true;
          const matchIndex = match.index;

          if (matchIndex > lastIndex) {
            fragment.appendChild(
              document.createTextNode(text.substring(lastIndex, matchIndex))
            );
          }

          const mark = document.createElement("mark");
          mark.className = `${HIGHLIGHT_CLASS} bg-amber-300/70 dark:bg-amber-400/30 text-inherit rounded-xs px-0.5`;
          mark.textContent = match[0];
          fragment.appendChild(mark);
          matches.push(mark);

          lastIndex = matchIndex + match[0].length;
        }

        if (hasMatchesInNode) {
          if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
          }
          if (textNode.parentNode) {
            textNode.parentNode.replaceChild(fragment, textNode);
          }
        }
      }

      setMatchCount(matches.length);
      if (matches.length > 0) {
        setCurrentIndex(1);
        highlightActiveDomMatch(matches, 0);
      } else {
        setCurrentIndex(0);
      }
    },
    [containerRef, clearReadingHighlights]
  );

  // Compute current match index in CodeMirror editor
  const updateEditorIndex = useCallback(
    (qObj: SearchQuery, view: EditorView) => {
      if (!qObj.valid) {
        setCurrentIndex(0);
        return;
      }
      const cursor = qObj.getCursor(view.state.doc);
      let count = 0;
      let active = 0;
      const currentPos = view.state.selection.main.from;
      let item = cursor.next();

      while (!item.done) {
        count++;
        if (item.value.from <= currentPos && item.value.to >= currentPos) {
          active = count;
        }
        item = cursor.next();
      }

      setMatchCount(count);
      setCurrentIndex(active > 0 ? active : count > 0 ? 1 : 0);
    },
    []
  );

  // Execute CodeMirror-based search (Source Mode)
  const performEditorSearch = useCallback(
    (
      searchQuery: string,
      isCase: boolean,
      isWord: boolean,
      isRegex: boolean
    ) => {
      setHasRegexError(false);
      if (!editorView) return;

      if (!searchQuery.trim()) {
        try {
          editorView.dispatch({
            effects: setSearchQuery.of(new SearchQuery({ search: "" })),
          });
        } catch {
          // Ignored
        }
        setMatchCount(0);
        setCurrentIndex(0);
        return;
      }

      try {
        const qObj = new SearchQuery({
          search: searchQuery,
          caseSensitive: isCase,
          wholeWord: isWord,
          regexp: isRegex,
        });

        if (!qObj.valid) {
          setHasRegexError(true);
          setMatchCount(0);
          setCurrentIndex(0);
          return;
        }

        editorView.dispatch({
          effects: setSearchQuery.of(qObj),
        });

        updateEditorIndex(qObj, editorView);
      } catch {
        setHasRegexError(true);
        setMatchCount(0);
        setCurrentIndex(0);
      }
    },
    [editorView, updateEditorIndex]
  );

  // Dispatch search to whichever engine is active
  useEffect(() => {
    if (editorView) {
      performEditorSearch(query, caseSensitive, wholeWord, regexp);
    } else if (containerRef) {
      performReadingSearch(query, caseSensitive, wholeWord, regexp);
    }
  }, [
    query,
    caseSensitive,
    wholeWord,
    regexp,
    editorView,
    containerRef,
    performEditorSearch,
    performReadingSearch,
  ]);

  // Navigate Next match
  const handleNext = useCallback(() => {
    if (editorView) {
      findNext(editorView);
      try {
        const qObj = new SearchQuery({
          search: query,
          caseSensitive,
          wholeWord,
          regexp,
        });
        updateEditorIndex(qObj, editorView);
      } catch {
        // Ignored
      }
    } else {
      const matches = getDomMatches();
      if (matches.length === 0) return;
      const nextIdx = currentIndex % matches.length;
      setCurrentIndex(nextIdx + 1);
      highlightActiveDomMatch(matches, nextIdx);
    }
  }, [
    editorView,
    query,
    caseSensitive,
    wholeWord,
    regexp,
    updateEditorIndex,
    getDomMatches,
    currentIndex,
  ]);

  // Navigate Previous match
  const handlePrev = useCallback(() => {
    if (editorView) {
      findPrevious(editorView);
      try {
        const qObj = new SearchQuery({
          search: query,
          caseSensitive,
          wholeWord,
          regexp,
        });
        updateEditorIndex(qObj, editorView);
      } catch {
        // Ignored
      }
    } else {
      const matches = getDomMatches();
      if (matches.length === 0) return;
      const prevIdx = (currentIndex - 2 + matches.length) % matches.length;
      setCurrentIndex(prevIdx + 1);
      highlightActiveDomMatch(matches, prevIdx);
    }
  }, [
    editorView,
    query,
    caseSensitive,
    wholeWord,
    regexp,
    updateEditorIndex,
    getDomMatches,
    currentIndex,
  ]);

  // Focus input on open, clear highlights on close
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      if (editorView) {
        try {
          editorView.dispatch({
            effects: setSearchQuery.of(new SearchQuery({ search: "" })),
          });
        } catch {
          // Ignored
        }
      }
      clearReadingHighlights();
      setQuery("");
      setMatchCount(0);
      setCurrentIndex(0);
      setHasRegexError(false);
    }
  }, [isOpen, editorView, clearReadingHighlights]);

  // Cleanup highlights on unmount
  useEffect(() => {
    return () => {
      clearReadingHighlights();
    };
  }, [clearReadingHighlights]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Option toggle shortcuts inside input
    if (e.altKey) {
      const key = e.key.toLowerCase();
      if (key === "c") {
        e.preventDefault();
        setCaseSensitive((v) => !v);
        return;
      }
      if (key === "w") {
        e.preventDefault();
        setWholeWord((v) => !v);
        return;
      }
      if (key === "r") {
        e.preventDefault();
        setRegexp((v) => !v);
        return;
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="search"
      aria-label="Find in document"
      className="absolute top-3 right-6 z-40 max-w-[calc(100vw-32px)] flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--fluent-radius-md)] bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] shadow-[var(--fluent-shadow-flyout)] backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 select-none"
    >
      <Search className="w-3.5 h-3.5 text-[var(--fluent-text-tertiary)] flex-shrink-0" />

      {/* Search Input Box */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find in document..."
          className={`w-36 sm:w-52 bg-transparent text-[12px] text-[var(--fluent-text-primary)] placeholder-[var(--fluent-text-placeholder)] outline-none border-none py-0.5 pr-1 ${
            hasRegexError ? "text-rose-500" : ""
          }`}
        />
      </div>

      {/* Advanced Options: Case Sensitive, Whole Word, Regular Expression */}
      {showAdvancedOptions && (
        <div className="flex items-center gap-0.5 border-l border-[var(--fluent-border-subtle)] pl-1.5">
          <Tooltip content="Match Case (Alt+C)" position="bottom">
            <button
              type="button"
              aria-pressed={caseSensitive}
              aria-label="Match Case"
              onClick={() => setCaseSensitive((v) => !v)}
              className={`px-1.5 py-0.5 text-[11px] font-mono rounded-[var(--fluent-radius-xs)] transition-all ${
                caseSensitive
                  ? "bg-[var(--fluent-accent-subtle)] text-[var(--fluent-accent)] border border-[var(--fluent-accent)]/40 font-semibold"
                  : "text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] border border-transparent"
              }`}
            >
              Aa
            </button>
          </Tooltip>

          <Tooltip content="Match Whole Word (Alt+W)" position="bottom">
            <button
              type="button"
              aria-pressed={wholeWord}
              aria-label="Match Whole Word"
              onClick={() => setWholeWord((v) => !v)}
              className={`px-1.5 py-0.5 text-[11px] font-mono rounded-[var(--fluent-radius-xs)] transition-all ${
                wholeWord
                  ? "bg-[var(--fluent-accent-subtle)] text-[var(--fluent-accent)] border border-[var(--fluent-accent)]/40 font-semibold"
                  : "text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] border border-transparent"
              }`}
            >
              \b
            </button>
          </Tooltip>

          <Tooltip content="Use Regular Expression (Alt+R)" position="bottom">
            <button
              type="button"
              aria-pressed={regexp}
              aria-label="Use Regular Expression"
              onClick={() => setRegexp((v) => !v)}
              className={`px-1.5 py-0.5 text-[11px] font-mono rounded-[var(--fluent-radius-xs)] transition-all ${
                regexp
                  ? "bg-[var(--fluent-accent-subtle)] text-[var(--fluent-accent)] border border-[var(--fluent-accent)]/40 font-semibold"
                  : "text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] border border-transparent"
              }`}
            >
              .*
            </button>
          </Tooltip>
        </div>
      )}

      {/* Match Count Indicator */}
      <span className="text-[11px] font-mono text-[var(--fluent-text-secondary)] px-1 select-none whitespace-nowrap min-w-[38px] text-center">
        {hasRegexError
          ? "Invalid"
          : matchCount > 0
          ? `${currentIndex}/${matchCount}`
          : query.trim()
          ? "0/0"
          : ""}
      </span>

      {/* Match Navigation & Close Actions */}
      <div className="flex items-center gap-0.5 border-l border-[var(--fluent-border-subtle)] pl-1">
        <Tooltip content="Previous match (Shift+Enter)" position="bottom">
          <button
            type="button"
            onClick={handlePrev}
            disabled={matchCount === 0}
            aria-label="Previous match"
            title="Previous match (Shift+Enter)"
            className="p-1 rounded-[var(--fluent-radius-sm)] text-[var(--fluent-text-secondary)] hover:bg-[var(--fluent-bg-subtle-hover)] hover:text-[var(--fluent-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <Tooltip content="Next match (Enter)" position="bottom">
          <button
            type="button"
            onClick={handleNext}
            disabled={matchCount === 0}
            aria-label="Next match"
            title="Next match (Enter)"
            className="p-1 rounded-[var(--fluent-radius-sm)] text-[var(--fluent-text-secondary)] hover:bg-[var(--fluent-bg-subtle-hover)] hover:text-[var(--fluent-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <Tooltip content="Close search (Escape)" position="bottom">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            title="Close search (Escape)"
            className="p-1 rounded-[var(--fluent-radius-sm)] text-[var(--fluent-text-secondary)] hover:bg-[var(--fluent-bg-subtle-hover)] hover:text-[var(--fluent-text-primary)] transition-colors ml-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
