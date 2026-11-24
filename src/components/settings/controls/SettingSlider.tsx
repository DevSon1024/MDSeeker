import React from "react";

interface SettingSliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  formatValue?: (val: number) => string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const SettingSlider: React.FC<SettingSliderProps> = ({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  formatValue,
  onChange,
  disabled = false,
}) => {
  const displayVal = formatValue ? formatValue(value) : value.toString();

  return (
    <div
      className={`py-2.5 px-3 rounded-[var(--fluent-radius-md)] transition-colors ${
        disabled ? "opacity-50 pointer-events-none" : "hover:bg-[var(--fluent-bg-subtle-hover)]"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <label className="text-[13px] font-medium text-[var(--fluent-text-primary)] select-none">
            {label}
          </label>
          {description && (
            <p className="text-[11px] text-[var(--fluent-text-secondary)] mt-0.5 select-none leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-[var(--fluent-radius-xs)] bg-[var(--fluent-bg-subtle-active)] text-[var(--fluent-text-secondary)] font-medium">
          {displayVal}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-[var(--fluent-border-divider)] dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[var(--fluent-accent)] focus:outline-none"
        />
      </div>
    </div>
  );
};
