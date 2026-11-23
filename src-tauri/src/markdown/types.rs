use serde::{Deserialize, Serialize};

/// High-level parsed Markdown document representation.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MarkdownDocument {
    /// Ordered block-level elements forming the document hierarchy.
    pub blocks: Vec<BlockNode>,
    /// Extracted document metadata (word count, reading time, frontmatter, etc.).
    pub metadata: DocumentParseMetadata,
    /// Parser version string for compatibility contracts.
    pub parser_version: String,
}

/// Extracted metadata from document parsing.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DocumentParseMetadata {
    /// Document title if identified from frontmatter or first H1 heading.
    pub title: Option<String>,
    /// Approximate word count across text and inline code.
    pub word_count: usize,
    /// Character count across all text nodes.
    pub character_count: usize,
    /// Estimated reading time in minutes (based on ~200 WPM).
    pub reading_time_minutes: f32,
    /// Raw frontmatter text (YAML or TOML), if present.
    pub frontmatter: Option<String>,
    /// Whether the document contains table blocks.
    pub has_tables: bool,
    /// Whether the document contains code blocks.
    pub has_code_blocks: bool,
    /// Whether the document contains math expressions.
    pub has_math: bool,
    /// Whether the document contains Mermaid diagrams.
    pub has_mermaid: bool,
    /// Whether the document contains task list items.
    pub has_task_lists: bool,
    /// Total count of heading elements across all levels.
    pub headings_count: usize,
}

/// Block-level nodes in the Markdown AST.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum BlockNode {
    /// Heading node (H1 through H6) with optional ID attribute and inline contents.
    Heading {
        level: u8,
        id: Option<String>,
        content: Vec<InlineNode>,
    },
    /// Paragraph containing inline nodes.
    Paragraph {
        content: Vec<InlineNode>,
    },
    /// Blockquote container with optional admonition kind (e.g. note, tip, warning).
    Blockquote {
        kind: Option<String>,
        content: Vec<BlockNode>,
    },
    /// Ordered or unordered list container.
    List {
        is_ordered: bool,
        start_number: Option<u64>,
        is_tight: bool,
        items: Vec<ListItem>,
    },
    /// Code block (fenced or indented) with language identifier and raw code content.
    CodeBlock {
        language: Option<String>,
        code: String,
        is_fenced: bool,
    },
    /// Horizontal rule / thematic break.
    ThematicBreak,
    /// GFM table with defined columns, alignments, headers, and rows.
    Table {
        columns: Vec<TableColumn>,
        rows: Vec<TableRow>,
    },
    /// Raw HTML block represented as inert structured data (never executed).
    HtmlBlock {
        content: String,
    },
    /// Footnote definition containing nested blocks.
    FootnoteDefinition {
        label: String,
        content: Vec<BlockNode>,
    },
    /// Block-level mathematical expression ($$...$$).
    BlockMath {
        math: String,
    },
}

/// An individual item within a list.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ListItem {
    /// Checkbox state for task list items: Some(true) for [x], Some(false) for [ ], None for normal item.
    pub checked: Option<bool>,
    /// Block-level content of the list item.
    pub content: Vec<BlockNode>,
}

/// Table column definition with alignment and header inlines.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TableColumn {
    pub align: TableAlignment,
    pub header: Vec<InlineNode>,
}

/// Table row containing cells of inline nodes.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TableRow {
    pub cells: Vec<Vec<InlineNode>>,
}

/// Column alignment in tables.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum TableAlignment {
    None,
    Left,
    Center,
    Right,
}

/// Inline-level nodes in the Markdown AST.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum InlineNode {
    /// Plain text string.
    Text {
        value: String,
    },
    /// Emphasized / italic text container.
    Emphasis {
        content: Vec<InlineNode>,
    },
    /// Strong / bold text container.
    Strong {
        content: Vec<InlineNode>,
    },
    /// Strikethrough text container.
    Strikethrough {
        content: Vec<InlineNode>,
    },
    /// Monospaced inline code span.
    Code {
        code: String,
    },
    /// Hyperlink with target URL, optional hover title, and link text inlines.
    Link {
        url: String,
        title: Option<String>,
        content: Vec<InlineNode>,
    },
    /// Embedded image with target URL, optional hover title, and alternative text string.
    Image {
        url: String,
        title: Option<String>,
        alt: String,
    },
    /// Soft line break (typically rendered as whitespace).
    SoftBreak,
    /// Hard line break (explicit newline or trailing spaces).
    HardBreak,
    /// Inline HTML tag represented as inert text.
    InlineHtml {
        content: String,
    },
    /// Reference to a footnote definition.
    FootnoteReference {
        label: String,
    },
    /// Inline LaTeX mathematical expression ($...$).
    InlineMath {
        math: String,
    },
}
