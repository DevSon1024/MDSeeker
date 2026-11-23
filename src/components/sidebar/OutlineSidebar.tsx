import { ListTree, X, FileQuestion } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { IconButton } from "@/components/common/IconButton";

export function OutlineSidebar() {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <aside
      aria-label="Document outline"
      className={`transition-all duration-200 ease-out border-r border-[var(--fluent-border-divider)] bg-[var(--fluent-bg-sidebar)] flex flex-col flex-shrink-0 h-full overflow-hidden ${
        isSidebarOpen
          ? "w-[var(--fluent-sidebar-width)] opacity-100"
          : "w-0 opacity-0 pointer-events-none border-r-0"
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-[var(--fluent-border-divider)] select-none flex-shrink-0">
        <div className="flex items-center gap-2">
          <ListTree className="w-4 h-4 text-[var(--fluent-accent)]" />
          <span className="text-[12px] font-semibold text-[var(--fluent-text-primary)]">
            Outline
          </span>
        </div>
        <IconButton
          icon={<X className="w-3.5 h-3.5" />}
          label="Close outline sidebar"
          tooltip="Close (Ctrl+B)"
          size="sm"
          onClick={() => setSidebarOpen(false)}
        />
      </div>

      {/* Empty State Body */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center text-center select-none overflow-y-auto">
        <div className="w-10 h-10 rounded-full bg-[var(--fluent-bg-subtle-hover)] border border-[var(--fluent-border-subtle)] flex items-center justify-center text-[var(--fluent-text-tertiary)] mb-3">
          <FileQuestion className="w-5 h-5" />
        </div>
        <h3 className="text-[13px] font-medium text-[var(--fluent-text-primary)] mb-1">
          No Outline Available
        </h3>
        <p className="text-[11px] text-[var(--fluent-text-secondary)] leading-relaxed max-w-[200px]">
          Document headings (# H1, ## H2) will automatically appear here once a Markdown document is opened.
        </p>
      </div>
    </aside>
  );
}
