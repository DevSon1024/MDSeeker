import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useUIStore } from "@/stores/uiStore";
import { useDocumentStore } from "@/stores/documentStore";
import { TitleBar } from "@/components/window/TitleBar";
import { TabBar } from "@/components/tabs/TabBar";
import { ReaderToolbar } from "@/components/toolbar/ReaderToolbar";
import { OutlineSidebar } from "@/components/sidebar/OutlineSidebar";
import { Workspace } from "@/components/workspace/Workspace";
import { StatusBar } from "@/components/status/StatusBar";
import { initIncomingFileService } from "@/services/incomingFileService";

export default function App() {
  const { initTheme, setViewMode, toggleSidebar, toggleSearch } = useUIStore();
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

  useEffect(() => {
    initTheme();

    // Keyboard Shortcuts Handler
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if user is typing inside an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
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
            closeAllDocuments();
          } else if (key === "o") {
            e.preventDefault();
            toggleSidebar();
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
    initTheme,
    setViewMode,
    toggleSidebar,
    toggleSearch,
    openDocumentDialog,
    closeDocument,
    closeAllDocuments,
    activateNextTab,
    activatePreviousTab,
    activateTabByIndex,
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

    async function setupIncomingFiles() {
      try {
        unlisten = await initIncomingFileService(async (filePaths) => {
          if (isCancelled) return;
          for (const path of filePaths) {
            await loadDocumentByPath(path);
          }
        });
      } catch (err) {
        console.error("Failed to setup incoming files:", err);
      }
    }

    setupIncomingFiles();

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
    </div>
  );
}
