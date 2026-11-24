import React, { useState } from "react";
import {
  PanelLeft,
  PanelLeftClose,
  BookOpen,
  Code2,
  Columns2,
  Search,
  Keyboard,
  Settings as SettingsIcon,
} from "lucide-react";
import { useUIStore, ViewMode } from "@/stores/uiStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { IconButton } from "@/components/common/IconButton";
import { AppearanceMenu } from "./AppearanceMenu";
import { Tooltip } from "@/components/common/Tooltip";
import { KeyboardShortcutsDialog } from "@/components/common/KeyboardShortcutsDialog";

export function ReaderToolbar() {
  const {
    isSidebarOpen,
    toggleSidebar,
    viewMode,
    setViewMode,
    isSearchOpen,
    toggleSearch,
  } = useUIStore();

  const openSettings = useSettingsStore((s) => s.openSettings);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const viewModes: { mode: ViewMode; label: string; icon: React.ReactNode; shortcut: string }[] = [
    {
      mode: "reading",
      label: "Reading mode",
      icon: <BookOpen className="w-4 h-4" />,
      shortcut: "Alt+1",
    },
    {
      mode: "source",
      label: "Source mode",
      icon: <Code2 className="w-4 h-4" />,
      shortcut: "Alt+2",
    },
    {
      mode: "split",
      label: "Split mode",
      icon: <Columns2 className="w-4 h-4" />,
      shortcut: "Alt+3",
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

      {/* Right: Search, Appearance, Settings, More Actions */}
      <div className="flex items-center gap-1">
        <IconButton
          icon={<Search className="w-4 h-4" />}
          label="Search document"
          tooltip="Search (Ctrl+F)"
          isActive={isSearchOpen}
          onClick={toggleSearch}
        />

        <AppearanceMenu />

        <IconButton
          icon={<SettingsIcon className="w-4 h-4" />}
          label="Settings"
          tooltip="Settings (Ctrl+,)"
          onClick={() => openSettings()}
        />

        <IconButton
          icon={<Keyboard className="w-4 h-4" />}
          label="Keyboard shortcuts"
          tooltip="Keyboard shortcuts"
          isActive={isShortcutsOpen}
          onClick={() => setIsShortcutsOpen(true)}
        />
      </div>

      {/* Keyboard Shortcuts Modal Dialog */}
      <KeyboardShortcutsDialog
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
