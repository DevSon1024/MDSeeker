import { BlockNode, HtmlBlock as HtmlBlockType } from "@/types/markdown";
import { sanitizeStyleString } from "./htmlSanitizer";

export interface ContainerGroup {
  type: "container";
  tag: "details" | "div" | "center" | "section" | "article";
  rawOpenHtml: string;
  summaryHtml?: string;
  align?: string;
  style?: string;
  children: GroupedItem[];
}

export interface SingleBlockGroup {
  type: "block";
  block: BlockNode;
}

export type GroupedItem = ContainerGroup | SingleBlockGroup;

const CONTAINER_TAGS = ["details", "div", "center", "section", "article"] as const;
type ContainerTag = (typeof CONTAINER_TAGS)[number];

interface UnclosedContainerInfo {
  tag: ContainerTag;
  summaryHtml?: string;
  align?: string;
  style?: string;
  leadingHtmlBlock?: HtmlBlockType;
}

/**
 * Checks whether an HTML block content opens a container tag without closing it.
 */
function detectUnclosedContainer(content: string): UnclosedContainerInfo | null {
  if (!content || typeof content !== "string") return null;

  for (const tag of CONTAINER_TAGS) {
    const openRegex = new RegExp(`<${tag}(\\s[^>]*)?>`, "gi");
    const closeRegex = new RegExp(`</${tag}\\s*>`, "gi");

    let openCount = 0;
    let lastOpenMatch: RegExpExecArray | null = null;
    let match: RegExpExecArray | null;

    while ((match = openRegex.exec(content)) !== null) {
      // Check if self-closing e.g. <div />
      if (!match[0].endsWith("/>")) {
        openCount++;
        lastOpenMatch = match;
      }
    }

    let closeCount = 0;
    while (closeRegex.exec(content) !== null) {
      closeCount++;
    }

    if (openCount > closeCount && lastOpenMatch) {
      const openTagStr = lastOpenMatch[0];

      // Extract attributes
      let align: string | undefined;
      let style: string | undefined;

      const alignMatch = openTagStr.match(/\balign\s*=\s*["']?([^"'\s>]+)["']?/i);
      if (alignMatch) {
        align = alignMatch[1].toLowerCase();
      }

      const styleMatch = openTagStr.match(/\bstyle\s*=\s*["']([^"']+)["']/i);
      if (styleMatch) {
        style = sanitizeStyleString(styleMatch[1]);
      }

      // Special handling for <details>: extract <summary>...</summary> if present
      let summaryHtml: string | undefined;
      let leadingContent: string | undefined;

      if (tag === "details") {
        const summaryMatch = content.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i);
        if (summaryMatch) {
          summaryHtml = summaryMatch[1].trim();
          // Remove summary from content to avoid duplicate rendering
          const afterSummary = content.replace(summaryMatch[0], "");
          const afterOpenTag = afterSummary.replace(openTagStr, "").trim();
          if (afterOpenTag) {
            leadingContent = afterOpenTag;
          }
        }
      } else {
        // For div/center, check if there is content after opening tag
        const tagIndex = content.indexOf(openTagStr);
        if (tagIndex !== -1) {
          const after = content.slice(tagIndex + openTagStr.length).trim();
          if (after) {
            leadingContent = after;
          }
        }
      }

      let leadingHtmlBlock: HtmlBlockType | undefined;
      if (leadingContent && leadingContent.length > 0) {
        leadingHtmlBlock = {
          type: "htmlBlock",
          content: leadingContent,
        };
      }

      return {
        tag,
        summaryHtml,
        align,
        style,
        leadingHtmlBlock,
      };
    }
  }

  return null;
}

/**
 * Checks whether an HTML block closes the specified container tag.
 */
function detectClosesContainer(
  content: string,
  tag: ContainerTag
): { closes: boolean; remainingContent?: string } {
  if (!content || typeof content !== "string") return { closes: false };

  const closeTagRegex = new RegExp(`</${tag}\\s*>`, "i");
  const match = content.match(closeTagRegex);

  if (match && match.index !== undefined) {
    const before = content.slice(0, match.index).trim();
    const after = content.slice(match.index + match[0].length).trim();
    const remaining = [before, after].filter(Boolean).join("\n");
    return {
      closes: true,
      remainingContent: remaining.length > 0 ? remaining : undefined,
    };
  }

  return { closes: false };
}

interface Frame {
  tag: ContainerTag | "root";
  rawOpenHtml: string;
  summaryHtml?: string;
  align?: string;
  style?: string;
  children: GroupedItem[];
}

/**
 * Groups adjacent Markdown blocks enclosed by HTML container tags
 * (such as <details>...</details>, <div align="center">...</div>, <center>...</center>).
 */
export function groupMarkdownBlocks(blocks: BlockNode[]): GroupedItem[] {
  const rootFrame: Frame = {
    tag: "root",
    rawOpenHtml: "",
    children: [],
  };

  const stack: Frame[] = [rootFrame];

  for (const block of blocks) {
    if (block.type === "htmlBlock") {
      const top = stack[stack.length - 1];

      // 1. Check if this block closes the current open container
      if (top.tag !== "root") {
        const closeInfo = detectClosesContainer(block.content, top.tag);
        if (closeInfo.closes) {
          const closed = stack.pop()!;
          const parent = stack[stack.length - 1];

          parent.children.push({
            type: "container",
            tag: closed.tag as ContainerTag,
            rawOpenHtml: closed.rawOpenHtml,
            summaryHtml: closed.summaryHtml,
            align: closed.align,
            style: closed.style,
            children: closed.children,
          });

          // If there is extra content after the closing tag, process it
          if (closeInfo.remainingContent) {
            const extraBlock: BlockNode = {
              type: "htmlBlock",
              content: closeInfo.remainingContent,
            };
            // Recursively process this extra block
            const extraGrouped = groupMarkdownBlocks([extraBlock]);
            parent.children.push(...extraGrouped);
          }
          continue;
        }
      }

      // 2. Check if this block opens a new unclosed container
      const unclosed = detectUnclosedContainer(block.content);
      if (unclosed) {
        const newFrame: Frame = {
          tag: unclosed.tag,
          rawOpenHtml: block.content,
          summaryHtml: unclosed.summaryHtml,
          align: unclosed.align,
          style: unclosed.style,
          children: [],
        };

        if (unclosed.leadingHtmlBlock) {
          newFrame.children.push({
            type: "block",
            block: unclosed.leadingHtmlBlock,
          });
        }

        stack.push(newFrame);
        continue;
      }
    }

    // Standard block or self-contained HTML block
    const currentTop = stack[stack.length - 1];
    currentTop.children.push({
      type: "block",
      block,
    });
  }

  // Close any unclosed containers gracefully at EOF
  while (stack.length > 1) {
    const unclosed = stack.pop()!;
    const parent = stack[stack.length - 1];
    parent.children.push({
      type: "container",
      tag: unclosed.tag as ContainerTag,
      rawOpenHtml: unclosed.rawOpenHtml,
      summaryHtml: unclosed.summaryHtml,
      align: unclosed.align,
      style: unclosed.style,
      children: unclosed.children,
    });
  }

  return rootFrame.children;
}
