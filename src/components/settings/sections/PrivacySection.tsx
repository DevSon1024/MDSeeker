import React, { useState } from "react";
import { RotateCcw, Trash2, Clock, X, FileText } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useRecentFilesStore } from "@/stores/recentFilesStore";
import { SettingSelect } from "../controls/SettingSelect";
import { SettingToggle } from "../controls/SettingToggle";

export const PrivacySection: React.FC = () => {
  const { settings, updatePrivacy, resetCategory } = useSettingsStore();
  const { privacy } = settings;
  const { recentFiles, removeRecentFile, clearRecentFiles } = useRecentFilesStore();

  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearHistory = () => {
    clearRecentFiles();
    setConfirmClear(false);
  };

  const formatTimestamp = (ts: number): string => {
    const elapsed = Date.now() - ts;
    const mins = Math.floor(elapsed / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--fluent-border-divider)]">
        <div>
          <h2 className="text-base font-semibold text-[var(--fluent-text-primary)]">Privacy & History</h2>
          <p className="text-[12px] text-[var(--fluent-text-secondary)] mt-0.5">
            Manage local file history and privacy preferences.
          </p>
        </div>
        <button
          type="button"
          onClick={() => resetCategory("privacy")}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] hover:bg-[var(--fluent-bg-subtle-hover)] rounded-[var(--fluent-radius-md)] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Section</span>
        </button>
      </div>

      <div className="space-y-1">
        <SettingToggle
          label="Remember Recent Files"
          description="Keep a local list of recently opened Markdown files"
          checked={privacy.rememberRecentFiles}
          onChange={(val) => {
            updatePrivacy({ rememberRecentFiles: val });
            if (!val) {
              clearRecentFiles();
            }
          }}
        />

        <SettingSelect
          label="Maximum Recent Files"
          description="Number of recent documents to preserve in history"
          value={privacy.recentFilesLimit}
          disabled={!privacy.rememberRecentFiles}
          options={[
            { value: 5, label: "5 files" },
            { value: 10, label: "10 files" },
            { value: 20, label: "20 files" },
          ]}
          onChange={(val) => updatePrivacy({ recentFilesLimit: Number(val) })}
        />
      </div>

      {/* History Management */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--fluent-text-secondary)]" />
            <h3 className="text-[13px] font-semibold text-[var(--fluent-text-primary)]">
              Recent Documents History ({recentFiles.length})
            </h3>
          </div>

          {recentFiles.length > 0 && (
            <div>
              {confirmClear ? (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                  <span className="text-[11px] text-[var(--fluent-text-secondary)]">Clear all?</span>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="px-2 py-0.5 text-[11px] font-medium bg-[var(--fluent-close-hover)] text-white rounded-[var(--fluent-radius-xs)] hover:bg-[var(--fluent-close-active)] transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-0.5 text-[11px] text-[var(--fluent-text-secondary)] hover:bg-[var(--fluent-bg-subtle-hover)] rounded-[var(--fluent-radius-xs)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-[var(--fluent-radius-md)] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>
          )}
        </div>

        {recentFiles.length === 0 ? (
          <div className="py-6 text-center rounded-[var(--fluent-radius-md)] border border-dashed border-[var(--fluent-border-divider)] text-[var(--fluent-text-secondary)] text-[12px]">
            No recent documents recorded
          </div>
        ) : (
          <div className="max-h-56 overflow-y-auto space-y-1 rounded-[var(--fluent-radius-md)] border border-[var(--fluent-border-card)] bg-[var(--fluent-bg-card)] p-1.5 divide-y divide-[var(--fluent-border-subtle)]">
            {recentFiles.map((file) => (
              <div
                key={file.path}
                className="flex items-center justify-between py-2 px-2.5 rounded-[var(--fluent-radius-sm)] hover:bg-[var(--fluent-bg-subtle-hover)] group transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                  <FileText className="w-4 h-4 text-[var(--fluent-accent)] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-[var(--fluent-text-primary)] truncate">
                      {file.fileName}
                    </p>
                    <p className="text-[10px] text-[var(--fluent-text-secondary)] font-mono truncate" title={file.path}>
                      {file.path}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-[var(--fluent-text-tertiary)]">
                    {formatTimestamp(file.lastOpened)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRecentFile(file.path)}
                    title="Remove from history"
                    aria-label={`Remove ${file.fileName} from recent history`}
                    className="p-1 text-[var(--fluent-text-secondary)] hover:text-red-500 hover:bg-[var(--fluent-bg-subtle-active)] rounded-[var(--fluent-radius-xs)] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
