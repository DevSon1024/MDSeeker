import { create } from "zustand";
import { FileErrorResponse, LoadedDocument, OpenDocument } from "@/types/document";
import { MarkdownDocument, ParseError } from "@/types/markdown";
import { openMarkdownFileDialog, readMarkdownFile } from "@/services/documentService";
import { parseMarkdown } from "@/services/markdownService";
import { persistSession } from "@/services/settingsService";
import { useSettingsStore } from "./settingsStore";
import { useUIStore } from "./uiStore";
import { useRecentFilesStore } from "./recentFilesStore";

export interface DocumentState {
  // Multi-document collections
  documents: OpenDocument[];
  activeDocumentId: string | null;

  // Single-document backward compatibility projections (synced to active document)
  document: LoadedDocument | null;
  parsedDocument: MarkdownDocument | null;
  isLoading: boolean;
  isParsing: boolean;
  error: FileErrorResponse | null;
  parseError: ParseError | null;

  isDraggingOver: boolean;
  currentRequestId: number;

  // Actions
  openDocumentDialog: () => Promise<void>;
  loadDocumentByPath: (filePath: string) => Promise<string | null>;
  openDocument: (filePath: string) => Promise<string | null>;
  closeDocument: (id?: string) => void;
  closeActiveDocument: () => void;
  closeOtherDocuments: (id: string) => void;
  closeTabsToTheRight: (id: string) => void;
  closeAllDocuments: () => void;
  setActiveDocument: (id: string) => void;
  getActiveDocument: () => OpenDocument | null;
  findDocumentByPath: (path: string) => OpenDocument | undefined;
  reorderDocuments: (fromIndex: number, toIndex: number) => void;
  updateDocumentScrollPosition: (id: string, mode: "reader" | "source", position: number) => void;
  activateNextTab: () => void;
  activatePreviousTab: () => void;
  activateTabByIndex: (index: number) => void;
  dismissError: (id?: string) => void;
  setIsDraggingOver: (isDragging: boolean) => void;
}

export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").toLowerCase();
}

function maybePersistSession(documents: OpenDocument[], activeDocId: string | null) {
  try {
    const { behavior } = useSettingsStore.getState().settings;
    if (!behavior.restoreLastSession) return;
    const paths = documents
      .map((d) => d.canonicalPath)
      .filter((p) => p && p.trim().length > 0);
    const activeDoc = documents.find((d) => d.id === activeDocId);
    persistSession({
      version: 1,
      openPaths: paths,
      activePath: activeDoc?.canonicalPath || null,
      viewMode: useUIStore.getState().viewMode,
      timestamp: Date.now(),
    });
  } catch {
    // Gracefully ignore storage failures
  }
}

/**
 * Helper to compute synchronized active document state for backward compatibility.
 */
function syncActiveState(documents: OpenDocument[], activeDocumentId: string | null) {
  maybePersistSession(documents, activeDocumentId);
  const activeDoc = documents.find((d) => d.id === activeDocumentId) || null;

  if (!activeDoc) {
    return {
      documents,
      activeDocumentId: null,
      document: null,
      parsedDocument: null,
      isLoading: false,
      isParsing: false,
      error: null,
      parseError: null,
    };
  }

  // If the active document encountered a file error or has not loaded content, document is null
  const loadedDoc: LoadedDocument | null = activeDoc.error
    ? null
    : {
        canonicalPath: activeDoc.canonicalPath,
        fileName: activeDoc.fileName,
        fileExtension: activeDoc.fileExtension,
        fileSizeBytes: activeDoc.fileSizeBytes,
        lastModifiedTimestamp: activeDoc.lastModifiedTimestamp,
        rawContent: activeDoc.rawContent,
      };

  return {
    documents,
    activeDocumentId: activeDoc.id,
    document: loadedDoc,
    parsedDocument: activeDoc.parsedDocument,
    isLoading: activeDoc.isLoading,
    isParsing: activeDoc.isParsing,
    error: activeDoc.error,
    parseError: activeDoc.parseError,
  };
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  activeDocumentId: null,

  document: null,
  parsedDocument: null,
  isLoading: false,
  isParsing: false,
  error: null,
  parseError: null,
  isDraggingOver: false,
  currentRequestId: 0,

  openDocumentDialog: async () => {
    try {
      const selectedPath = await openMarkdownFileDialog();
      if (!selectedPath) {
        return;
      }
      await get().loadDocumentByPath(selectedPath);
    } catch (err) {
      set({
        error: err as FileErrorResponse,
        isLoading: false,
      });
    }
  },

  loadDocumentByPath: async (filePath: string): Promise<string | null> => {
    return get().openDocument(filePath);
  },

  openDocument: async (filePath: string): Promise<string | null> => {
    const norm = normalizePath(filePath);

    // 1. Duplicate Path Detection
    const existing = get().documents.find(
      (d) => normalizePath(d.canonicalPath) === norm || normalizePath(d.id) === norm
    );

    if (existing) {
      get().setActiveDocument(existing.id);
      return existing.id;
    }

    // 2. Create placeholder document in loading state
    const docId = filePath;
    const rawFileName = filePath.split(/[/\\]/).pop() || filePath;
    const rawExtension = rawFileName.includes(".") ? rawFileName.split(".").pop() || "md" : "md";

    const newDoc: OpenDocument = {
      id: docId,
      canonicalPath: filePath,
      fileName: rawFileName,
      fileExtension: rawExtension,
      fileSizeBytes: 0,
      lastModifiedTimestamp: null,
      rawContent: "",
      parsedDocument: null,
      isLoading: true,
      isParsing: false,
      error: null,
      parseError: null,
      lastAccessedAt: Date.now(),
      readerScrollPosition: 0,
      sourceScrollPosition: 0,
    };

    const nextDocs = [...get().documents, newDoc];
    set(syncActiveState(nextDocs, docId));

    const requestId = get().currentRequestId + 1;
    set({ currentRequestId: requestId });

    // 3. Load file via Rust file manager
    try {
      const loaded = await readMarkdownFile(filePath);

      // Verify file wasn't closed while reading
      const currentDoc = get().documents.find((d) => d.id === docId);
      if (!currentDoc) return null;

      // Record in recent files store
      useRecentFilesStore.getState().addRecentFile(loaded.canonicalPath, loaded.fileName);

      // Check if canonical path matches another open document
      const canonicalNorm = normalizePath(loaded.canonicalPath);
      const duplicateCanonical = get().documents.find(
        (d) => d.id !== docId && normalizePath(d.canonicalPath) === canonicalNorm
      );

      if (duplicateCanonical) {
        // Remove temporary placeholder and activate existing
        const cleaned = get().documents.filter((d) => d.id !== docId);
        set(syncActiveState(cleaned, duplicateCanonical.id));
        return duplicateCanonical.id;
      }

      // Update document with loaded file details
      const updatedDocs = get().documents.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            canonicalPath: loaded.canonicalPath,
            fileName: loaded.fileName,
            fileExtension: loaded.fileExtension,
            fileSizeBytes: loaded.fileSizeBytes,
            lastModifiedTimestamp: loaded.lastModifiedTimestamp,
            rawContent: loaded.rawContent,
            isLoading: false,
            isParsing: true,
            error: null,
          };
        }
        return d;
      });

      set(syncActiveState(updatedDocs, get().activeDocumentId));

      // 4. Asynchronously parse Markdown AST
      try {
        const parsed = await parseMarkdown(loaded.rawContent);
        if (get().documents.some((d) => d.id === docId)) {
          const docsWithAst = get().documents.map((d) => {
            if (d.id === docId) {
              return {
                ...d,
                parsedDocument: parsed,
                isParsing: false,
                parseError: null,
              };
            }
            return d;
          });
          set(syncActiveState(docsWithAst, get().activeDocumentId));
        }
      } catch (parseErr) {
        if (get().documents.some((d) => d.id === docId)) {
          const docsWithError = get().documents.map((d) => {
            if (d.id === docId) {
              return {
                ...d,
                parsedDocument: null,
                isParsing: false,
                parseError: parseErr as ParseError,
              };
            }
            return d;
          });
          set(syncActiveState(docsWithError, get().activeDocumentId));
        }
      }

      return docId;
    } catch (readErr) {
      // Mark specific document in error state without affecting other tabs
      const docsWithErr = get().documents.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            isLoading: false,
            isParsing: false,
            error: readErr as FileErrorResponse,
          };
        }
        return d;
      });
      set(syncActiveState(docsWithErr, get().activeDocumentId));
      return docId;
    }
  },

  setActiveDocument: (id: string) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return;

    const updated = get().documents.map((d) =>
      d.id === id ? { ...d, lastAccessedAt: Date.now() } : d
    );
    set(syncActiveState(updated, id));
  },

  getActiveDocument: (): OpenDocument | null => {
    return get().documents.find((d) => d.id === get().activeDocumentId) || null;
  },

  findDocumentByPath: (path: string): OpenDocument | undefined => {
    const norm = normalizePath(path);
    return get().documents.find(
      (d) => normalizePath(d.canonicalPath) === norm || normalizePath(d.id) === norm
    );
  },

  closeDocument: (id?: string) => {
    const { documents, activeDocumentId } = get();

    // Legacy fallback: if documents array is empty but legacy document exists, clear it
    if (documents.length === 0) {
      set({
        documents: [],
        activeDocumentId: null,
        document: null,
        parsedDocument: null,
        isLoading: false,
        isParsing: false,
        error: null,
        parseError: null,
      });
      return;
    }

    const targetId = id || activeDocumentId;
    if (!targetId) return;

    const targetIndex = documents.findIndex((d) => d.id === targetId);
    if (targetIndex === -1) {
      set({
        document: null,
        parsedDocument: null,
        error: null,
        parseError: null,
      });
      return;
    }

    const remaining = documents.filter((d) => d.id !== targetId);

    // If closing active document, select left neighbor if available, else first tab
    let nextActiveId: string | null = activeDocumentId;
    if (targetId === activeDocumentId) {
      if (remaining.length === 0) {
        nextActiveId = null;
      } else {
        const nextIndex = targetIndex > 0 ? targetIndex - 1 : 0;
        nextActiveId = remaining[nextIndex].id;
      }
    }

    set(syncActiveState(remaining, nextActiveId));
  },

  closeActiveDocument: () => {
    const activeId = get().activeDocumentId;
    if (activeId) {
      get().closeDocument(activeId);
    }
  },

  closeOtherDocuments: (id: string) => {
    const keepDoc = get().documents.find((d) => d.id === id);
    if (!keepDoc) return;
    set(syncActiveState([keepDoc], id));
  },

  closeTabsToTheRight: (id: string) => {
    const { documents, activeDocumentId } = get();
    const idx = documents.findIndex((d) => d.id === id);
    if (idx === -1) return;

    const kept = documents.slice(0, idx + 1);
    const activeStillKept = kept.some((d) => d.id === activeDocumentId);
    const nextActiveId = activeStillKept ? activeDocumentId : id;

    set(syncActiveState(kept, nextActiveId));
  },

  closeAllDocuments: () => {
    set(syncActiveState([], null));
  },

  reorderDocuments: (fromIndex: number, toIndex: number) => {
    const { documents, activeDocumentId } = get();
    if (
      fromIndex < 0 ||
      fromIndex >= documents.length ||
      toIndex < 0 ||
      toIndex >= documents.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const reordered = [...documents];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    set(syncActiveState(reordered, activeDocumentId));
  },

  updateDocumentScrollPosition: (id: string, mode: "reader" | "source", position: number) => {
    set((state) => ({
      documents: state.documents.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            ...(mode === "reader"
              ? { readerScrollPosition: position }
              : { sourceScrollPosition: position }),
          };
        }
        return d;
      }),
    }));
  },

  activateNextTab: () => {
    const { documents, activeDocumentId } = get();
    if (documents.length <= 1) return;

    const currentIndex = documents.findIndex((d) => d.id === activeDocumentId);
    const nextIndex = (currentIndex + 1) % documents.length;
    get().setActiveDocument(documents[nextIndex].id);
  },

  activatePreviousTab: () => {
    const { documents, activeDocumentId } = get();
    if (documents.length <= 1) return;

    const currentIndex = documents.findIndex((d) => d.id === activeDocumentId);
    const prevIndex = (currentIndex - 1 + documents.length) % documents.length;
    get().setActiveDocument(documents[prevIndex].id);
  },

  activateTabByIndex: (index: number) => {
    const { documents } = get();
    if (documents.length === 0) return;

    // Ctrl+9 selects the last tab if there are 9 or more tabs
    if (index === 8 && documents.length >= 9) {
      get().setActiveDocument(documents[documents.length - 1].id);
      return;
    }

    if (index >= 0 && index < documents.length) {
      get().setActiveDocument(documents[index].id);
    }
  },

  dismissError: (id?: string) => {
    const targetId = id || get().activeDocumentId;
    if (!targetId) {
      set({ error: null, parseError: null });
      return;
    }

    const updated = get().documents.map((d) =>
      d.id === targetId ? { ...d, error: null, parseError: null } : d
    );
    set(syncActiveState(updated, get().activeDocumentId));
  },

  setIsDraggingOver: (isDragging: boolean) => {
    set({ isDraggingOver: isDragging });
  },
}));
