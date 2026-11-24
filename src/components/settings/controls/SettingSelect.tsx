import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SettingSelectProps {
  label: string;
  description?: string;
  value: string | number;
  options: SelectOption[];
  onChange: (value: any) => void;
  disabled?: boolean;
}

export const SettingSelect: React.FC<SettingSelectProps> = ({
  label,
  description,
  value,
  options,
  onChange,
  disabled = false,
}) => {
  return (
    <div
      className={`flex items-center justify-between py-2.5 px-3 rounded-[var(--fluent-radius-md)] transition-colors ${
        disabled ? "opacity-50 pointer-events-none" : "hover:bg-[var(--fluent-bg-subtle-hover)]"
      }`}
    >
      <div className="flex-1 pr-4">
        <label className="text-[13px] font-medium text-[var(--fluent-text-primary)] select-none">
          {label}
        </label>
        {description && (
          <p className="text-[11px] text-[var(--fluent-text-secondary)] mt-0.5 select-none leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const rawVal = e.target.value;
            // Check if option was numeric
            const matched = options.find((opt) => String(opt.value) === rawVal);
            onChange(matched ? matched.value : rawVal);
          }}
          className="appearance-none bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] text-[var(--fluent-text-primary)] text-[12px] font-medium rounded-[var(--fluent-radius-md)] pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--fluent-focus-border)] cursor-pointer shadow-xs min-w-[130px]"
        >
          {options.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)} className="bg-[var(--fluent-bg-flyout)] text-[var(--fluent-text-primary)]">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[var(--fluent-text-secondary)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
};
