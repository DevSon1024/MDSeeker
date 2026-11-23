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

export default function App() {
  const { initTheme, setViewMode, toggleSidebar, toggleSearch } = useUIStore();
  const {
    document,
    openDocumentDialog,
    loadDocumentByPath,
    closeDocument,
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

        if (key === "o") {
          e.preventDefault();
          openDocumentDialog();
        } else if (key === "w") {
          e.preventDefault();
          // If a document is loaded, close it. Do NOT close the application window.
          if (document) {
            closeDocument();
          }
        } else if (key === "1") {
          e.preventDefault();
          setViewMode("reading");
        } else if (key === "2") {
          e.preventDefault();
          setViewMode("source");
        } else if (key === "3") {
          e.preventDefault();
          setViewMode("split");
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
  }, [initTheme, setViewMode, toggleSidebar, toggleSearch, openDocumentDialog, closeDocument, document]);

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
              loadDocumentByPath(paths[0]);
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
