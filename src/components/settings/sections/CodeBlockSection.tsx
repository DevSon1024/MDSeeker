import React from "react";
import { RotateCcw } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { SettingSelect } from "../controls/SettingSelect";
import { SettingToggle } from "../controls/SettingToggle";

export const CodeBlockSection: React.FC = () => {
  const { settings, updateCodeBlocks, resetCategory } = useSettingsStore();
  const { codeBlocks } = settings;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--fluent-border-divider)]">
        <div>
          <h2 className="text-base font-semibold text-[var(--fluent-text-primary)]">Code Blocks</h2>
          <p className="text-[12px] text-[var(--fluent-text-secondary)] mt-0.5">
            Configure fenced code blocks and syntect syntax highlighting in the reader.
          </p>
        </div>
        <button
          type="button"
          onClick={() => resetCategory("codeBlocks")}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] rounded-[var(--fluent-radius-md)] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Section</span>
        </button>
      </div>

      <div className="space-y-1">
        <SettingSelect
          label="Syntax Highlighting Theme"
          description="Color palette applied to fenced code blocks"
          value={codeBlocks.theme}
          options={[
            { value: "auto", label: "Adaptive (Follows App Theme)" },
            { value: "light", label: "Always Light" },
            { value: "dark", label: "Always Dark" },
          ]}
          onChange={(val) => updateCodeBlocks({ theme: val })}
        />

        <SettingToggle
          label="Show Line Numbers"
          description="Display line count indicators inside fenced code blocks"
          checked={codeBlocks.showLineNumbers}
          onChange={(val) => updateCodeBlocks({ showLineNumbers: val })}
        />

        <SettingToggle
          label="Wrap Long Lines"
          description="Wrap code lines instead of showing horizontal scrollbars"
          checked={codeBlocks.wrapLongLines}
          onChange={(val) => updateCodeBlocks({ wrapLongLines: val })}
        />

        <SettingToggle
          label="Show Copy Button"
          description="Display one-click copy button on code block headers"
          checked={codeBlocks.showCopyButton}
          onChange={(val) => updateCodeBlocks({ showCopyButton: val })}
        />
      </div>
    </div>
  );
};
