import { useState, useMemo, useEffect } from "react";
import { ListTree, X, FileQuestion, Hash } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useDocumentStore } from "@/stores/documentStore";
import { IconButton } from "@/components/common/IconButton";
import { extractOutline, OutlineHeading } from "./outlineUtils";

export function OutlineSidebar() {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const { parsedDocument } = useDocumentStore();
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  const headings = useMemo(() => {
    return extractOutline(parsedDocument);
  }, [parsedDocument]);

  // Track active heading during scroll with RAF throttling to eliminate layout thrashing
  useEffect(() => {
    if (headings.length === 0) {
      setActiveHeadingId(null);
      return;
    }

    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;

        // Find heading closest to top of reader viewport
        const headingElements = headings
          .map((h) => ({ id: h.id, el: document.getElementById(h.id) }))
          .filter((item): item is { id: string; el: HTMLElement } => item.el !== null);

        if (headingElements.length === 0) return;

        const viewportTop = 80;
        let currentActiveId = headingElements[0].id;

        for (const item of headingElements) {
          const rect = item.el.getBoundingClientRect();
          if (rect.top <= viewportTop + 40) {
            currentActiveId = item.id;
          } else {
            break;
          }
        }

        setActiveHeadingId(currentActiveId);
      });
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [headings]);

  const handleHeadingClick = (heading: OutlineHeading) => {
    setActiveHeadingId(heading.id);
    const el = document.getElementById(heading.id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getIndentClass = (level: number) => {
    switch (level) {
      case 1:
        return "pl-2 font-medium";
      case 2:
        return "pl-4 text-[11.5px]";
      case 3:
        return "pl-6 text-[11px]";
      case 4:
        return "pl-8 text-[11px] opacity-90";
      case 5:
        return "pl-10 text-[10.5px] opacity-80";
      case 6:
        return "pl-12 text-[10px] opacity-75";
      default:
        return "pl-4 text-[11px]";
    }
  };

  return (
    <aside
      aria-label="Document outline"
      className={`transition-all duration-200 ease-out border-r border-[var(--fluent-border-divider)] bg-[var(--fluent-bg-sidebar)] flex flex-col flex-shrink-0 h-full overflow-hidden ${
        isSidebarOpen
          ? "w-[var(--fluent-sidebar-width)] opacity-100"
          : "w-0 opacity-0 pointer-events-none border-r-0"
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-[var(--fluent-border-divider)] select-none flex-shrink-0">
        <div className="flex items-center gap-2">
          <ListTree className="w-4 h-4 text-[var(--fluent-accent)]" />
          <span className="text-[12px] font-semibold text-[var(--fluent-text-primary)]">
            Outline
          </span>
          {headings.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--fluent-bg-subtle-hover)] text-[var(--fluent-text-tertiary)]">
              {headings.length}
            </span>
          )}
        </div>
        <IconButton
          icon={<X className="w-3.5 h-3.5" />}
          label="Close outline sidebar"
          tooltip="Close (Ctrl+B)"
          size="sm"
          onClick={() => setSidebarOpen(false)}
        />
      </div>

      {/* Headings List or Empty State */}
      {headings.length === 0 ? (
        <div className="flex-1 p-4 flex flex-col items-center justify-center text-center select-none overflow-y-auto">
          <div className="w-10 h-10 rounded-full bg-[var(--fluent-bg-subtle-hover)] border border-[var(--fluent-border-subtle)] flex items-center justify-center text-[var(--fluent-text-tertiary)] mb-3">
            <FileQuestion className="w-5 h-5" />
          </div>
          <h3 className="text-[13px] font-medium text-[var(--fluent-text-primary)] mb-1">
            No Outline Available
          </h3>
          <p className="text-[11px] text-[var(--fluent-text-secondary)] leading-relaxed max-w-[200px]">
            Document headings (# H1, ## H2) will appear here once an open document with headings is active.
          </p>
        </div>
      ) : (
        <nav
          role="navigation"
          aria-label="Table of contents"
          className="flex-1 overflow-y-auto p-2 space-y-0.5 select-none"
        >
          {headings.map((heading) => {
            const isActive = activeHeadingId === heading.id;
            return (
              <button
                key={heading.id}
                type="button"
                onClick={() => handleHeadingClick(heading)}
                className={`w-full text-left py-1.5 pr-2 rounded-[var(--fluent-radius-sm)] flex items-center gap-1.5 transition-colors group ${
                  getIndentClass(heading.level)
                } ${
                  isActive
                    ? "bg-[var(--fluent-accent-subtle)] text-[var(--fluent-accent)] font-semibold"
                    : "text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)]"
                }`}
              >
                <Hash
                  className={`w-3 h-3 flex-shrink-0 ${
                    isActive
                      ? "text-[var(--fluent-accent)]"
                      : "text-[var(--fluent-text-tertiary)] group-hover:text-[var(--fluent-text-secondary)] opacity-60"
                  }`}
                />
                <span className="truncate">{heading.text}</span>
              </button>
            );
          })}
        </nav>
      )}
    </aside>
  );
}
