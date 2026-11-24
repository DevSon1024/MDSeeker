import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useUIStore } from "@/stores/uiStore";
import { useDocumentStore } from "@/stores/documentStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useRecentFilesStore } from "@/stores/recentFilesStore";
import { loadSavedSession, flushPendingSettings } from "@/services/settingsService";
import { closeApplicationWindow } from "@/services/windowService";
import { TitleBar } from "@/components/window/TitleBar";
import { TabBar } from "@/components/tabs/TabBar";
import { ReaderToolbar } from "@/components/toolbar/ReaderToolbar";
import { OutlineSidebar } from "@/components/sidebar/OutlineSidebar";
import { Workspace } from "@/components/workspace/Workspace";
import { StatusBar } from "@/components/status/StatusBar";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { initIncomingFileService } from "@/services/incomingFileService";

export default function App() {
  const { initTheme, setViewMode, toggleSidebar, toggleSearch } = useUIStore();
  const { initSettings, openSettings, closeSettings } = useSettingsStore();
  const { initRecentFiles } = useRecentFilesStore();

  const {
    document,
    documents,
    openDocumentDialog,
    loadDocumentByPath,
    closeDocument,
    closeAllDocuments,
    activateNextTab,
    activatePreviousTab,
    activateTabByIndex,
    setIsDraggingOver,
  } = useDocumentStore();

  // Initialize theme, settings, and recent files on mount, and handle window flush
  useEffect(() => {
    initTheme();
    initSettings();
    initRecentFiles();

    const handleBeforeUnload = () => {
      flushPendingSettings();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [initTheme, initSettings, initRecentFiles]);

  // Reveal native window smoothly once React DOM is painted and theme initialized to eliminate white flash
  useEffect(() => {
    const frameId = requestAnimationFrame(async () => {
      try {
        const appWindow = getCurrentWindow();
        if (appWindow && typeof appWindow.show === "function") {
          await appWindow.show();
        }
        if (appWindow && typeof appWindow.setFocus === "function") {
          await appWindow.setFocus();
        }
      } catch {
        // Outside Tauri desktop environment
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, []);

  // Window close confirmation when multiple tabs are open
  useEffect(() => {
    let unlistenClose: (() => void) | undefined;

    async function setupCloseHandler() {
      try {
        const appWindow = getCurrentWindow();
        unlistenClose = await appWindow.onCloseRequested((event) => {
          flushPendingSettings();
          const currentDocs = useDocumentStore.getState().documents;
          const { behavior } = useSettingsStore.getState().settings;
          if (behavior.confirmCloseWithMultipleTabs && currentDocs.length > 1) {
            const confirmed = window.confirm(
              `You have ${currentDocs.length} open tabs. Are you sure you want to close MDSeeker?`
            );
            if (!confirmed) {
              event.preventDefault();
            }
          }
        });
      } catch {
        // Outside Tauri desktop environment
      }
    }

    setupCloseHandler();

    return () => {
      if (unlistenClose) {
        unlistenClose();
      }
    };
  }, []);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if user is typing inside an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Alt+F4: Close MDSeeker application window
      if (e.altKey && (e.key === "F4" || e.code === "F4")) {
        e.preventDefault();
        closeApplicationWindow();
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();

        // Shift modifier combinations
        if (e.shiftKey) {
          if (key === "tab") {
            e.preventDefault();
            activatePreviousTab();
          } else if (key === "w") {
            e.preventDefault();
            const { behavior } = useSettingsStore.getState().settings;
            if (behavior.confirmCloseWithMultipleTabs && documents.length > 1) {
              if (window.confirm("Are you sure you want to close all open tabs?")) {
                closeAllDocuments();
              }
            } else {
              closeAllDocuments();
            }
          } else if (key === "o") {
            e.preventDefault();
            toggleSidebar();
          }
          return;
        }

        // Settings Shortcut: Ctrl+,
        if (key === "," || e.code === "Comma") {
          e.preventDefault();
          if (useSettingsStore.getState().isSettingsOpen) {
            closeSettings();
          } else {
            openSettings();
          }
          return;
        }

        // Standard Ctrl combinations
        if (key === "tab") {
          e.preventDefault();
          activateNextTab();
        } else if (key === "o") {
          e.preventDefault();
          openDocumentDialog();
        } else if (key === "w") {
          e.preventDefault();
          if (documents.length > 0 || document) {
            closeDocument();
          }
        } else if (["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(key)) {
          e.preventDefault();
          const tabIndex = parseInt(key, 10) - 1;
          activateTabByIndex(tabIndex);
        } else if (key === "b") {
          e.preventDefault();
          toggleSidebar();
        } else if (key === "f") {
          e.preventDefault();
          toggleSearch();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    setViewMode,
    toggleSidebar,
    toggleSearch,
    openDocumentDialog,
    closeDocument,
    closeAllDocuments,
    activateNextTab,
    activatePreviousTab,
    activateTabByIndex,
    openSettings,
    closeSettings,
    document,
    documents.length,
  ]);

  // Drag and Drop Integration
  useEffect(() => {
    let unlistenTauriDrag: (() => void) | undefined;

    // Prevent default browser drop navigation
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      // Only set to false if leaving the window
      if (!e.relatedTarget || e.relatedTarget === window) {
        setIsDraggingOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    // Tauri 2 native window drag-drop event listener
    async function setupTauriDragDrop() {
      try {
        const appWindow = getCurrentWindow();
        unlistenTauriDrag = await appWindow.onDragDropEvent((event) => {
          if (event.payload.type === "over") {
            setIsDraggingOver(true);
          } else if (event.payload.type === "drop") {
            setIsDraggingOver(false);
            const paths = event.payload.paths;
            if (paths && paths.length > 0) {
              for (const p of paths) {
                loadDocumentByPath(p);
              }
            }
          } else {
            setIsDraggingOver(false);
          }
        });
      } catch {
        // Outside Tauri environment (e.g. browser tests)
      }
    }

    setupTauriDragDrop();

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
      if (unlistenTauriDrag) {
        unlistenTauriDrag();
      }
    };
  }, [loadDocumentByPath, setIsDraggingOver]);

  // Listen for incoming files (CLI arguments, Explorer double-click, and second-instance forwards)
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let isCancelled = false;

    async function coordinateStartupAndIncomingFiles() {
      let incomingFilesReceived = false;

      try {
        unlisten = await initIncomingFileService(async (filePaths) => {
          if (isCancelled) return;
          if (filePaths.length > 0) {
            incomingFilesReceived = true;
            for (const path of filePaths) {
              await loadDocumentByPath(path);
            }
          }
        });
      } catch (err) {
        console.error("Failed to setup incoming files:", err);
      }

      // Incoming Windows file paths take strict precedence over restored session state
      if (!incomingFilesReceived && !isCancelled) {
        const { behavior } = useSettingsStore.getState().settings;
        if (behavior.restoreLastSession) {
          const session = loadSavedSession();
          if (session && Array.isArray(session.openPaths) && session.openPaths.length > 0) {
            if (useDocumentStore.getState().documents.length === 0) {
              for (const path of session.openPaths) {
                if (isCancelled) return;
                try {
                  await loadDocumentByPath(path);
                } catch {
                  // Tolerate deleted or relocated files without breaking restoration of other tabs
                }
              }
              if (session.activePath && !isCancelled) {
                const matched = useDocumentStore.getState().findDocumentByPath(session.activePath);
                if (matched) {
                  useDocumentStore.getState().setActiveDocument(matched.id);
                }
              }
              if (session.viewMode && !isCancelled) {
                useUIStore.getState().setViewMode(session.viewMode);
              }
            }
          }
        }
      }
    }

    coordinateStartupAndIncomingFiles();

    return () => {
      isCancelled = true;
      if (unlisten) {
        unlisten();
      }
    };
  }, [loadDocumentByPath]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--fluent-bg-mica)] text-[var(--fluent-text-primary)] font-sans antialiased border border-[var(--fluent-border-divider)] box-border">
      {/* 1. Custom Title Bar */}
      <TitleBar />

      {/* 2. Document Tab Bar */}
      <TabBar />

      {/* 3. Main Toolbar */}
      <ReaderToolbar />

      {/* 4. Workspace Area: Sidebar + Main Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <OutlineSidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--fluent-bg-window)]">
          <Workspace />
        </main>
      </div>

      {/* 5. Status Bar */}
      <StatusBar />

      {/* 6. Settings & Preferences Dialog */}
      <SettingsDialog />
    </div>
  );
}
