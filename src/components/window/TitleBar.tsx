import { getCurrentWindow } from "@tauri-apps/api/window";
import { WindowControls } from "./WindowControls";
import { FileCode2 } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useDocumentStore } from "@/stores/documentStore";

export function TitleBar() {
  const { setIsMaximized } = useUIStore();
  const { document } = useDocumentStore();

  const handleDoubleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
      const max = await appWindow.isMaximized();
      setIsMaximized(max);
    } catch {
      // ignore outside tauri
    }
  };

  return (
    <header
      className="h-[var(--fluent-titlebar-height)] flex items-center justify-between border-b border-[var(--fluent-border-divider)] bg-[var(--fluent-bg-mica)] text-[var(--fluent-text-primary)] select-none pl-3 pr-0 z-40 relative flex-shrink-0"
    >
      {/* Brand Identity / Left Section */}
      <div className="flex items-center gap-2 tauri-no-drag pointer-events-auto">
        <div className="w-4 h-4 text-[var(--fluent-accent)] flex items-center justify-center">
          <FileCode2 className="w-3.5 h-3.5" />
        </div>
        <span className="text-[12px] font-medium tracking-tight text-[var(--fluent-text-secondary)]">
          MDSeeker
        </span>
      </div>

      {/* Middle Window Drag Area with Document Title */}
      <div
        data-tauri-drag-region
        onDoubleClick={handleDoubleClick}
        className="flex-1 h-full flex items-center justify-center text-[12px] text-[var(--fluent-text-secondary)] truncate px-4 cursor-default tauri-drag-region"
      >
        {document ? (
          <span className="truncate max-w-sm font-medium pointer-events-none">
            {document.fileName}
          </span>
        ) : null}
      </div>

      {/* Window Controls */}
      <WindowControls />
    </header>
  );
}
