import React, { useEffect, useState } from "react";
import {
  X,
  Settings as SettingsIcon,
  LayoutGrid,
  Palette,
  BookOpen,
  Code2,
  Terminal,
  Shield,
  Info,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { useSettingsStore, SettingsCategory } from "@/stores/settingsStore";
import { GeneralSection } from "./sections/GeneralSection";
import { AppearanceSection } from "./sections/AppearanceSection";
import { ReaderSection } from "./sections/ReaderSection";
import { SourceSection } from "./sections/SourceSection";
import { CodeBlockSection } from "./sections/CodeBlockSection";
import { PrivacySection } from "./sections/PrivacySection";
import { AboutSection } from "./sections/AboutSection";

const CATEGORIES: {
  id: SettingsCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "general", label: "General", icon: LayoutGrid },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "reader", label: "Markdown Reader", icon: BookOpen },
  { id: "source", label: "Source Viewer", icon: Code2 },
  { id: "codeBlocks", label: "Code Blocks", icon: Terminal },
  { id: "privacy", label: "Privacy & History", icon: Shield },
  { id: "about", label: "About", icon: Info },
];

export const SettingsDialog: React.FC = () => {
  const { isSettingsOpen, closeSettings, activeCategory, setActiveCategory, resetAllSettings } =
    useSettingsStore();

  const [confirmResetAll, setConfirmResetAll] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSettings();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSettingsOpen, closeSettings]);

  if (!isSettingsOpen) return null;

  const handleResetAll = () => {
    resetAllSettings();
    setConfirmResetAll(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeSettings();
        }
      }}
    >
      <div className="w-full max-w-4xl h-[620px] max-h-[90vh] bg-[var(--fluent-bg-mica)] border border-[var(--fluent-border-card)] rounded-[var(--fluent-radius-xl)] shadow-[var(--fluent-shadow-flyout)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--fluent-border-divider)] bg-[var(--fluent-bg-mica)] select-none">
          <div className="flex items-center gap-2.5">
            <SettingsIcon className="w-4 h-4 text-[var(--fluent-accent)]" />
            <h1 id="settings-dialog-title" className="text-sm font-semibold text-[var(--fluent-text-primary)]">
              Settings & Preferences
            </h1>
          </div>

          <button
            type="button"
            onClick={closeSettings}
            aria-label="Close settings"
            className="p-1 rounded-[var(--fluent-radius-sm)] text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialog Body (Sidebar + Content) */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Navigation Sidebar */}
          <nav
            aria-label="Settings categories"
            className="w-52 border-r border-[var(--fluent-border-divider)] bg-[var(--fluent-bg-sidebar)] p-2 space-y-0.5 flex-shrink-0 select-none overflow-y-auto"
          >
            {CATEGORIES.map(({ id, label, icon: Icon }) => {
              const isActive = activeCategory === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveCategory(id)}
                  aria-selected={isActive}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-[var(--fluent-radius-md)] text-[12px] font-medium transition-colors text-left relative ${
                    isActive
                      ? "bg-[var(--fluent-bg-card)] text-[var(--fluent-text-primary)] shadow-2xs font-semibold"
                      : "text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)]"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-[var(--fluent-accent)]" />
                  )}
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[var(--fluent-accent)]" : "text-[var(--fluent-text-secondary)]"
                    }`}
                  />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Section Content Area */}
          <main className="flex-1 p-6 overflow-y-auto bg-[var(--fluent-bg-window)] text-[var(--fluent-text-primary)]">
            {activeCategory === "general" && <GeneralSection />}
            {activeCategory === "appearance" && <AppearanceSection />}
            {activeCategory === "reader" && <ReaderSection />}
            {activeCategory === "source" && <SourceSection />}
            {activeCategory === "codeBlocks" && <CodeBlockSection />}
            {activeCategory === "privacy" && <PrivacySection />}
            {activeCategory === "about" && <AboutSection />}
          </main>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--fluent-border-divider)] bg-[var(--fluent-bg-mica)] select-none">
          <div>
            {confirmResetAll ? (
              <div className="flex items-center gap-2 animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-[11px] text-[var(--fluent-text-secondary)]">
                  Reset all settings to default values?
                </span>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-2.5 py-1 text-[11px] font-medium bg-[var(--fluent-close-hover)] text-white rounded-[var(--fluent-radius-sm)] hover:bg-[var(--fluent-close-active)] transition-colors"
                >
                  Yes, Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmResetAll(false)}
                  className="px-2.5 py-1 text-[11px] text-[var(--fluent-text-secondary)] hover:bg-[var(--fluent-bg-subtle-hover)] rounded-[var(--fluent-radius-sm)]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmResetAll(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[var(--fluent-text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-[var(--fluent-radius-md)] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Settings</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={closeSettings}
            className="px-4 py-1.5 text-[12px] font-medium rounded-[var(--fluent-radius-md)] bg-[var(--fluent-accent)] text-white hover:bg-[var(--fluent-accent-hover)] transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
