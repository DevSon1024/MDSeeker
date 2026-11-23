import { convertFileSrc } from "@tauri-apps/api/core";

/**
 * Resolves a Markdown image URL.
 * Supports external HTTP/HTTPS images and local relative paths relative to the document directory.
 */
export function resolveImageUrl(src: string, documentCanonicalPath?: string): string {
  if (!src) return "";

  const trimmed = src.trim();

  // Explicit dangerous schemes blocked
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:")
  ) {
    return "";
  }

  // External web images
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return trimmed;
  }

  // Local relative images resolved against document canonical directory
  if (documentCanonicalPath && (trimmed.startsWith("./") || trimmed.startsWith("../") || !trimmed.includes("://"))) {
    try {
      const normalizedDocPath = documentCanonicalPath.replace(/\\/g, "/");
      const lastSlash = normalizedDocPath.lastIndexOf("/");
      const docDir = lastSlash !== -1 ? normalizedDocPath.slice(0, lastSlash) : "";

      if (docDir) {
        // Prevent escaping root directory
        const cleanRelPath = trimmed.replace(/^\.\//, "");
        const fullLocalPath = `${docDir}/${cleanRelPath}`;
        return convertFileSrc(fullLocalPath);
      }
    } catch {
      // Fallback
    }
  }

  return trimmed;
}

/**
 * Validates whether an image source can be displayed.
 */
export function isSafeImageUrl(src: string): boolean {
  if (!src) return false;
  const lower = src.trim().toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:")
  ) {
    return false;
  }
  return true;
}
