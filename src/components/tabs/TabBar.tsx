import React, { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { DocumentTab, TabItem } from "./DocumentTab";
import { TabContextMenu } from "./TabContextMenu";
import { Tooltip } from "@/components/common/Tooltip";
import { useDocumentStore } from "@/stores/documentStore";

export function TabBar() {
  const {
    documents,
    document,
    activeDocumentId,
    setActiveDocument,
    closeDocument,
    closeOtherDocuments,
    closeTabsToTheRight,
    closeAllDocuments,
    openDocumentDialog,
    reorderDocuments,
  } = useDocumentStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    docId: string;
    filePath: string;
    fileName: string;
    index: number;
  } | null>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (containerRef.current) {
      containerRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleContextMenu = (docId: string, e: React.MouseEvent) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    const index = documents.findIndex((d) => d.id === docId);

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      docId,
      filePath: doc.canonicalPath,
      fileName: doc.fileName,
      index,
    });
  };

  // Provide fallback to single-document state if documents collection is empty
  const effectiveDocs =
    documents.length > 0
      ? documents.map((doc) => ({
          id: doc.id,
          title: doc.fileName,
          path: doc.canonicalPath,
          isActive: doc.id === activeDocumentId,
          isLoading: doc.isLoading || doc.isParsing,
          hasError: !!(doc.error || doc.parseError),
        }))
      : document
      ? [
          {
            id: document.canonicalPath || "active-doc",
            title: document.fileName,
            path: document.canonicalPath,
            isActive: true,
            isLoading: false,
            hasError: false,
          },
        ]
      : [];

  return (
    <>
      <div
        ref={containerRef}
        onWheel={handleWheel}
        role="tablist"
        aria-label="Document tabs"
        className="h-[var(--fluent-tabbar-height)] flex items-center px-2 gap-1 bg-[var(--fluent-bg-mica)] border-b border-[var(--fluent-border-divider)] overflow-x-auto select-none flex-shrink-0 scrollbar-none"
      >
        {/* If no documents are open, display welcome placeholder tab */}
        {effectiveDocs.length === 0 ? (
          <DocumentTab
            tab={{
              id: "welcome",
              title: "Welcome",
              isActive: true,
            }}
          />
        ) : (
          effectiveDocs.map((tabDoc, idx) => {
            const tabItem: TabItem = {
              id: tabDoc.id,
              title: tabDoc.title,
              path: tabDoc.path,
              isActive: tabDoc.isActive,
              isLoading: tabDoc.isLoading,
              hasError: tabDoc.hasError,
            };

            return (
              <DocumentTab
                key={tabDoc.id}
                tab={tabItem}
                draggable={documents.length > 0}
                onSelect={(id) => setActiveDocument(id)}
                onClose={(id) => closeDocument(id)}
                onContextMenu={(id, e) => handleContextMenu(id, e)}
                onDragStart={() => setDraggedIndex(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedIndex !== null && draggedIndex !== idx) {
                    reorderDocuments(draggedIndex, idx);
                  }
                  setDraggedIndex(null);
                }}
              />
            );
          })
        )}

        {/* Open / New Document Button */}
        <Tooltip content="Open Markdown file (Ctrl+O)" position="bottom">
          <button
            type="button"
            onClick={openDocumentDialog}
            aria-label="Open Markdown file"
            className="fluent-icon-btn h-7 w-7 text-[var(--fluent-text-secondary)] hover:text-[var(--fluent-text-primary)] flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      {/* Tab Context Menu */}
      {contextMenu && (
        <TabContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          documentId={contextMenu.docId}
          filePath={contextMenu.filePath}
          fileName={contextMenu.fileName}
          isOnlyTab={documents.length <= 1}
          isLastTab={contextMenu.index === documents.length - 1}
          onClose={() => setContextMenu(null)}
          onCloseTab={(id) => closeDocument(id)}
          onCloseOtherTabs={(id) => closeOtherDocuments(id)}
          onCloseTabsToTheRight={(id) => closeTabsToTheRight(id)}
          onCloseAllTabs={closeAllDocuments}
        />
      )}
    </>
  );
}
