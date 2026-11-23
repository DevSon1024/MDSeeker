import React, { useState, useRef, useEffect } from "react";
import {
  PanelLeft,
  PanelLeftClose,
  ListTree,
  BookOpen,
  Code2,
  Columns2,
  Search,
  MoreHorizontal,
  Info,
  Keyboard,
} from "lucide-react";
import { useUIStore, ViewMode } from "@/stores/uiStore";
import { IconButton } from "@/components/common/IconButton";
import { AppearanceMenu } from "./AppearanceMenu";
import { Tooltip } from "@/components/common/Tooltip";

export function ReaderToolbar() {
  const {
    isSidebarOpen,
    toggleSidebar,
    viewMode,
    setViewMode,
    isSearchOpen,
    toggleSearch,
  } = useUIStore();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }

    if (isMoreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreOpen]);

  const viewModes: { mode: ViewMode; label: string; icon: React.ReactNode; shortcut: string }[] = [
    {
      mode: "reading",
      label: "Reading mode",
      icon: <BookOpen className="w-4 h-4" />,
      shortcut: "Ctrl+1",
    },
    {
      mode: "source",
      label: "Source mode",
      icon: <Code2 className="w-4 h-4" />,
      shortcut: "Ctrl+2",
    },
    {
      mode: "split",
      label: "Split mode",
      icon: <Columns2 className="w-4 h-4" />,
      shortcut: "Ctrl+3",
    },
  ];

  return (
    <div
      role="toolbar"
      aria-label="Document reader toolbar"
      className="h-[var(--fluent-toolbar-height)] flex items-center justify-between px-3 border-b border-[var(--fluent-border-divider)] bg-[var(--fluent-bg-mica)] text-[var(--fluent-text-primary)] select-none flex-shrink-0"
    >
      {/* Left: Sidebar & Navigation Controls */}
      <div className="flex items-center gap-1">
        <IconButton
          icon={isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          label={isSidebarOpen ? "Hide Outline Sidebar" : "Show Outline Sidebar"}
          tooltip={isSidebarOpen ? "Collapse outline (Ctrl+B)" : "Expand outline (Ctrl+B)"}
          isActive={isSidebarOpen}
          onClick={toggleSidebar}
        />

        <div className="h-4 w-[1px] bg-[var(--fluent-border-divider)] mx-1" />

        <IconButton
          icon={<ListTree className="w-4 h-4" />}
          label="Document Outline"
          tooltip="Outline navigation"
          disabled
        />
      </div>

      {/* Center: View Mode Segmented Controls */}
      <div className="flex items-center bg-[var(--fluent-bg-subtle-hover)] border border-[var(--fluent-border-subtle)] p-0.5 rounded-[var(--fluent-radius-lg)]">
        {viewModes.map(({ mode, label, icon, shortcut }) => {
          const isActive = viewMode === mode;
          return (
            <Tooltip key={mode} content={`${label} (${shortcut})`} position="bottom">
              <button
                type="button"
                onClick={() => setViewMode(mode)}
                aria-pressed={isActive}
                aria-label={label}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-[var(--fluent-radius-md)] text-[12px] font-medium transition-all ${
                  isActive
                    ? "bg-[var(--fluent-bg-card)] text-[var(--fluent-text-primary)] shadow-sm border border-[var(--fluent-border-card)]"
                    : "text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)]"
                }`}
              >
                {icon}
                <span className="hidden sm:inline capitalize">{mode}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Right: Search, Appearance, More Actions */}
      <div className="flex items-center gap-1">
        <IconButton
          icon={<Search className="w-4 h-4" />}
          label="Search document"
          tooltip="Search (Ctrl+F)"
          isActive={isSearchOpen}
          onClick={toggleSearch}
        />

        <AppearanceMenu />

        {/* More Actions Dropdown */}
        <div className="relative inline-block" ref={moreRef}>
          <Tooltip content="More actions" position="bottom">
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              aria-expanded={isMoreOpen}
              aria-haspopup="menu"
              aria-label="More actions"
              className="fluent-icon-btn"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </Tooltip>

          {isMoreOpen && (
            <div
              role="menu"
              aria-label="Additional actions"
              className="absolute right-0 top-full mt-1.5 w-52 rounded-[var(--fluent-radius-md)] bg-[var(--fluent-bg-flyout)] border border-[var(--fluent-border-card)] shadow-[var(--fluent-shadow-flyout)] p-1 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => setIsMoreOpen(false)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--fluent-radius-sm)] text-[12px] text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] text-left"
              >
                <Keyboard className="w-4 h-4 text-[var(--fluent-text-secondary)]" />
                <span>Keyboard Shortcuts</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => setIsMoreOpen(false)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--fluent-radius-sm)] text-[12px] text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] text-left"
              >
                <Info className="w-4 h-4 text-[var(--fluent-text-secondary)]" />
                <span>About MDSeeker</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
