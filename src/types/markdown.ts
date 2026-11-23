/**
 * TypeScript definitions for MDSeeker's Rust-powered Markdown AST.
 * Matches `src-tauri/src/markdown/types.rs`.
 */

export type TableAlignment = "none" | "left" | "center" | "right";

export interface DocumentParseMetadata {
  title: string | null;
  wordCount: number;
  characterCount: number;
  readingTimeMinutes: number;
  frontmatter: string | null;
  hasTables: boolean;
  hasCodeBlocks: boolean;
  hasMath: boolean;
  hasMermaid: boolean;
  hasTaskLists: boolean;
  headingsCount: number;
}

export interface MarkdownParseOptions {
  tables?: boolean;
  strikethrough?: boolean;
  tasklists?: boolean;
  footnotes?: boolean;
  headingAttributes?: boolean;
  smartPunctuation?: boolean;
  gfmAdmonitions?: boolean;
  yamlMetadata?: boolean;
}

export interface ParseError {
  code: string;
  message: string;
  details?: string;
}

export interface TableColumn {
  align: TableAlignment;
  header: InlineNode[];
}

export interface TableRow {
  cells: InlineNode[][];
}

export interface ListItem {
  checked: boolean | null;
  content: BlockNode[];
}

/* -------------------------------------------------------------------------- */
/*                                Inline Nodes                                */
/* -------------------------------------------------------------------------- */

export interface TextInline {
  type: "text";
  value: string;
}

export interface EmphasisInline {
  type: "emphasis";
  content: InlineNode[];
}

export interface StrongInline {
  type: "strong";
  content: InlineNode[];
}

export interface StrikethroughInline {
  type: "strikethrough";
  content: InlineNode[];
}

export interface CodeInline {
  type: "code";
  code: string;
}

export interface LinkInline {
  type: "link";
  url: string;
  title: string | null;
  content: InlineNode[];
}

export interface ImageInline {
  type: "image";
  url: string;
  title: string | null;
  alt: string;
}

export interface SoftBreakInline {
  type: "softBreak";
}

export interface HardBreakInline {
  type: "hardBreak";
}

export interface InlineHtmlInline {
  type: "inlineHtml";
  content: string;
}

export interface FootnoteReferenceInline {
  type: "footnoteReference";
  label: string;
}

export interface InlineMathInline {
  type: "inlineMath";
  math: string;
}

export type InlineNode =
  | TextInline
  | EmphasisInline
  | StrongInline
  | StrikethroughInline
  | CodeInline
  | LinkInline
  | ImageInline
  | SoftBreakInline
  | HardBreakInline
  | InlineHtmlInline
  | FootnoteReferenceInline
  | InlineMathInline;

/* -------------------------------------------------------------------------- */
/*                                 Block Nodes                                */
/* -------------------------------------------------------------------------- */

export interface HeadingBlock {
  type: "heading";
  level: number;
  id: string | null;
  content: InlineNode[];
}

export interface ParagraphBlock {
  type: "paragraph";
  content: InlineNode[];
}

export interface BlockquoteBlock {
  type: "blockquote";
  kind: string | null;
  content: BlockNode[];
}

export interface ListBlock {
  type: "list";
  isOrdered: boolean;
  startNumber: number | null;
  isTight: boolean;
  items: ListItem[];
}

export interface CodeBlock {
  type: "codeBlock";
  language: string | null;
  code: string;
  isFenced: boolean;
}

export interface ThematicBreakBlock {
  type: "thematicBreak";
}

export interface TableBlock {
  type: "table";
  columns: TableColumn[];
  rows: TableRow[];
}

export interface HtmlBlock {
  type: "htmlBlock";
  content: string;
}

export interface FootnoteDefinitionBlock {
  type: "footnoteDefinition";
  label: string;
  content: BlockNode[];
}

export interface BlockMathBlock {
  type: "blockMath";
  math: string;
}

export type BlockNode =
  | HeadingBlock
  | ParagraphBlock
  | BlockquoteBlock
  | ListBlock
  | CodeBlock
  | ThematicBreakBlock
  | TableBlock
  | HtmlBlock
  | FootnoteDefinitionBlock
  | BlockMathBlock;

/* -------------------------------------------------------------------------- */
/*                        Syntax Highlighting Types                           */
/* -------------------------------------------------------------------------- */

export interface HighlightedToken {
  content: string;
  color?: string;
  fontStyle?: "normal" | "italic" | "bold" | "boldItalic";
}

export interface HighlightedLine {
  tokens: HighlightedToken[];
}

export interface HighlightResult {
  lines: HighlightedLine[];
  language: string;
}

/* -------------------------------------------------------------------------- */
/*                              Root Document                                 */
/* -------------------------------------------------------------------------- */

export interface MarkdownDocument {
  blocks: BlockNode[];
  metadata: DocumentParseMetadata;
  parserVersion: string;
}
