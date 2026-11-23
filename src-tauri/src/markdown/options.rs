use pulldown_cmark::Options;
use serde::{Deserialize, Serialize};

/// Configuration options for the Markdown parsing engine.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct MarkdownParseOptions {
    /// Enable GitHub-flavored tables.
    pub tables: bool,
    /// Enable strikethrough (~~text~~).
    pub strikethrough: bool,
    /// Enable task list items ([ ] / [x]).
    pub tasklists: bool,
    /// Enable footnote definitions and references.
    pub footnotes: bool,
    /// Enable heading attributes ({#id .class}).
    pub heading_attributes: bool,
    /// Convert straight quotes and dashes to smart punctuation.
    pub smart_punctuation: bool,
    /// Enable GFM admonition blockquotes ([!NOTE], [!WARNING], etc.).
    pub gfm_admonitions: bool,
    /// Enable YAML/TOML metadata frontmatter blocks.
    pub yaml_metadata: bool,
}

impl Default for MarkdownParseOptions {
    fn default() -> Self {
        Self {
            tables: true,
            strikethrough: true,
            tasklists: true,
            footnotes: true,
            heading_attributes: true,
            smart_punctuation: false,
            gfm_admonitions: true,
            yaml_metadata: true,
        }
    }
}

impl From<&MarkdownParseOptions> for Options {
    fn from(opts: &MarkdownParseOptions) -> Self {
        let mut options = Options::empty();
        if opts.tables {
            options.insert(Options::ENABLE_TABLES);
        }
        if opts.strikethrough {
            options.insert(Options::ENABLE_STRIKETHROUGH);
        }
        if opts.tasklists {
            options.insert(Options::ENABLE_TASKLISTS);
        }
        if opts.footnotes {
            options.insert(Options::ENABLE_FOOTNOTES);
        }
        if opts.heading_attributes {
            options.insert(Options::ENABLE_HEADING_ATTRIBUTES);
        }
        if opts.smart_punctuation {
            options.insert(Options::ENABLE_SMART_PUNCTUATION);
        }
        if opts.gfm_admonitions {
            options.insert(Options::ENABLE_GFM);
        }
        if opts.yaml_metadata {
            options.insert(Options::ENABLE_YAML_STYLE_METADATA_BLOCKS);
            options.insert(Options::ENABLE_PLUSES_DELIMITED_METADATA_BLOCKS);
        }
        options
    }
}
