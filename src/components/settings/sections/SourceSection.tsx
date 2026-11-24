import React from "react";
import { RotateCcw } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { SettingSelect } from "../controls/SettingSelect";
import { SettingSlider } from "../controls/SettingSlider";
import { SettingToggle } from "../controls/SettingToggle";

export const SourceSection: React.FC = () => {
  const { settings, updateSource, resetCategory } = useSettingsStore();
  const { source } = settings;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--fluent-border-divider)]">
        <div>
          <h2 className="text-base font-semibold text-[var(--fluent-text-primary)]">Source Viewer</h2>
          <p className="text-[12px] text-[var(--fluent-text-secondary)] mt-0.5">
            Configure the read-only CodeMirror 6 Markdown source inspector.
          </p>
        </div>
        <button
          type="button"
          onClick={() => resetCategory("source")}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] rounded-[var(--fluent-radius-md)] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Section</span>
        </button>
      </div>

      <div className="space-y-1">
        <SettingSelect
          label="Code Font Family"
          description="Monospace font used for raw Markdown source"
          value={source.fontFamily}
          options={[
            {
              value: "Cascadia Code, Consolas, monospace",
              label: "Cascadia Code (Windows 11 Native)",
            },
            { value: "Consolas, 'Courier New', monospace", label: "Consolas / Classic Monospace" },
            { value: "'Fira Code', Consolas, monospace", label: "Fira Code" },
            { value: "'JetBrains Mono', Consolas, monospace", label: "JetBrains Mono" },
          ]}
          onChange={(val) => updateSource({ fontFamily: val })}
        />

        <SettingSlider
          label="Font Size"
          description="Size of source code text"
          value={source.fontSize}
          min={11}
          max={24}
          step={1}
          formatValue={(v) => `${v}px`}
          onChange={(v) => updateSource({ fontSize: v })}
        />

        <SettingSlider
          label="Line Height"
          description="Vertical line spacing in the source editor"
          value={source.lineHeight}
          min={1.2}
          max={2.2}
          step={0.1}
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => updateSource({ lineHeight: parseFloat(v.toFixed(1)) })}
        />

        <SettingSelect
          label="Tab Size"
          description="Indentation spacing for tab characters"
          value={source.tabSize}
          options={[
            { value: 2, label: "2 spaces" },
            { value: 4, label: "4 spaces" },
          ]}
          onChange={(val) => updateSource({ tabSize: Number(val) })}
        />

        <SettingToggle
          label="Word Wrap"
          description="Wrap long source lines to prevent horizontal scrolling"
          checked={source.wordWrap}
          onChange={(val) => updateSource({ wordWrap: val })}
        />

        <SettingToggle
          label="Show Line Numbers"
          description="Display line gutter numbering on the left edge"
          checked={source.showLineNumbers}
          onChange={(val) => updateSource({ showLineNumbers: val })}
        />

        <SettingToggle
          label="Highlight Active Line"
          description="Subtly illuminate the current line under cursor or focus"
          checked={source.highlightActiveLine}
          onChange={(val) => updateSource({ highlightActiveLine: val })}
        />
      </div>
    </div>
  );
};
