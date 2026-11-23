import { useEffect, useRef } from "react";
import { X, Copy, FolderOpen, ArrowRight, Layers, Trash2 } from "lucide-react";
import { revealInFileExplorer } from "@/services/documentService";

export interface TabContextMenuProps {
  x: number;
  y: number;
  documentId: string;
  filePath: string;
  fileName: string;
  isOnlyTab: boolean;
  isLastTab: boolean;
  onClose: () => void;
  onCloseTab: (id: string) => void;
  onCloseOtherTabs: (id: string) => void;
  onCloseTabsToTheRight: (id: string) => void;
  onCloseAllTabs: () => void;
}

export function TabContextMenu({
  x,
  y,
  documentId,
  filePath,
  fileName: _fileName,
  isOnlyTab,
  isLastTab,
  onClose,
  onCloseTab,
  onCloseOtherTabs,
  onCloseTabsToTheRight,
  onCloseAllTabs,
}: TabContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(filePath);
    } catch (err) {
      console.warn("Failed to copy path:", err);
    }
    onClose();
  };

  const handleReveal = async () => {
    try {
      await revealInFileExplorer(filePath);
    } catch (err) {
      console.warn("Failed to reveal file in explorer:", err);
    }
    onClose();
  };

  // Adjust position so it doesn't overflow viewport
  const menuWidth = 200;
  const menuHeight = 230;
  const left = Math.min(x, window.innerWidth - menuWidth - 8);
  const top = Math.min(y, window.innerHeight - menuHeight - 8);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Tab context menu"
      style={{ left: `${left}px`, top: `${top}px` }}
      className="fixed z-50 min-w-[190px] p-1.5 rounded-[var(--fluent-radius-lg)] bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] shadow-[var(--fluent-shadow-flyout)] text-[12px] text-[var(--fluent-text-primary)] select-none animate-in fade-in zoom-in-95 duration-100"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onCloseTab(documentId);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--fluent-radius-sm)] hover:bg-[var(--fluent-bg-subtle-hover)] text-left transition-colors"
      >
        <X className="w-3.5 h-3.5 text-[var(--fluent-text-secondary)]" />
        <span>Close Tab</span>
      </button>

      <button
        type="button"
        role="menuitem"
        disabled={isOnlyTab}
        onClick={() => {
          onCloseOtherTabs(documentId);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--fluent-radius-sm)] hover:bg-[var(--fluent-bg-subtle-hover)] text-left transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <Layers className="w-3.5 h-3.5 text-[var(--fluent-text-secondary)]" />
        <span>Close Other Tabs</span>
      </button>

      <button
        type="button"
        role="menuitem"
        disabled={isLastTab}
        onClick={() => {
          onCloseTabsToTheRight(documentId);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--fluent-radius-sm)] hover:bg-[var(--fluent-bg-subtle-hover)] text-left transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <ArrowRight className="w-3.5 h-3.5 text-[var(--fluent-text-secondary)]" />
        <span>Close Tabs to the Right</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onCloseAllTabs();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--fluent-radius-sm)] hover:bg-[var(--fluent-bg-subtle-hover)] text-left transition-colors text-rose-600 dark:text-rose-400"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Close All Tabs</span>
      </button>

      <div className="h-[1px] bg-[var(--fluent-border-divider)] my-1" />

      <button
        type="button"
        role="menuitem"
        onClick={handleCopyPath}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--fluent-radius-sm)] hover:bg-[var(--fluent-bg-subtle-hover)] text-left transition-colors"
      >
        <Copy className="w-3.5 h-3.5 text-[var(--fluent-text-secondary)]" />
        <span>Copy File Path</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={handleReveal}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--fluent-radius-sm)] hover:bg-[var(--fluent-bg-subtle-hover)] text-left transition-colors"
      >
        <FolderOpen className="w-3.5 h-3.5 text-[var(--fluent-text-secondary)]" />
        <span>Reveal in File Explorer</span>
      </button>
    </div>
  );
}
