import { Plus } from "lucide-react";
import { DocumentTab, TabItem } from "./DocumentTab";
import { Tooltip } from "@/components/common/Tooltip";

export function TabBar() {
  // Visual welcome tab representation for Phase 2
  const welcomeTab: TabItem = {
    id: "welcome",
    title: "Welcome",
    isActive: true,
  };

  const handleNewTabClick = () => {
    // Phase 2 scope: placeholder only
    console.info("New tab button clicked - Multi-document tab management is scheduled for Phase 8.");
  };

  return (
    <div
      role="tablist"
      aria-label="Document tabs"
      className="h-[var(--fluent-tabbar-height)] flex items-center px-2 gap-1 bg-[var(--fluent-bg-mica)] border-b border-[var(--fluent-border-divider)] overflow-x-auto select-none flex-shrink-0"
    >
      {/* Welcome tab representation */}
      <DocumentTab tab={welcomeTab} />

      {/* New tab visual button */}
      <Tooltip content="New tab (Phase 8)" position="bottom">
        <button
          type="button"
          onClick={handleNewTabClick}
          aria-label="New document tab"
          className="fluent-icon-btn h-7 w-7 text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)]"
        >
          <Plus className="w-4 h-4" />
        </button>
      </Tooltip>
    </div>
  );
}
