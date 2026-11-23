use pulldown_cmark::{
    Alignment, BlockQuoteKind, CodeBlockKind, Event, HeadingLevel, MetadataBlockKind, Options,
    Parser, Tag, TagEnd,
};

use super::errors::ParseError;
use super::options::MarkdownParseOptions;
use super::types::{
    BlockNode, DocumentParseMetadata, InlineNode, ListItem, MarkdownDocument, TableAlignment,
    TableColumn, TableRow,
};

/// Active block container stack frame.
enum BlockContainer {
    Root(Vec<BlockNode>),
    Blockquote {
        kind: Option<String>,
        children: Vec<BlockNode>,
    },
    List {
        is_ordered: bool,
        start_number: Option<u64>,
        is_tight: bool,
        items: Vec<ListItem>,
    },
    ListItem {
        checked: Option<bool>,
        children: Vec<BlockNode>,
    },
    FootnoteDefinition {
        label: String,
        children: Vec<BlockNode>,
    },
}

/// Active inline container stack frame.
enum InlineFrame {
    Root(Vec<InlineNode>),
    Emphasis(Vec<InlineNode>),
    Strong(Vec<InlineNode>),
    Strikethrough(Vec<InlineNode>),
    Link {
        url: String,
        title: Option<String>,
        children: Vec<InlineNode>,
    },
    Image {
        url: String,
        title: Option<String>,
        alt_parts: Vec<String>,
    },
}

/// In-progress table accumulator.
struct ActiveTable {
    alignments: Vec<TableAlignment>,
    columns: Vec<TableColumn>,
    rows: Vec<TableRow>,
    current_row_cells: Vec<Vec<InlineNode>>,
    is_in_head: bool,
}

/// State machine builder for Markdown AST construction.
struct MarkdownAstBuilder {
    block_stack: Vec<BlockContainer>,
    inline_stack: Vec<InlineFrame>,

    active_heading: Option<(u8, Option<String>)>,
    active_paragraph: bool,
    is_implicit_paragraph: bool,

    active_code_block: Option<(Option<String>, bool, String)>,
    active_table: Option<ActiveTable>,
    active_metadata_block: Option<String>,
    frontmatter: Option<String>,
}

impl MarkdownAstBuilder {
    fn new() -> Self {
        Self {
            block_stack: vec![BlockContainer::Root(Vec::new())],
            inline_stack: Vec::new(),
            active_heading: None,
            active_paragraph: false,
            is_implicit_paragraph: false,
            active_code_block: None,
            active_table: None,
            active_metadata_block: None,
            frontmatter: None,
        }
    }

    fn push_block_to_current(&mut self, block: BlockNode) {
        if let Some(top) = self.block_stack.last_mut() {
            match top {
                BlockContainer::Root(children) => children.push(block),
                BlockContainer::Blockquote { children, .. } => children.push(block),
                BlockContainer::ListItem { children, .. } => children.push(block),
                BlockContainer::FootnoteDefinition { children, .. } => children.push(block),
                BlockContainer::List { items, .. } => {
                    items.push(ListItem {
                        checked: None,
                        content: vec![block],
                    });
                }
            }
        }
    }

    fn flush_implicit_paragraph(&mut self) {
        if self.is_implicit_paragraph {
            let content = self.finish_inline_stack();
            self.is_implicit_paragraph = false;
            self.active_paragraph = false;
            if !content.is_empty() {
                self.push_block_to_current(BlockNode::Paragraph { content });
            }
        }
    }

    fn ensure_inline_context(&mut self) {
        if self.active_heading.is_none()
            && !self.active_paragraph
            && self.active_table.is_none()
            && self.active_code_block.is_none()
            && self.active_metadata_block.is_none()
        {
            self.active_paragraph = true;
            self.is_implicit_paragraph = true;
            self.inline_stack = vec![InlineFrame::Root(Vec::new())];
        }
    }

    fn append_inline(&mut self, inline: InlineNode) {
        if let Some(top) = self.inline_stack.last_mut() {
            match top {
                InlineFrame::Root(children)
                | InlineFrame::Emphasis(children)
                | InlineFrame::Strong(children)
                | InlineFrame::Strikethrough(children)
                | InlineFrame::Link { children, .. } => {
                    children.push(inline);
                }
                InlineFrame::Image { alt_parts, .. } => {
                    if let InlineNode::Text { value } = inline {
                        alt_parts.push(value);
                    } else if let InlineNode::Code { code } = inline {
                        alt_parts.push(code);
                    }
                }
            }
        }
    }

    fn finish_inline_stack(&mut self) -> Vec<InlineNode> {
        while self.inline_stack.len() > 1 {
            if let Some(top) = self.inline_stack.pop() {
                let collapsed = match top {
                    InlineFrame::Root(c) => c,
                    InlineFrame::Emphasis(c) => vec![InlineNode::Emphasis { content: c }],
                    InlineFrame::Strong(c) => vec![InlineNode::Strong { content: c }],
                    InlineFrame::Strikethrough(c) => vec![InlineNode::Strikethrough { content: c }],
                    InlineFrame::Link {
                        url,
                        title,
                        children,
                    } => vec![InlineNode::Link {
                        url,
                        title,
                        content: children,
                    }],
                    InlineFrame::Image {
                        url,
                        title,
                        alt_parts,
                    } => vec![InlineNode::Image {
                        url,
                        title,
                        alt: alt_parts.join(""),
                    }],
                };

                if let Some(parent) = self.inline_stack.last_mut() {
                    match parent {
                        InlineFrame::Root(c)
                        | InlineFrame::Emphasis(c)
                        | InlineFrame::Strong(c)
                        | InlineFrame::Strikethrough(c)
                        | InlineFrame::Link { children: c, .. } => {
                            c.extend(collapsed);
                        }
                        InlineFrame::Image { alt_parts, .. } => {
                            for node in collapsed {
                                if let InlineNode::Text { value } = node {
                                    alt_parts.push(value);
                                }
                            }
                        }
                    }
                }
            }
        }

        match self.inline_stack.pop() {
            Some(InlineFrame::Root(children)) => children,
            Some(InlineFrame::Emphasis(c)) => vec![InlineNode::Emphasis { content: c }],
            Some(InlineFrame::Strong(c)) => vec![InlineNode::Strong { content: c }],
            Some(InlineFrame::Strikethrough(c)) => vec![InlineNode::Strikethrough { content: c }],
            Some(InlineFrame::Link {
                url,
                title,
                children,
            }) => vec![InlineNode::Link {
                url,
                title,
                content: children,
            }],
            Some(InlineFrame::Image {
                url,
                title,
                alt_parts,
            }) => vec![InlineNode::Image {
                url,
                title,
                alt: alt_parts.join(""),
            }],
            None => Vec::new(),
        }
    }

    fn build(mut self, parser: Parser) -> Result<MarkdownDocument, ParseError> {
        for event in parser {
            match event {
                Event::Start(tag) => self.handle_start_tag(tag),
                Event::End(tag_end) => self.handle_end_tag(tag_end),
                Event::Text(text) => self.handle_text(&text),
                Event::Code(code) => self.handle_code(&code),
                Event::InlineMath(math) | Event::DisplayMath(math) => {
                    self.ensure_inline_context();
                    self.append_inline(InlineNode::Code {
                        code: format!("${}$", math),
                    });
                }
                Event::Html(html) => {
                    self.flush_implicit_paragraph();
                    self.push_block_to_current(BlockNode::HtmlBlock {
                        content: html.to_string(),
                    });
                }
                Event::InlineHtml(html) => {
                    self.ensure_inline_context();
                    self.append_inline(InlineNode::InlineHtml {
                        content: html.to_string(),
                    });
                }
                Event::FootnoteReference(label) => {
                    self.ensure_inline_context();
                    self.append_inline(InlineNode::FootnoteReference {
                        label: label.to_string(),
                    });
                }
                Event::SoftBreak => {
                    self.ensure_inline_context();
                    self.append_inline(InlineNode::SoftBreak);
                }
                Event::HardBreak => {
                    self.ensure_inline_context();
                    self.append_inline(InlineNode::HardBreak);
                }
                Event::Rule => {
                    self.flush_implicit_paragraph();
                    self.push_block_to_current(BlockNode::ThematicBreak);
                }
                Event::TaskListMarker(checked) => {
                    if let Some(BlockContainer::ListItem { checked: c, .. }) =
                        self.block_stack.last_mut()
                    {
                        *c = Some(checked);
                    }
                }
            }
        }

        self.flush_implicit_paragraph();

        // Extract root blocks
        let blocks = match self.block_stack.pop() {
            Some(BlockContainer::Root(children)) => children,
            _ => Vec::new(),
        };

        let metadata = extract_metadata(&blocks, self.frontmatter.as_deref());

        Ok(MarkdownDocument {
            blocks,
            metadata,
            parser_version: "pulldown-cmark-0.13".to_string(),
        })
    }

    fn handle_start_tag(&mut self, tag: Tag) {
        match tag {
            Tag::Paragraph => {
                self.flush_implicit_paragraph();
                self.active_paragraph = true;
                self.is_implicit_paragraph = false;
                self.inline_stack = vec![InlineFrame::Root(Vec::new())];
            }
            Tag::Heading { level, id, .. } => {
                self.flush_implicit_paragraph();
                let lvl = match level {
                    HeadingLevel::H1 => 1,
                    HeadingLevel::H2 => 2,
                    HeadingLevel::H3 => 3,
                    HeadingLevel::H4 => 4,
                    HeadingLevel::H5 => 5,
                    HeadingLevel::H6 => 6,
                };
                self.active_heading = Some((lvl, id.map(|s| s.to_string())));
                self.inline_stack = vec![InlineFrame::Root(Vec::new())];
            }
            Tag::BlockQuote(kind) => {
                self.flush_implicit_paragraph();
                let kind_str = kind.map(|k| match k {
                    BlockQuoteKind::Note => "note".to_string(),
                    BlockQuoteKind::Tip => "tip".to_string(),
                    BlockQuoteKind::Important => "important".to_string(),
                    BlockQuoteKind::Warning => "warning".to_string(),
                    BlockQuoteKind::Caution => "caution".to_string(),
                });
                self.block_stack.push(BlockContainer::Blockquote {
                    kind: kind_str,
                    children: Vec::new(),
                });
            }
            Tag::List(start_num) => {
                self.flush_implicit_paragraph();
                self.block_stack.push(BlockContainer::List {
                    is_ordered: start_num.is_some(),
                    start_number: start_num,
                    is_tight: true,
                    items: Vec::new(),
                });
            }
            Tag::Item => {
                self.flush_implicit_paragraph();
                self.block_stack.push(BlockContainer::ListItem {
                    checked: None,
                    children: Vec::new(),
                });
            }
            Tag::CodeBlock(kind) => {
                self.flush_implicit_paragraph();
                let (lang, is_fenced) = match kind {
                    CodeBlockKind::Indented => (None, false),
                    CodeBlockKind::Fenced(info) => {
                        let trimmed = info.trim();
                        let lang = if trimmed.is_empty() {
                            None
                        } else {
                            Some(
                                trimmed
                                    .split_whitespace()
                                    .next()
                                    .unwrap_or(trimmed)
                                    .to_string(),
                            )
                        };
                        (lang, true)
                    }
                };
                self.active_code_block = Some((lang, is_fenced, String::new()));
            }
            Tag::Table(alignments) => {
                self.flush_implicit_paragraph();
                let table_alignments: Vec<TableAlignment> = alignments
                    .into_iter()
                    .map(|a| match a {
                        Alignment::None => TableAlignment::None,
                        Alignment::Left => TableAlignment::Left,
                        Alignment::Center => TableAlignment::Center,
                        Alignment::Right => TableAlignment::Right,
                    })
                    .collect();
                self.active_table = Some(ActiveTable {
                    alignments: table_alignments,
                    columns: Vec::new(),
                    rows: Vec::new(),
                    current_row_cells: Vec::new(),
                    is_in_head: false,
                });
            }
            Tag::TableHead => {
                if let Some(table) = self.active_table.as_mut() {
                    table.is_in_head = true;
                }
            }
            Tag::TableRow => {
                if let Some(table) = self.active_table.as_mut() {
                    table.current_row_cells = Vec::new();
                }
            }
            Tag::TableCell => {
                self.inline_stack = vec![InlineFrame::Root(Vec::new())];
            }
            Tag::FootnoteDefinition(label) => {
                self.flush_implicit_paragraph();
                self.block_stack.push(BlockContainer::FootnoteDefinition {
                    label: label.to_string(),
                    children: Vec::new(),
                });
            }
            Tag::MetadataBlock(kind) => {
                self.flush_implicit_paragraph();
                if matches!(
                    kind,
                    MetadataBlockKind::YamlStyle | MetadataBlockKind::PlusesStyle
                ) {
                    self.active_metadata_block = Some(String::new());
                }
            }
            Tag::Emphasis => {
                self.ensure_inline_context();
                self.inline_stack.push(InlineFrame::Emphasis(Vec::new()));
            }
            Tag::Strong => {
                self.ensure_inline_context();
                self.inline_stack.push(InlineFrame::Strong(Vec::new()));
            }
            Tag::Strikethrough => {
                self.ensure_inline_context();
                self.inline_stack
                    .push(InlineFrame::Strikethrough(Vec::new()));
            }
            Tag::Link {
                dest_url, title, ..
            } => {
                self.ensure_inline_context();
                self.inline_stack.push(InlineFrame::Link {
                    url: dest_url.to_string(),
                    title: if title.is_empty() {
                        None
                    } else {
                        Some(title.to_string())
                    },
                    children: Vec::new(),
                });
            }
            Tag::Image {
                dest_url, title, ..
            } => {
                self.ensure_inline_context();
                self.inline_stack.push(InlineFrame::Image {
                    url: dest_url.to_string(),
                    title: if title.is_empty() {
                        None
                    } else {
                        Some(title.to_string())
                    },
                    alt_parts: Vec::new(),
                });
            }
            _ => {}
        }
    }

    fn handle_end_tag(&mut self, tag_end: TagEnd) {
        match tag_end {
            TagEnd::Paragraph => {
                self.active_paragraph = false;
                self.is_implicit_paragraph = false;
                let content = self.finish_inline_stack();
                self.push_block_to_current(BlockNode::Paragraph { content });
            }
            TagEnd::Heading(_) => {
                if let Some((level, id)) = self.active_heading.take() {
                    let content = self.finish_inline_stack();
                    self.push_block_to_current(BlockNode::Heading { level, id, content });
                }
            }
            TagEnd::BlockQuote(_) => {
                self.flush_implicit_paragraph();
                if let Some(BlockContainer::Blockquote { kind, children }) = self.block_stack.pop()
                {
                    self.push_block_to_current(BlockNode::Blockquote {
                        kind,
                        content: children,
                    });
                }
            }
            TagEnd::Item => {
                self.flush_implicit_paragraph();
                if let Some(BlockContainer::ListItem { checked, children }) = self.block_stack.pop()
                {
                    if let Some(BlockContainer::List { items, .. }) = self.block_stack.last_mut() {
                        items.push(ListItem {
                            checked,
                            content: children,
                        });
                    }
                }
            }
            TagEnd::List(_) => {
                self.flush_implicit_paragraph();
                if let Some(BlockContainer::List {
                    is_ordered,
                    start_number,
                    is_tight,
                    items,
                }) = self.block_stack.pop()
                {
                    self.push_block_to_current(BlockNode::List {
                        is_ordered,
                        start_number,
                        is_tight,
                        items,
                    });
                }
            }
            TagEnd::CodeBlock => {
                if let Some((lang, is_fenced, code)) = self.active_code_block.take() {
                    self.push_block_to_current(BlockNode::CodeBlock {
                        language: lang,
                        code,
                        is_fenced,
                    });
                }
            }
            TagEnd::TableCell => {
                let cell_inlines = self.finish_inline_stack();
                if let Some(table) = self.active_table.as_mut() {
                    if table.is_in_head {
                        let col_idx = table.columns.len();
                        let align = table
                            .alignments
                            .get(col_idx)
                            .copied()
                            .unwrap_or(TableAlignment::None);
                        table.columns.push(TableColumn {
                            align,
                            header: cell_inlines,
                        });
                    } else {
                        table.current_row_cells.push(cell_inlines);
                    }
                }
            }
            TagEnd::TableHead => {
                if let Some(table) = self.active_table.as_mut() {
                    table.is_in_head = false;
                }
            }
            TagEnd::TableRow => {
                if let Some(table) = self.active_table.as_mut() {
                    let cells = std::mem::take(&mut table.current_row_cells);
                    table.rows.push(TableRow { cells });
                }
            }
            TagEnd::Table => {
                if let Some(table) = self.active_table.take() {
                    self.push_block_to_current(BlockNode::Table {
                        columns: table.columns,
                        rows: table.rows,
                    });
                }
            }
            TagEnd::FootnoteDefinition => {
                self.flush_implicit_paragraph();
                if let Some(BlockContainer::FootnoteDefinition { label, children }) =
                    self.block_stack.pop()
                {
                    self.push_block_to_current(BlockNode::FootnoteDefinition {
                        label,
                        content: children,
                    });
                }
            }
            TagEnd::MetadataBlock(_) => {
                self.frontmatter = self.active_metadata_block.take();
            }
            TagEnd::Emphasis => {
                if let Some(InlineFrame::Emphasis(children)) = self.inline_stack.pop() {
                    self.append_inline(InlineNode::Emphasis { content: children });
                }
            }
            TagEnd::Strong => {
                if let Some(InlineFrame::Strong(children)) = self.inline_stack.pop() {
                    self.append_inline(InlineNode::Strong { content: children });
                }
            }
            TagEnd::Strikethrough => {
                if let Some(InlineFrame::Strikethrough(children)) = self.inline_stack.pop() {
                    self.append_inline(InlineNode::Strikethrough { content: children });
                }
            }
            TagEnd::Link => {
                if let Some(InlineFrame::Link {
                    url,
                    title,
                    children,
                }) = self.inline_stack.pop()
                {
                    self.append_inline(InlineNode::Link {
                        url,
                        title,
                        content: children,
                    });
                }
            }
            TagEnd::Image => {
                if let Some(InlineFrame::Image {
                    url,
                    title,
                    alt_parts,
                }) = self.inline_stack.pop()
                {
                    self.append_inline(InlineNode::Image {
                        url,
                        title,
                        alt: alt_parts.join(""),
                    });
                }
            }
            _ => {}
        }
    }

    fn handle_text(&mut self, text: &str) {
        if let Some((_, _, code)) = self.active_code_block.as_mut() {
            code.push_str(text);
        } else if let Some(meta) = self.active_metadata_block.as_mut() {
            meta.push_str(text);
        } else {
            self.ensure_inline_context();
            if let Some(InlineFrame::Image { alt_parts, .. }) = self.inline_stack.last_mut() {
                alt_parts.push(text.to_string());
            } else {
                self.append_inline(InlineNode::Text {
                    value: text.to_string(),
                });
            }
        }
    }

    fn handle_code(&mut self, code: &str) {
        self.ensure_inline_context();
        if let Some(InlineFrame::Image { alt_parts, .. }) = self.inline_stack.last_mut() {
            alt_parts.push(code.to_string());
        } else {
            self.append_inline(InlineNode::Code {
                code: code.to_string(),
            });
        }
    }
}

/// Parses raw Markdown content into a structured AST representation.
pub fn parse_markdown(
    input: &str,
    options: Option<MarkdownParseOptions>,
) -> Result<MarkdownDocument, ParseError> {
    let opts = options.unwrap_or_default();
    let cmark_opts: Options = (&opts).into();
    let parser = Parser::new_ext(input, cmark_opts);
    let builder = MarkdownAstBuilder::new();
    builder.build(parser)
}

/// Extracts document metadata from parsed AST blocks and frontmatter.
fn extract_metadata(blocks: &[BlockNode], frontmatter: Option<&str>) -> DocumentParseMetadata {
    let mut word_count = 0;
    let mut char_count = 0;
    let mut title = None;
    let mut has_tables = false;
    let mut has_code_blocks = false;
    let mut has_math = false;
    let mut has_mermaid = false;
    let mut has_task_lists = false;
    let mut headings_count = 0;

    // Check frontmatter title first
    if let Some(fm) = frontmatter {
        title = extract_yaml_title(fm);
    }

    fn scan_inlines(
        inlines: &[InlineNode],
        words: &mut usize,
        chars: &mut usize,
        math: &mut bool,
    ) {
        for inline in inlines {
            match inline {
                InlineNode::Text { value } => {
                    *words += value.split_whitespace().count();
                    *chars += value.chars().count();
                    if value.contains('$') {
                        *math = true;
                    }
                }
                InlineNode::Code { code } => {
                    *words += code.split_whitespace().count();
                    *chars += code.chars().count();
                    if code.starts_with('$') && code.ends_with('$') {
                        *math = true;
                    }
                }
                InlineNode::Emphasis { content }
                | InlineNode::Strong { content }
                | InlineNode::Strikethrough { content }
                | InlineNode::Link { content, .. } => {
                    scan_inlines(content, words, chars, math);
                }
                InlineNode::Image { alt, .. } => {
                    *words += alt.split_whitespace().count();
                    *chars += alt.chars().count();
                }
                InlineNode::SoftBreak | InlineNode::HardBreak => {
                    *chars += 1;
                }
                InlineNode::InlineHtml { .. } | InlineNode::FootnoteReference { .. } => {}
            }
        }
    }

    fn scan_blocks(
        blocks: &[BlockNode],
        title: &mut Option<String>,
        words: &mut usize,
        chars: &mut usize,
        tables: &mut bool,
        code_blocks: &mut bool,
        math: &mut bool,
        mermaid: &mut bool,
        tasks: &mut bool,
        headings: &mut usize,
    ) {
        for block in blocks {
            match block {
                BlockNode::Heading { level, content, .. } => {
                    *headings += 1;
                    if *level == 1 && title.is_none() {
                        let plain = inlines_to_plain_text(content);
                        if !plain.trim().is_empty() {
                            *title = Some(plain.trim().to_string());
                        }
                    }
                    scan_inlines(content, words, chars, math);
                }
                BlockNode::Paragraph { content } => {
                    scan_inlines(content, words, chars, math);
                }
                BlockNode::Blockquote { content, .. } => {
                    scan_blocks(
                        content,
                        title,
                        words,
                        chars,
                        tables,
                        code_blocks,
                        math,
                        mermaid,
                        tasks,
                        headings,
                    );
                }
                BlockNode::List { items, .. } => {
                    for item in items {
                        if item.checked.is_some() {
                            *tasks = true;
                        }
                        scan_blocks(
                            &item.content,
                            title,
                            words,
                            chars,
                            tables,
                            code_blocks,
                            math,
                            mermaid,
                            tasks,
                            headings,
                        );
                    }
                }
                BlockNode::CodeBlock { language, code, .. } => {
                    *code_blocks = true;
                    if language.as_deref() == Some("mermaid") {
                        *mermaid = true;
                    }
                    *words += code.split_whitespace().count();
                    *chars += code.chars().count();
                }
                BlockNode::Table { columns, rows } => {
                    *tables = true;
                    for col in columns {
                        scan_inlines(&col.header, words, chars, math);
                    }
                    for row in rows {
                        for cell in &row.cells {
                            scan_inlines(cell, words, chars, math);
                        }
                    }
                }
                BlockNode::FootnoteDefinition { content, .. } => {
                    scan_blocks(
                        content,
                        title,
                        words,
                        chars,
                        tables,
                        code_blocks,
                        math,
                        mermaid,
                        tasks,
                        headings,
                    );
                }
                BlockNode::HtmlBlock { .. } | BlockNode::ThematicBreak => {}
            }
        }
    }

    scan_blocks(
        blocks,
        &mut title,
        &mut word_count,
        &mut char_count,
        &mut has_tables,
        &mut has_code_blocks,
        &mut has_math,
        &mut has_mermaid,
        &mut has_task_lists,
        &mut headings_count,
    );

    let reading_time_minutes = if word_count == 0 {
        0.0
    } else {
        ((word_count as f32 / 200.0) * 10.0).round() / 10.0
    };

    DocumentParseMetadata {
        title,
        word_count,
        character_count: char_count,
        reading_time_minutes: if reading_time_minutes < 0.1 && word_count > 0 {
            0.1
        } else {
            reading_time_minutes
        },
        frontmatter: frontmatter.map(|s| s.to_string()),
        has_tables,
        has_code_blocks,
        has_math,
        has_mermaid,
        has_task_lists,
        headings_count,
    }
}

/// Extracts plain text from inline nodes.
fn inlines_to_plain_text(inlines: &[InlineNode]) -> String {
    let mut out = String::new();
    for inline in inlines {
        match inline {
            InlineNode::Text { value } => out.push_str(value),
            InlineNode::Code { code } => out.push_str(code),
            InlineNode::Emphasis { content }
            | InlineNode::Strong { content }
            | InlineNode::Strikethrough { content }
            | InlineNode::Link { content, .. } => {
                out.push_str(&inlines_to_plain_text(content));
            }
            InlineNode::Image { alt, .. } => out.push_str(alt),
            InlineNode::SoftBreak | InlineNode::HardBreak => out.push(' '),
            InlineNode::InlineHtml { .. } | InlineNode::FootnoteReference { .. } => {}
        }
    }
    out
}

/// Parses YAML frontmatter for a `title:` key.
fn extract_yaml_title(frontmatter: &str) -> Option<String> {
    for line in frontmatter.lines() {
        let trimmed = line.trim();
        if let Some(rest) = trimmed.strip_prefix("title:") {
            let title = rest
                .trim()
                .trim_matches(|c| c == '"' || c == '\'')
                .trim();
            if !title.is_empty() {
                return Some(title.to_string());
            }
        }
    }
    None
}
