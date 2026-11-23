import { invoke } from "@tauri-apps/api/core";
import { MarkdownDocument, MarkdownParseOptions, ParseError } from "@/types/markdown";

/**
 * Parses raw Markdown content through the Rust backend pulldown-cmark engine.
 * Returns a serializable MarkdownDocument AST.
 */
export async function parseMarkdown(
  content: string,
  options?: MarkdownParseOptions
): Promise<MarkdownDocument> {
  try {
    return await invoke<MarkdownDocument>("parse_markdown", {
      content,
      options: options ?? null,
    });
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && "message" in err) {
      throw err as ParseError;
    }

    throw {
      code: "PARSE_FAILED",
      message: typeof err === "string" ? err : "Failed to parse Markdown document.",
      details: err instanceof Error ? err.message : undefined,
    } as ParseError;
  }
}
