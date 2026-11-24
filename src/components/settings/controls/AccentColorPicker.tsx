import React from "react";
import { Check } from "lucide-react";

export const ACCENT_PALETTES = [
  { label: "Windows Blue", value: "#0078d4" },
  { label: "Fluent Cobalt", value: "#0067c0" },
  { label: "Teal", value: "#008272" },
  { label: "Emerald Green", value: "#107c41" },
  { label: "Amber Orange", value: "#d83b01" },
  { label: "Crimson Red", value: "#c42b1c" },
  { label: "Magenta", value: "#b4009e" },
  { label: "Purple", value: "#8764b8" },
  { label: "Slate", value: "#4a5568" },
];

interface AccentColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export const AccentColorPicker: React.FC<AccentColorPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const normValue = value.toLowerCase();

  return (
    <div className="py-2.5 px-3 rounded-[var(--fluent-radius-md)] hover:bg-[var(--fluent-bg-subtle-hover)] transition-colors">
      <div className="mb-2">
        <label className="text-[13px] font-medium text-[var(--fluent-text-primary)] select-none">
          Accent Color
        </label>
        <p className="text-[11px] text-[var(--fluent-text-secondary)] mt-0.5 select-none leading-relaxed">
          Select an accent color for focus highlights, active tabs, and interactive controls
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 pt-1">
        {ACCENT_PALETTES.map((preset) => {
          const isSelected = normValue === preset.value.toLowerCase();
          return (
            <button
              key={preset.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(preset.value)}
              title={preset.label}
              aria-label={`Select accent color ${preset.label}`}
              className={`h-7 w-7 rounded-full flex items-center justify-center transition-all shadow-xs ${
                isSelected
                  ? "ring-2 ring-offset-2 ring-[var(--fluent-focus-border)] ring-offset-[var(--fluent-bg-window)] scale-110"
                  : "hover:scale-105 opacity-90 hover:opacity-100"
              }`}
              style={{ backgroundColor: preset.value }}
            >
              {isSelected && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
