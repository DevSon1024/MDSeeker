// Polyfill for environments (e.g. Happy-DOM) where Node.prototype.nodeName does not return proper nodeName.
if (typeof Node !== "undefined" && Node.prototype) {
  const origDesc = Object.getOwnPropertyDescriptor(Node.prototype, "nodeName");
  if (origDesc?.get) {
    try {
      const testEl = typeof document !== "undefined" ? document.createElement("div") : null;
      if (testEl && origDesc.get.call(testEl) === "") {
        Object.defineProperty(Node.prototype, "nodeName", {
          get(this: Node) {
            switch (this.nodeType) {
              case 1:
                return (this as Element).tagName || "";
              case 3:
                return "#text";
              case 8:
                return "#comment";
              case 9:
                return "#document";
              case 11:
                return "#document-fragment";
              default:
                return (this as Element).tagName || (origDesc.get ? origDesc.get.call(this) : "") || "";
            }
          },
          configurable: true,
          enumerable: false,
        });
      }
    } catch {
      // Ignore if cannot test
    }
  }
}

import createDOMPurify from "dompurify";
import { resolveImageUrl, isSafeImageUrl } from "./imageSafety";
import { isSafeUrl } from "./linkSafety";

// Create instance bound to current window (ensures fresh getters in test/node/happy-dom environments)
const DOMPurify =
  typeof window !== "undefined"
    ? createDOMPurify(window as unknown as Window & typeof globalThis)
    : createDOMPurify();

/**
 * Allowed HTML tags in Markdown documents (Sections 2 & 4).
 */
export const ALLOWED_TAGS = [
  // Text and formatting
  "p",
  "span",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "sub",
  "sup",
  "small",
  "code",
  "pre",
  "kbd",
  "mark",
  "abbr",
  "q",
  "cite",
  // Layout
  "div",
  "br",
  "hr",
  "center",
  "section",
  "article",
  "header",
  "footer",
  // Images and links
  "img",
  "a",
  // Lists
  "ul",
  "ol",
  "li",
  // Tables
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  // Interactive documentation elements
  "details",
  "summary",
  // Internal DOMPurify text node allowance
  "#text",
];

/**
 * Allowed HTML attributes on sanitized elements (Section 3).
 */
export const ALLOWED_ATTR = [
  "align",
  "width",
  "height",
  "alt",
  "title",
  "src",
  "href",
  "colspan",
  "rowspan",
  "scope",
  "open",
  "start",
  "type",
  "style",
  "target",
  "rel",
  "class",
  "id",
];

/**
 * Allowed CSS properties for inline style attributes (Section 3).
 */
export const ALLOWED_CSS_PROPERTIES = new Set([
  "text-align",
  "width",
  "height",
  "max-width",
  "min-width",
  "max-height",
  "min-height",
  "margin",
  "margin-top",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "padding",
  "padding-top",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "display",
  "vertical-align",
  "color",
  "background-color",
  "border",
  "border-radius",
  "border-collapse",
  "border-spacing",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "gap",
  "flex-direction",
  "justify-content",
  "align-items",
  "float",
  "clear",
  "opacity",
]);

/**
 * Validates and sanitizes a raw CSS style declaration string against the strict property allowlist.
 * Rejects external url(), expressions, behaviors, and dangerous position styling.
 */
export function sanitizeStyleString(rawStyle: string): string {
  if (!rawStyle || typeof rawStyle !== "string") return "";

  const declarations = rawStyle.split(";");
  const safeDeclarations: string[] = [];

  for (const decl of declarations) {
    const trimmed = decl.trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const prop = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const val = trimmed.slice(colonIdx + 1).trim();

    // Check property against allowlist
    if (!ALLOWED_CSS_PROPERTIES.has(prop)) {
      continue;
    }

    const valLower = val.toLowerCase();

    // Reject dangerous values: url(), expression(), javascript:, @import, behavior, fixed/absolute positioning
    if (
      valLower.includes("url(") ||
      valLower.includes("expression(") ||
      valLower.includes("javascript:") ||
      valLower.includes("@import") ||
      valLower.includes("behavior") ||
      valLower.includes("-moz-binding") ||
      valLower.includes("position")
    ) {
      continue;
    }

    safeDeclarations.push(`${prop}: ${val}`);
  }

  return safeDeclarations.join("; ");
}

export interface SanitizeHtmlOptions {
  docPath?: string;
  isInline?: boolean;
}

/**
 * Sanitizes raw HTML using DOMPurify with strict element, attribute, and CSS allowlists.
 * Resolves local relative image paths using the active document path.
 */
export function sanitizeHtml(rawHtml: string, options?: SanitizeHtmlOptions): string {
  if (!rawHtml || typeof rawHtml !== "string") return "";

  const docPath = options?.docPath;

  // Pre-strip completely forbidden embedded containers to avoid parser execution or iframe issues
  const preStripped = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<iframe\b[^>]*\/?>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<object\b[^>]*\/?>/gi, "")
    .replace(/<embed\b[^>]*\/?>/gi, "");

  // Add temporary DOMPurify hooks for attribute validation and image URL resolution
  const hookHandler = (node: Element) => {
    // 1. Sanitize style attribute if present
    const rawStyle = node.getAttribute("style");
    if (rawStyle) {
      const cleanStyle = sanitizeStyleString(rawStyle);
      if (cleanStyle) {
        node.setAttribute("style", cleanStyle);
      } else {
        node.removeAttribute("style");
      }
    }

    // 2. Resolve image URLs and ensure safe schemes
    if (node.tagName === "IMG") {
      const src = node.getAttribute("src");
      if (src) {
        if (!isSafeImageUrl(src)) {
          node.removeAttribute("src");
        } else {
          const resolved = resolveImageUrl(src, docPath);
          node.setAttribute("src", resolved);
        }
      }
      // Add standard responsive image classes
      node.classList.add("mdseeker-html-img");
      if (!node.getAttribute("loading")) {
        node.setAttribute("loading", "lazy");
      }
    }

    // 3. Secure anchor tags
    if (node.tagName === "A") {
      const href = node.getAttribute("href");
      if (href) {
        if (!isSafeUrl(href)) {
          node.removeAttribute("href");
        } else {
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noopener noreferrer");
          node.classList.add("mdseeker-html-link");
        }
      }
    }

    // 4. Style tables
    if (node.tagName === "TABLE") {
      node.classList.add("mdseeker-html-table");
    }

    // 5. Style details/summary
    if (node.tagName === "DETAILS") {
      node.classList.add("mdseeker-html-details");
    }
  };

  DOMPurify.addHook("afterSanitizeAttributes", hookHandler);

  let cleanHtml: string;
  try {
    cleanHtml = DOMPurify.sanitize(preStripped, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      FORBID_TAGS: ["script", "iframe", "object", "embed", "base", "link", "meta", "style", "form", "input"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "formaction"],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|asset|tauri):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      ADD_ATTR: ["target", "rel", "loading"],
    });
  } finally {
    DOMPurify.removeHook("afterSanitizeAttributes");
  }

  return cleanHtml;
}

/**
 * Checks if a sanitized HTML string contains meaningful visual content.
 * Returns true if the string is empty or contains only whitespace.
 */
export function isHtmlVisuallyEmpty(html: string): boolean {
  if (!html || typeof html !== "string") return true;
  const stripped = html.replace(/<[^>]*>/g, "").trim();
  // If text exists, it's not empty
  if (stripped.length > 0) return false;
  // If it has self-closing visual tags like img, hr, br, it's not empty
  if (/<(img|hr|br|table|details)[^>]*>/i.test(html)) return false;
  return true;
}
