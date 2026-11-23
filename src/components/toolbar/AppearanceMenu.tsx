import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { useUIStore, AppTheme } from "@/stores/uiStore";
import { Tooltip } from "@/components/common/Tooltip";

export function AppearanceMenu() {
  const { theme, setTheme } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const themes: { value: AppTheme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="w-4 h-4 text-amber-500" /> },
    { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4 text-sky-400" /> },
    { value: "system", label: "System setting", icon: <Laptop className="w-4 h-4 text-zinc-400" /> },
  ];

  const currentIcon =
    theme === "dark" ? (
      <Moon className="w-4 h-4 text-sky-400" />
    ) : theme === "light" ? (
      <Sun className="w-4 h-4 text-amber-500" />
    ) : (
      <Laptop className="w-4 h-4 text-[var(--fluent-text-secondary)]" />
    );

  return (
    <div className="relative inline-block" ref={menuRef}>
      <Tooltip content="Appearance & Theme" position="bottom">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label="Theme options"
          className="fluent-icon-btn"
        >
          {currentIcon}
        </button>
      </Tooltip>

      {isOpen && (
        <div
          role="menu"
          aria-label="Theme selection"
          className="absolute right-0 top-full mt-1.5 w-48 rounded-[var(--fluent-radius-md)] bg-[var(--fluent-bg-flyout)] border border-[var(--fluent-border-card)] shadow-[var(--fluent-shadow-flyout)] p-1 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2 py-1.5 text-[11px] font-semibold text-[var(--fluent-text-secondary)] uppercase tracking-wider">
            Theme
          </div>
          {themes.map((t) => (
            <button
              key={t.value}
              type="button"
              role="menuitem"
              onClick={() => {
                setTheme(t.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[var(--fluent-radius-sm)] text-[12px] transition-colors text-left ${
                theme === t.value
                  ? "bg-[var(--fluent-accent-subtle)] text-[var(--fluent-accent)] font-medium"
                  : "text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)]"
              }`}
            >
              <div className="flex items-center gap-2">
                {t.icon}
                <span>{t.label}</span>
              </div>
              {theme === t.value && <Check className="w-3.5 h-3.5 text-[var(--fluent-accent)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
