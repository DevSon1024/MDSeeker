import React from "react";
import { RotateCcw } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { SettingSelect } from "../controls/SettingSelect";
import { SettingToggle } from "../controls/SettingToggle";

export const GeneralSection: React.FC = () => {
  const { settings, updateBehavior, resetCategory } = useSettingsStore();
  const { behavior } = settings;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--fluent-border-divider)]">
        <div>
          <h2 className="text-base font-semibold text-[var(--fluent-text-primary)]">General Settings</h2>
          <p className="text-[12px] text-[var(--fluent-text-secondary)] mt-0.5">
            Configure application startup, default views, and window behaviors.
          </p>
        </div>
        <button
          type="button"
          onClick={() => resetCategory("behavior")}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] rounded-[var(--fluent-radius-md)] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Section</span>
        </button>
      </div>

      <div className="space-y-1">
        <SettingSelect
          label="Default View Mode"
          description="Choose the presentation mode opened documents start in"
          value={behavior.defaultView}
          options={[
            { value: "reading", label: "Reading Mode" },
            { value: "source", label: "Source Mode" },
            { value: "split", label: "Split Mode" },
          ]}
          onChange={(val) => updateBehavior({ defaultView: val })}
        />

        <SettingToggle
          label="Restore Last Session"
          description="Automatically reopen previous document tabs on application startup"
          checked={behavior.restoreLastSession}
          onChange={(val) => updateBehavior({ restoreLastSession: val })}
        />

        <SettingToggle
          label="Confirm Before Closing Multiple Tabs"
          description="Prompt for confirmation when closing the window or multiple open tabs"
          checked={behavior.confirmCloseWithMultipleTabs}
          onChange={(val) => updateBehavior({ confirmCloseWithMultipleTabs: val })}
        />

        <SettingToggle
          label="Remember Sidebar State"
          description="Keep document outline sidebar open or closed across document switches"
          checked={behavior.rememberSidebarState}
          onChange={(val) => updateBehavior({ rememberSidebarState: val })}
        />
      </div>
    </div>
  );
};
