import React from "react";
import { RotateCcw } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { SettingSelect } from "../controls/SettingSelect";
import { SettingSlider } from "../controls/SettingSlider";
import { SettingToggle } from "../controls/SettingToggle";

export const ReaderSection: React.FC = () => {
  const { settings, updateReader, resetCategory } = useSettingsStore();
  const { reader } = settings;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--fluent-border-divider)]">
        <div>
          <h2 className="text-base font-semibold text-[var(--fluent-text-primary)]">Markdown Reader</h2>
          <p className="text-[12px] text-[var(--fluent-text-secondary)] mt-0.5">
            Customize typography, content layout width, and reading interaction.
          </p>
        </div>
        <button
          type="button"
          onClick={() => resetCategory("reader")}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] rounded-[var(--fluent-radius-md)] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Section</span>
        </button>
      </div>

      <div className="space-y-1">
        <SettingSelect
          label="Reader Font Family"
          description="Primary font face used for rendered Markdown prose"
          value={reader.fontFamily}
          options={[
            {
              value: "Segoe UI Variable Text, Segoe UI, sans-serif",
              label: "Segoe UI Variable (Windows 11 Native)",
            },
            { value: "Inter, -apple-system, sans-serif", label: "Inter / Modern Sans" },
            { value: "Georgia, Cambria, serif", label: "Georgia / Traditional Serif" },
            { value: "Merriweather, Georgia, serif", label: "Merriweather / Editorial Serif" },
            { value: "Arial, Helvetica, sans-serif", label: "Arial / Standard Sans" },
          ]}
          onChange={(val) => updateReader({ fontFamily: val })}
        />

        <SettingSlider
          label="Font Size"
          description="Base text size for document prose"
          value={reader.fontSize}
          min={12}
          max={28}
          step={1}
          formatValue={(v) => `${v}px`}
          onChange={(v) => updateReader({ fontSize: v })}
        />

        <SettingSlider
          label="Line Height"
          description="Vertical spacing multiplier between text lines"
          value={reader.lineHeight}
          min={1.2}
          max={2.4}
          step={0.1}
          formatValue={(v) => v.toFixed(1)}
          onChange={(v) => updateReader({ lineHeight: parseFloat(v.toFixed(1)) })}
        />

        <SettingSlider
          label="Paragraph Spacing"
          description="Bottom margin between document paragraphs and blocks"
          value={reader.paragraphSpacing}
          min={0.5}
          max={2.5}
          step={0.1}
          formatValue={(v) => `${v.toFixed(1)}em`}
          onChange={(v) => updateReader({ paragraphSpacing: parseFloat(v.toFixed(1)) })}
        />

        <SettingSelect
          label="Maximum Content Width"
          description="Constrains reading column width for comfortable line lengths"
          value={reader.contentWidth}
          options={[
            { value: "narrow", label: "Narrow (672px / max-w-2xl)" },
            { value: "medium", label: "Medium (896px / max-w-4xl)" },
            { value: "wide", label: "Wide (1152px / max-w-6xl)" },
            { value: "full", label: "Full Width (100% of viewport)" },
          ]}
          onChange={(val) => updateReader({ contentWidth: val })}
        />

        <SettingToggle
          label="Show Heading Anchors"
          description="Display anchor icon '#' on hover for direct section linking"
          checked={reader.showHeadingAnchors}
          onChange={(val) => updateReader({ showHeadingAnchors: val })}
        />

        <SettingToggle
          label="Smooth Scrolling"
          description="Enable animated smooth scrolling for outline jumps and navigation"
          checked={reader.smoothScrolling}
          onChange={(val) => updateReader({ smoothScrolling: val })}
        />
      </div>

      {/* Live Preview Box */}
      <div className="mt-4 p-4 rounded-[var(--fluent-radius-lg)] border border-[var(--fluent-border-card)] bg-[var(--fluent-bg-card)] shadow-xs">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fluent-text-secondary)] mb-3">
          Live Typography Preview
        </div>
        <div
          style={{
            fontFamily: reader.fontFamily,
            fontSize: `${reader.fontSize}px`,
            lineHeight: reader.lineHeight,
          }}
          className="text-[var(--fluent-text-primary)]"
        >
          <div className="font-bold text-[1.3em] mb-2 border-b border-[var(--fluent-border-divider)] pb-1 flex items-center gap-1 group">
            <span>Sample Heading</span>
            {reader.showHeadingAnchors && (
              <span className="text-[var(--fluent-accent)] text-sm ml-1 select-none opacity-60 group-hover:opacity-100">
                #
              </span>
            )}
          </div>
          <p style={{ marginBottom: `${reader.paragraphSpacing}em` }}>
            MDSeeker brings Windows 11 Fluent design to your Markdown documents. Clean typography, fast Rust
            parsing, and smooth navigation.
          </p>
          <p style={{ marginBottom: `${reader.paragraphSpacing}em` }}>
            Enjoy reading documentation with comfortable line spacing, adjustable column widths, and responsive
            high-contrast readability.
          </p>
        </div>
      </div>
    </div>
  );
};
