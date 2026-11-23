import React, { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useUIStore } from "@/stores/uiStore";

// Windows 11 style SVG icons for window buttons
function MinimizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <rect y="4.5" width="10" height="1" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="0.5" y="0.5" width="9" height="9" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M2.5 0.5H9.5V7.5" />
      <rect x="0.5" y="2.5" width="7" height="7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <path d="M0.707 0L0 0.707 4.293 5 0 9.293l0.707 0.707L5 5.707l4.293 4.293 0.707-0.707L5.707 5 10 0.707 9.293 0 5 4.293 0.707 0z" />
    </svg>
  );
}

export function WindowControls() {
  const { isMaximized, setIsMaximized } = useUIStore();

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function checkMaximized() {
      try {
        const appWindow = getCurrentWindow();
        const max = await appWindow.isMaximized();
        setIsMaximized(max);

        // Listen for window resize to track maximize/restore
        unlisten = await appWindow.onResized(async () => {
          try {
            const isMax = await appWindow.isMaximized();
            setIsMaximized(isMax);
          } catch {
            // ignore
          }
        });
      } catch {
        // Not running in Tauri window environment (e.g. browser preview)
      }
    }

    checkMaximized();

    return () => {
      if (unlisten) unlisten();
    };
  }, [setIsMaximized]);

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (err) {
      console.warn("Minimize window called outside Tauri environment", err);
    }
  };

  const handleToggleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
      const max = await appWindow.isMaximized();
      setIsMaximized(max);
    } catch (err) {
      console.warn("Toggle maximize called outside Tauri environment", err);
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (err) {
      console.warn("Close window called outside Tauri environment", err);
    }
  };

  return (
    <div className="flex items-center h-full tauri-no-drag">
      <button
        type="button"
        onClick={handleMinimize}
        aria-label="Minimize"
        title="Minimize"
        className="fluent-window-btn"
      >
        <MinimizeIcon />
      </button>

      <button
        type="button"
        onClick={handleToggleMaximize}
        aria-label={isMaximized ? "Restore Down" : "Maximize"}
        title={isMaximized ? "Restore Down" : "Maximize"}
        className="fluent-window-btn"
      >
        {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
      </button>

      <button
        type="button"
        onClick={handleClose}
        aria-label="Close"
        title="Close"
        className="fluent-window-btn fluent-window-btn-close"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
