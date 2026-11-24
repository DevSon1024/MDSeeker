import React, { useEffect, useRef } from "react";
import { Keyboard, X } from "lucide-react";

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutCategory {
  title: string;
  shortcuts: { label: string; keys: string[] }[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: "View Modes",
    shortcuts: [
      { label: "Reading Mode", keys: ["Alt", "1"] },
      { label: "Source Mode", keys: ["Alt", "2"] },
      { label: "Split Mode", keys: ["Alt", "3"] },
      { label: "Cycle View Mode", keys: ["Ctrl", "E"] },
      { label: "Toggle Reading / Source", keys: ["Ctrl", "Shift", "V"] },
    ],
  },
  {
    title: "Document & Tabs",
    shortcuts: [
      { label: "Open Document", keys: ["Ctrl", "O"] },
      { label: "Close Active Tab", keys: ["Ctrl", "W"] },
      { label: "Close All Tabs", keys: ["Ctrl", "Shift", "W"] },
      { label: "Switch to Tab 1–9", keys: ["Ctrl", "1–9"] },
      { label: "Next Tab", keys: ["Ctrl", "Tab"] },
      { label: "Previous Tab", keys: ["Ctrl", "Shift", "Tab"] },
    ],
  },
  {
    title: "Search & Navigation",
    shortcuts: [
      { label: "Find in Document / Source", keys: ["Ctrl", "F"] },
      { label: "Next Match", keys: ["Enter"] },
      { label: "Previous Match", keys: ["Shift", "Enter"] },
      { label: "Dismiss Search", keys: ["Escape"] },
      { label: "Toggle Outline Sidebar", keys: ["Ctrl", "B"] },
    ],
  },
  {
    title: "Search Options",
    shortcuts: [
      { label: "Toggle Match Case", keys: ["Alt", "C"] },
      { label: "Toggle Whole Word", keys: ["Alt", "W"] },
      { label: "Toggle Regular Expression", keys: ["Alt", "R"] },
    ],
  },
  {
    title: "Application",
    shortcuts: [
      { label: "Settings", keys: ["Ctrl", ","] },
      { label: "Close Application", keys: ["Alt", "F4"] },
    ],
  },
];

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[var(--fluent-radius-lg)] bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] shadow-[var(--fluent-shadow-flyout)] backdrop-blur-md overflow-hidden animate-in zoom-in-95 duration-150 select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--fluent-border-divider)] bg-[var(--fluent-bg-subtle-hover)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[var(--fluent-radius-md)] bg-[var(--fluent-accent-subtle)] text-[var(--fluent-accent)]">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="keyboard-shortcuts-title"
                className="text-[15px] font-semibold text-[var(--fluent-text-primary)] leading-tight"
              >
                Keyboard Shortcuts
              </h2>
              <p className="text-[12px] text-[var(--fluent-text-secondary)]">
                Default keyboard shortcuts for navigation, documents, and view modes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
            className="p-1.5 rounded-[var(--fluent-radius-sm)] text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SHORTCUT_CATEGORIES.map((category) => (
              <div key={category.title} className="space-y-2.5">
                <h3 className="text-[11px] font-semibold text-[var(--fluent-text-tertiary)] uppercase tracking-wider px-1">
                  {category.title}
                </h3>
                <div className="space-y-1.5 rounded-[var(--fluent-radius-md)] bg-[var(--fluent-bg-subtle-hover)] p-2 border border-[var(--fluent-border-subtle)]">
                  {category.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.label}
                      className="flex items-center justify-between px-2 py-1 text-[12px] text-[var(--fluent-text-primary)]"
                    >
                      <span className="truncate pr-2">{shortcut.label}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {shortcut.keys.map((key, i) => (
                          <React.Fragment key={key}>
                            <kbd className="inline-block px-1.5 py-0.5 text-[10.5px] font-mono font-medium rounded-[var(--fluent-radius-xs)] bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] text-[var(--fluent-text-secondary)] shadow-2xs leading-none min-w-[20px] text-center">
                              {key}
                            </kbd>
                            {i < shortcut.keys.length - 1 && (
                              <span className="text-[10px] text-[var(--fluent-text-tertiary)] font-mono">
                                +
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-[var(--fluent-border-divider)] bg-[var(--fluent-bg-subtle-hover)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[var(--fluent-radius-md)] text-[12px] font-medium bg-[var(--fluent-accent)] text-white hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
