import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useDocumentStore } from "@/stores/documentStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { flushPendingSettings } from "@/services/settingsService";

/**
 * Registers MDSeeker as a default application in the Windows registry for .md and .markdown.
 */
export async function registerDefaultApp(): Promise<void> {
  await invoke("register_default_app");
}

/**
 * Checks whether MDSeeker is registered under HKCU\Software\RegisteredApplications.
 */
export async function isDefaultAppRegistered(): Promise<boolean> {
  try {
    return await invoke<boolean>("is_default_app_registered");
  } catch {
    return false;
  }
}

/**
 * Opens the Windows Default Apps system settings page (ms-settings:defaultapps).
 */
export async function openDefaultAppsSettings(): Promise<void> {
  await invoke("open_default_apps_settings");
}

/**
 * Closes the application window safely with confirmation and persistence flush.
 * Handles multiple-tab confirmation, flushes settings, and destroys the window.
 */
export async function closeApplicationWindow(): Promise<void> {
  flushPendingSettings();

  const currentDocs = useDocumentStore.getState().documents;
  const { behavior } = useSettingsStore.getState().settings;

  if (behavior.confirmCloseWithMultipleTabs && currentDocs.length > 1) {
    const confirmed = window.confirm(
      `You have ${currentDocs.length} open tabs. Are you sure you want to close MDSeeker?`
    );
    if (!confirmed) {
      return;
    }
  }

  try {
    const appWindow = getCurrentWindow();
    await appWindow.destroy();
  } catch {
    try {
      await invoke("close_window");
    } catch {
      if (typeof window !== "undefined" && typeof window.close === "function") {
        window.close();
      }
    }
  }
}
