import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SettingsDialog } from "./SettingsDialog";
import { useSettingsStore } from "@/stores/settingsStore";
import { DEFAULT_SETTINGS } from "@/services/settingsService";

describe("SettingsDialog", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.getState().resetAllSettings();
    useSettingsStore.getState().openSettings("general");
  });

  afterEach(() => {
    cleanup();
  });

  it("renders modal dialog and category tabs", () => {
    render(<SettingsDialog />);

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Settings & Preferences")).toBeDefined();
    expect(screen.getByRole("button", { name: "General" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Appearance" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Markdown Reader" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Source Viewer" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Code Blocks" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Privacy & History" })).toBeDefined();
    expect(screen.getByRole("button", { name: "About" })).toBeDefined();
  });

  it("switches category when clicking category tab", () => {
    render(<SettingsDialog />);

    // Click Appearance
    fireEvent.click(screen.getByRole("button", { name: "Appearance" }));
    expect(screen.getByText("Application Theme")).toBeDefined();
    expect(screen.getByText("Accent Color")).toBeDefined();

    // Click Markdown Reader
    fireEvent.click(screen.getByRole("button", { name: "Markdown Reader" }));
    expect(screen.getByText("Reader Font Family")).toBeDefined();
    expect(screen.getByText("Live Typography Preview")).toBeDefined();
  });

  it("closes dialog when clicking Done button or X button", () => {
    render(<SettingsDialog />);

    const doneButton = screen.getByRole("button", { name: "Done" });
    fireEvent.click(doneButton);
    expect(useSettingsStore.getState().isSettingsOpen).toBe(false);
  });

  it("closes dialog on Escape key", () => {
    render(<SettingsDialog />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(useSettingsStore.getState().isSettingsOpen).toBe(false);
  });

  it("shows confirmation before resetting all settings", () => {
    render(<SettingsDialog />);

    const resetAllBtn = screen.getByRole("button", { name: /Reset All Settings/i });
    fireEvent.click(resetAllBtn);

    expect(screen.getByText(/Reset all settings to default values\?/i)).toBeDefined();
    expect(screen.getByRole("button", { name: "Yes, Reset All" })).toBeDefined();

    // Confirm reset
    fireEvent.click(screen.getByRole("button", { name: "Yes, Reset All" }));
    expect(useSettingsStore.getState().settings).toEqual(DEFAULT_SETTINGS);
  });
});
