import { create } from "zustand";
import { FileErrorResponse, LoadedDocument } from "@/types/document";
import { MarkdownDocument, ParseError } from "@/types/markdown";
import { openMarkdownFileDialog, readMarkdownFile } from "@/services/documentService";
import { parseMarkdown } from "@/services/markdownService";

export interface DocumentState {
  document: LoadedDocument | null;
  parsedDocument: MarkdownDocument | null;
  isLoading: boolean;
  isParsing: boolean;
  error: FileErrorResponse | null;
  parseError: ParseError | null;
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
      isParsing: false,
      error: null,
      parseError: null,
      parsedDocument: null,
      currentRequestId: requestId,
    });

    try {
      const doc = await readMarkdownFile(filePath);

      // Verify request is still the most recent before applying state
      if (get().currentRequestId === requestId) {
        set({
          document: doc,
          isLoading: false,
          isParsing: true,
          error: null,
        });

        // Asynchronously parse raw markdown through Rust pulldown-cmark engine
        try {
          const parsed = await parseMarkdown(doc.rawContent);
          if (get().currentRequestId === requestId) {
            set({
              parsedDocument: parsed,
              isParsing: false,
              parseError: null,
            });
          }
        } catch (parseErr) {
          if (get().currentRequestId === requestId) {
            set({
              parseError: parseErr as ParseError,
              isParsing: false,
            });
          }
        }
      }
    } catch (err) {
      if (get().currentRequestId === requestId) {
        set({
          error: err as FileErrorResponse,
          isLoading: false,
          isParsing: false,
        });
      }
    }
  },

  closeDocument: () => {
    set({
      document: null,
      parsedDocument: null,
      error: null,
      parseError: null,
      isLoading: false,
      isParsing: false,
    });
  },

  dismissError: () => {
    set({ error: null, parseError: null });
  },

  setIsDraggingOver: (isDragging: boolean) => {
    set({ isDraggingOver: isDragging });
  },
}));
