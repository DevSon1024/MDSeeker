import React from "react";

interface SettingToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div
      className={`flex items-center justify-between py-2.5 px-3 rounded-[var(--fluent-radius-md)] transition-colors ${
        disabled ? "opacity-50 pointer-events-none" : "hover:bg-[var(--fluent-bg-subtle-hover)]"
      }`}
    >
      <div className="flex-1 pr-4">
        <label
          className="text-[13px] font-medium text-[var(--fluent-text-primary)] cursor-pointer select-none"
          onClick={handleClick}
        >
          {label}
        </label>
        {description && (
          <p className="text-[11px] text-[var(--fluent-text-secondary)] mt-0.5 select-none leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fluent-focus-border)] ${
          checked ? "bg-[var(--fluent-accent)]" : "bg-[var(--fluent-border-divider)] dark:bg-zinc-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};
