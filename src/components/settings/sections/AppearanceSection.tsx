import React from "react";
import { RotateCcw } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { SettingSelect } from "../controls/SettingSelect";
import { SettingToggle } from "../controls/SettingToggle";
import { AccentColorPicker } from "../controls/AccentColorPicker";

export const AppearanceSection: React.FC = () => {
  const { settings, updateAppearance, resetCategory } = useSettingsStore();
  const { appearance } = settings;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--fluent-border-divider)]">
        <div>
          <h2 className="text-base font-semibold text-[var(--fluent-text-primary)]">Appearance</h2>
          <p className="text-[12px] text-[var(--fluent-text-secondary)] mt-0.5">
            Personalize theme styling, accent colors, and layout density.
          </p>
        </div>
        <button
          type="button"
          onClick={() => resetCategory("appearance")}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] rounded-[var(--fluent-radius-md)] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Section</span>
        </button>
      </div>

      <div className="space-y-1">
        <SettingSelect
          label="Application Theme"
          description="Switch between light, dark, or follow Windows system appearance"
          value={appearance.theme}
          options={[
            { value: "system", label: "Follow Windows (System)" },
            { value: "light", label: "Light Theme" },
            { value: "dark", label: "Dark Theme" },
          ]}
          onChange={(val) => updateAppearance({ theme: val })}
        />

        <AccentColorPicker
          value={appearance.accentColor}
          onChange={(color) => updateAppearance({ accentColor: color })}
        />

        <SettingToggle
          label="Compact Layout Mode"
          description="Reduce tab bar and toolbar heights for maximum reading workspace"
          checked={appearance.compactMode}
          onChange={(val) => updateAppearance({ compactMode: val })}
        />
      </div>
    </div>
  );
};
