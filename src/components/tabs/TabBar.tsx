import { Plus } from "lucide-react";
import { DocumentTab, TabItem } from "./DocumentTab";
import { Tooltip } from "@/components/common/Tooltip";
import { useDocumentStore } from "@/stores/documentStore";

export function TabBar() {
  const { document, openDocumentDialog, closeDocument } = useDocumentStore();

  const currentTab: TabItem = document
    ? {
        id: document.canonicalPath,
        title: document.fileName,
        path: document.canonicalPath,
        isActive: true,
      }
    : {
        id: "welcome",
        title: "Welcome",
        isActive: true,
      };

  return (
    <div
      role="tablist"
      aria-label="Document tabs"
      className="h-[var(--fluent-tabbar-height)] flex items-center px-2 gap-1 bg-[var(--fluent-bg-mica)] border-b border-[var(--fluent-border-divider)] overflow-x-auto select-none flex-shrink-0"
    >
      {/* Active Tab */}
      <DocumentTab
        tab={currentTab}
        onClose={document ? () => closeDocument() : undefined}
      />

      {/* Open/New Document Button */}
      <Tooltip content="Open Markdown file (Ctrl+O)" position="bottom">
        <button
          type="button"
          onClick={openDocumentDialog}
          aria-label="Open Markdown file"
          className="fluent-icon-btn h-7 w-7 text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)]"
        >
          <Plus className="w-4 h-4" />
        </button>
      </Tooltip>
    </div>
  );
}
