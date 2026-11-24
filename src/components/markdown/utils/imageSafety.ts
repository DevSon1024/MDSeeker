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

  // Decode URI percent-encoding (e.g. %20 -> space) if present
  let cleanPath = trimmed;
  try {
    cleanPath = decodeURIComponent(trimmed);
  } catch {
    // Keep trimmed if decoding fails
  }

  // Strip query parameters and hash anchors (e.g. ?raw=true or #gh-dark-mode-only)
  const qIdx = cleanPath.search(/[?#]/);
  if (qIdx !== -1) {
    cleanPath = cleanPath.substring(0, qIdx);
  }

  // Absolute Windows paths (e.g., C:\images\pic.png or D:/images/pic.png)
  if (/^[a-zA-Z]:[\\\/]/.test(cleanPath)) {
    try {
      return convertFileSrc(cleanPath);
    } catch {
      return cleanPath;
    }
  }

  // Local relative images resolved against document canonical directory
  if (documentCanonicalPath && (cleanPath.startsWith("./") || cleanPath.startsWith("../") || !cleanPath.includes("://"))) {
    try {
      const normalizedDocPath = documentCanonicalPath.replace(/\\/g, "/");
      const lastSlash = normalizedDocPath.lastIndexOf("/");
      const docDir = lastSlash !== -1 ? normalizedDocPath.slice(0, lastSlash) : "";

      if (docDir) {
        // Normalize relative path
        const rel = cleanPath.replace(/^\.\//, "").replace(/^\/+/, "");
        const fullLocalPath = `${docDir}/${rel}`;
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
