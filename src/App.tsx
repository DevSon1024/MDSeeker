import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { TitleBar } from "@/components/window/TitleBar";
import { TabBar } from "@/components/tabs/TabBar";
import { ReaderToolbar } from "@/components/toolbar/ReaderToolbar";
import { OutlineSidebar } from "@/components/sidebar/OutlineSidebar";
import { EmptyWorkspace } from "@/components/workspace/EmptyWorkspace";
import { StatusBar } from "@/components/status/StatusBar";

export default function App() {
  const { initTheme, setViewMode, toggleSidebar, toggleSearch } = useUIStore();

  useEffect(() => {
    initTheme();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "1") {
          e.preventDefault();
          setViewMode("reading");
        } else if (e.key === "2") {
          e.preventDefault();
          setViewMode("source");
        } else if (e.key === "3") {
          e.preventDefault();
          setViewMode("split");
        } else if (e.key.toLowerCase() === "b") {
          e.preventDefault();
          toggleSidebar();
        } else if (e.key.toLowerCase() === "f") {
          e.preventDefault();
          toggleSearch();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [initTheme, setViewMode, toggleSidebar, toggleSearch]);

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
          <EmptyWorkspace />
        </main>
      </div>

      {/* 5. Status Bar */}
      <StatusBar />
    </div>
  );
}
