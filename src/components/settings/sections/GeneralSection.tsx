import React, { useEffect, useState } from "react";
import { RotateCcw, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { SettingSelect } from "../controls/SettingSelect";
import { SettingToggle } from "../controls/SettingToggle";
import {
  isDefaultAppRegistered,
  registerDefaultApp,
  openDefaultAppsSettings,
} from "@/services/windowService";

export const GeneralSection: React.FC = () => {
  const { settings, updateBehavior, resetCategory } = useSettingsStore();
  const { behavior } = settings;

  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    isDefaultAppRegistered().then((res) => setIsRegistered(res));
  }, []);

  const handleRegisterApp = async () => {
    setIsRegistering(true);
    setFeedbackMsg(null);
    try {
      await registerDefaultApp();
      const status = await isDefaultAppRegistered();
      setIsRegistered(status);
      setFeedbackMsg("Successfully registered MDSeeker in Windows registry.");
    } catch (err) {
      setFeedbackMsg("Failed to register MDSeeker: " + String(err));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleOpenDefaultApps = async () => {
    try {
      await openDefaultAppsSettings();
    } catch (err) {
      setFeedbackMsg("Failed to open Windows settings: " + String(err));
    }
  };

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

      {/* Windows Default Apps Integration */}
      <div className="pt-4 border-t border-[var(--fluent-border-divider)] space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--fluent-text-primary)]">
            Windows Integration
          </h3>
          <p className="text-[12px] text-[var(--fluent-text-secondary)] mt-0.5">
            Manage file associations and default application registration for Markdown documents.
          </p>
        </div>

        <div className="p-3.5 rounded-[var(--fluent-radius-md)] bg-[var(--fluent-bg-card)] border border-[var(--fluent-border-card)] space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-[var(--fluent-text-primary)]">
                  Windows Default App Registration
                </span>
                {isRegistered ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Registered
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Not Registered
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--fluent-text-secondary)] leading-relaxed">
                Registers MDSeeker with Windows 10/11 Default Apps and File Explorer for .md and .markdown documents.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleOpenDefaultApps}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-[var(--fluent-radius-md)] bg-[var(--fluent-accent)] text-white hover:opacity-90 active:scale-98 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Windows Default Apps</span>
            </button>

            <button
              type="button"
              onClick={handleRegisterApp}
              disabled={isRegistering}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-[var(--fluent-radius-md)] bg-[var(--fluent-bg-subtle)] text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] border border-[var(--fluent-border-card)] active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegistering ? "animate-spin" : ""}`} />
              <span>{isRegistering ? "Registering..." : "Re-register Associations"}</span>
            </button>
          </div>
          {feedbackMsg && (
            <p className="text-[11px] text-[var(--fluent-accent)] font-medium pt-1">
              {feedbackMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
