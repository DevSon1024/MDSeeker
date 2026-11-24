import { invoke } from "@tauri-apps/api/core";
import { HighlightResult } from "@/types/markdown";

const highlightCache = new Map<string, HighlightResult>();
const MAX_CACHE_SIZE = 500;
const EVICTION_BATCH_SIZE = 50;

/**
 * Clears the in-memory syntax highlighting cache.
 */
export function clearHighlightCache(): void {
  highlightCache.clear();
}

/**
 * Returns the current number of cached highlighted snippets.
 */
export function getHighlightCacheSize(): number {
  return highlightCache.size;
}

/**
 * Highlights a block of code using Rust syntect and returns structured tokens.
 * Caches results in memory to prevent duplicate IPC roundtrips across renders.
 */
export async function highlightCode(
  code: string,
  language?: string | null,
  theme?: "light" | "dark"
): Promise<HighlightResult> {
  const cacheKey = `${theme || "dark"}:${language || ""}:${code}`;

  const cached = highlightCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const result = await invoke<HighlightResult>("highlight_code", {
      code,
      language: language || null,
      theme: theme || null,
    });

    if (highlightCache.size >= MAX_CACHE_SIZE) {
      // Evict oldest entries in batch to prevent frequent micro-evictions
      const keysToDelete: string[] = [];
      for (const key of highlightCache.keys()) {
        keysToDelete.push(key);
        if (keysToDelete.length >= EVICTION_BATCH_SIZE) break;
      }
      for (const key of keysToDelete) {
        highlightCache.delete(key);
      }
    }

    highlightCache.set(cacheKey, result);
    return result;
  } catch (err) {
    // In Happy-DOM tests or when IPC fails, provide graceful plain text token fallback
    const lines = code.split("\n").map((line, idx, arr) => ({
      tokens: [
        {
          content: line + (idx < arr.length - 1 ? "\n" : ""),
        },
      ],
    }));

    const fallbackResult: HighlightResult = {
      lines,
      language: language || "Plain Text",
    };

    if (highlightCache.size >= MAX_CACHE_SIZE) {
      const keysToDelete: string[] = [];
      for (const key of highlightCache.keys()) {
        keysToDelete.push(key);
        if (keysToDelete.length >= EVICTION_BATCH_SIZE) break;
      }
      for (const key of keysToDelete) {
        highlightCache.delete(key);
      }
    }

    highlightCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}
