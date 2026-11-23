import { openUrl } from "@tauri-apps/plugin-opener";

/**
 * List of allowed URL schemes for document links.
 */
const ALLOWED_SCHEMES = ["http:", "https:", "mailto:"];

/**
 * Checks whether a URL is safe to open.
 * Rejects javascript:, data:, vbscript:, and unknown dangerous protocols.
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;

  const trimmed = url.trim().toLowerCase();

  // Internal document anchor links are safe
  if (trimmed.startsWith("#")) {
    return true;
  }

  // Reject explicit dangerous protocols
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("file:")
  ) {
    return false;
  }

  try {
    // Relative paths without scheme
    if (trimmed.startsWith("./") || trimmed.startsWith("../") || trimmed.startsWith("/")) {
      return true;
    }

    const parsed = new URL(url, "https://mdseeker.local");
    return ALLOWED_SCHEMES.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Safely handles clicking a Markdown link.
 * External links open in default OS browser via Tauri opener.
 * Anchor links scroll to target element.
 */
export async function handleLinkClick(
  e: React.MouseEvent<HTMLAnchorElement>,
  url: string
): Promise<void> {
  e.preventDefault();

  if (!isSafeUrl(url)) {
    console.warn(`[MDSeeker] Blocked potentially unsafe link scheme: ${url}`);
    return;
  }

  const trimmed = url.trim();

  // Handle internal anchor links (#heading-id)
  if (trimmed.startsWith("#")) {
    const targetId = trimmed.slice(1);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    return;
  }

  // External web and mailto links
  try {
    await openUrl(trimmed);
  } catch (err) {
    // Fallback if plugin-opener fails or running outside Tauri
    console.warn("[MDSeeker] Tauri opener failed, falling back to window.open", err);
    window.open(trimmed, "_blank", "noopener,noreferrer");
  }
}
