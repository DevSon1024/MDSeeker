import { create } from "zustand";
import { FileErrorResponse, LoadedDocument } from "@/types/document";
import { openMarkdownFileDialog, readMarkdownFile } from "@/services/documentService";

export interface DocumentState {
  document: LoadedDocument | null;
  isLoading: boolean;
  error: FileErrorResponse | null;
  isDraggingOver: boolean;
  currentRequestId: number;

  openDocumentDialog: () => Promise<void>;
  loadDocumentByPath: (filePath: string) => Promise<void>;
  closeDocument: () => void;
  dismissError: () => void;
  setIsDraggingOver: (isDragging: boolean) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  document: null,
  isLoading: false,
  error: null,
  isDraggingOver: false,
  currentRequestId: 0,

  openDocumentDialog: async () => {
    try {
      const selectedPath = await openMarkdownFileDialog();
      if (!selectedPath) {
        // User canceled dialog - do not show error
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

  loadDocumentByPath: async (filePath: string) => {
    // Generate new request ID to prevent race conditions from slower older requests
    const requestId = get().currentRequestId + 1;
    set({
      isLoading: true,
      error: null,
      currentRequestId: requestId,
    });

    try {
      const doc = await readMarkdownFile(filePath);

      // Verify request is still the most recent before applying state
      if (get().currentRequestId === requestId) {
        set({
          document: doc,
          isLoading: false,
          error: null,
        });
      }
    } catch (err) {
      if (get().currentRequestId === requestId) {
        set({
          error: err as FileErrorResponse,
          isLoading: false,
        });
      }
    }
  },

  closeDocument: () => {
    set({
      document: null,
      error: null,
      isLoading: false,
    });
  },

  dismissError: () => {
    set({ error: null });
  },

  setIsDraggingOver: (isDragging: boolean) => {
    set({ isDraggingOver: isDragging });
  },
}));
