import { BlockNode, InlineNode, MarkdownDocument } from "@/types/markdown";

export interface OutlineHeading {
  id: string;
  text: string;
  level: number;
}

/**
 * Extracts plain text recursively from an array of InlineNode.
 */
export function inlinesToPlainText(inlines: InlineNode[]): string {
  let text = "";
  for (const node of inlines) {
    switch (node.type) {
      case "text":
        text += node.value;
        break;
      case "code":
        text += node.code;
        break;
      case "inlineMath":
        text += node.math;
        break;
      case "emphasis":
      case "strong":
      case "strikethrough":
      case "link":
        text += inlinesToPlainText(node.content);
        break;
      case "image":
        text += node.alt;
        break;
      case "softBreak":
      case "hardBreak":
        text += " ";
        break;
      default:
        break;
    }
  }
  return text.trim();
}

/**
 * Generates a clean URL/DOM-safe slug from heading inlines.
 */
export function inlinesToSlug(inlines: InlineNode[]): string {
  const plain = inlinesToPlainText(inlines);
  const slug = plain
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return slug || "heading";
}

/**
 * Extracts all headings (H1–H6) in document order, assigning stable and unique IDs.
 */
export function extractOutline(doc: MarkdownDocument | null): OutlineHeading[] {
  if (!doc || !doc.blocks) return [];

  const headings: OutlineHeading[] = [];
  const idCounts = new Map<string, number>();

  function scan(blocks: BlockNode[]) {
    for (const block of blocks) {
      if (block.type === "heading") {
        const text = inlinesToPlainText(block.content) || `Heading ${block.level}`;
        const baseId = block.id || inlinesToSlug(block.content);

        const count = idCounts.get(baseId) || 0;
        idCounts.set(baseId, count + 1);
        const uniqueId = count === 0 ? baseId : `${baseId}-${count}`;

        headings.push({
          id: uniqueId,
          text,
          level: block.level,
        });
      } else if (block.type === "blockquote") {
        scan(block.content);
      } else if (block.type === "list") {
        for (const item of block.items) {
          scan(item.content);
        }
      }
    }
  }

  scan(doc.blocks);
  return headings;
}
