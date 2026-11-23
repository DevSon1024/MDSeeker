import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  DocumentMetadata,
  DocumentResponse,
  FileErrorResponse,
  LoadedDocument,
  ValidationResult,
} from "@/types/document";

/**
 * Opens native Windows file dialog filtered for Markdown documents.
 * Returns the selected absolute path or null if canceled.
 */
export async function openMarkdownFileDialog(): Promise<string | null> {
  try {
    const selected = await open({
      multiple: false,
      directory: false,
      title: "Open Markdown Document",
      filters: [
        {
          name: "Markdown Documents (*.md, *.markdown)",
          extensions: ["md", "markdown"],
        },
      ],
    });

    if (!selected) {
      return null;
    }

    if (Array.isArray(selected)) {
      return selected.length > 0 ? selected[0] : null;
    }

    return selected;
  } catch (err) {
    console.error("Failed to open file dialog:", err);
    throw {
      code: "DIALOG_ERROR",
      message: "Failed to open native Windows file dialog.",
      details: err instanceof Error ? err.message : String(err),
    } as FileErrorResponse;
  }
}

/**
 * Reads a Markdown file through the Rust backend file manager.
 */
export async function readMarkdownFile(filePath: string): Promise<LoadedDocument> {
  try {
    const response = await invoke<DocumentResponse>("read_markdown_file", { path: filePath });
    return {
      canonicalPath: response.canonical_path,
      fileName: response.file_name,
      fileExtension: response.file_extension,
      fileSizeBytes: response.file_size_bytes,
      lastModifiedTimestamp: response.last_modified_timestamp,
      rawContent: response.raw_content,
    };
  } catch (err) {
    // If Rust returned a structured FileErrorResponse, cast and rethrow
    if (typeof err === "object" && err !== null && "code" in err && "message" in err) {
      throw err as FileErrorResponse;
    }

    throw {
      code: "READ_FAILED",
      message: typeof err === "string" ? err : "An unexpected error occurred while reading the file.",
      path: filePath,
      details: err instanceof Error ? err.message : undefined,
    } as FileErrorResponse;
  }
}

/**
 * Validates a Markdown file path without loading full content into memory.
 */
export async function validateMarkdownFile(filePath: string): Promise<ValidationResult> {
  return await invoke<ValidationResult>("validate_markdown_file", { path: filePath });
}

/**
 * Retrieves file metadata from the Rust backend.
 */
export async function getFileMetadata(filePath: string): Promise<DocumentMetadata> {
  return await invoke<DocumentMetadata>("get_file_metadata", { path: filePath });
}

/**
 * Reveals a file in Windows File Explorer.
 */
export async function revealInFileExplorer(filePath: string): Promise<void> {
  await invoke("reveal_in_explorer", { path: filePath });
}
