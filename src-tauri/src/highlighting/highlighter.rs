use std::sync::OnceLock;
use syntect::easy::HighlightLines;
use syntect::highlighting::ThemeSet;
use syntect::parsing::{SyntaxReference, SyntaxSet};
use syntect::util::LinesWithEndings;

use super::themes::{format_font_style, format_hex_color, select_theme};
use super::types::{HighlightResult, HighlightedLine, HighlightedToken};

static SYNTAX_SET: OnceLock<SyntaxSet> = OnceLock::new();
static THEME_SET: OnceLock<ThemeSet> = OnceLock::new();

/// Maximum character size permitted for active AST token highlighting (1 MB).
const MAX_HIGHLIGHT_CODE_SIZE: usize = 1_000_000;

/// Returns the singleton SyntaxSet with newline support.
pub fn get_syntax_set() -> &'static SyntaxSet {
    SYNTAX_SET.get_or_init(SyntaxSet::load_defaults_newlines)
}

/// Returns the singleton ThemeSet with default themes.
pub fn get_theme_set() -> &'static ThemeSet {
    THEME_SET.get_or_init(ThemeSet::load_defaults)
}

/// Normalizes common language identifiers and aliases to standard syntect tokens.
pub fn normalize_language_alias(lang: &str) -> &str {
    let trimmed = lang.trim().to_lowercase();
    match trimmed.as_str() {
        "rs" | "rust" => "rust",
        "py" | "python" | "py3" => "python",
        "js" | "javascript" | "node" => "javascript",
        "ts" | "typescript" | "jsx" | "tsx" => "javascript",
        "html" | "htm" => "html",
        "css" => "css",
        "json" => "json",
        "yaml" | "yml" => "yaml",
        "toml" => "yaml",
        "sh" | "bash" | "zsh" | "shell" => "bash",
        "ps1" | "powershell" | "posh" | "bat" | "cmd" => "bat",
        "java" => "java",
        "c" => "c",
        "cpp" | "c++" | "cc" | "cxx" => "c++",
        "cs" | "csharp" | "c#" => "c#",
        "go" | "golang" => "go",
        "sql" => "sql",
        "php" => "php",
        "rb" | "ruby" => "ruby",
        "xml" | "svg" => "xml",
        "md" | "markdown" => "markdown",
        _ => "plain",
    }
}

/// Resolves a syntax reference from an optional language identifier.
fn resolve_syntax<'a>(
    syntax_set: &'a SyntaxSet,
    language: Option<&str>,
) -> (&'a SyntaxReference, String) {
    if let Some(lang) = language {
        let trimmed = lang.trim();
        if !trimmed.is_empty() {
            let alias = normalize_language_alias(trimmed);
            if alias != "plain" {
                if let Some(syntax) = syntax_set
                    .find_syntax_by_token(alias)
                    .or_else(|| syntax_set.find_syntax_by_extension(alias))
                    .or_else(|| syntax_set.find_syntax_by_name(alias))
                {
                    return (syntax, syntax.name.clone());
                }
            }
            // Try raw input token if alias didn't match
            if let Some(syntax) = syntax_set
                .find_syntax_by_token(trimmed)
                .or_else(|| syntax_set.find_syntax_by_extension(trimmed))
                .or_else(|| syntax_set.find_syntax_by_name(trimmed))
            {
                return (syntax, syntax.name.clone());
            }
        }
    }

    (
        syntax_set.find_syntax_plain_text(),
        "Plain Text".to_string(),
    )
}

/// Highlights source code into structured tokens, preserving every character and line break.
pub fn highlight_code(
    code: &str,
    language: Option<&str>,
    theme_mode: Option<&str>,
) -> HighlightResult {
    let syntax_set = get_syntax_set();
    let theme_set = get_theme_set();

    let (syntax, resolved_lang) = resolve_syntax(syntax_set, language);
    let theme = select_theme(theme_set, theme_mode);

    // Oversized protection or empty code
    if code.len() > MAX_HIGHLIGHT_CODE_SIZE || code.is_empty() {
        let lines = LinesWithEndings::from(code)
            .map(|line| HighlightedLine {
                tokens: vec![HighlightedToken {
                    content: line.to_string(),
                    color: None,
                    font_style: None,
                }],
            })
            .collect();

        return HighlightResult {
            lines,
            language: resolved_lang,
        };
    }

    let mut highlighter = HighlightLines::new(syntax, theme);
    let mut lines = Vec::new();

    for line in LinesWithEndings::from(code) {
        match highlighter.highlight_line(line, syntax_set) {
            Ok(ranges) => {
                let tokens = ranges
                    .into_iter()
                    .map(|(style, text)| HighlightedToken {
                        content: text.to_string(),
                        color: Some(format_hex_color(style.foreground)),
                        font_style: format_font_style(style.font_style),
                    })
                    .collect();
                lines.push(HighlightedLine { tokens });
            }
            Err(_) => {
                lines.push(HighlightedLine {
                    tokens: vec![HighlightedToken {
                        content: line.to_string(),
                        color: None,
                        font_style: None,
                    }],
                });
            }
        }
    }

    HighlightResult {
        lines,
        language: resolved_lang,
    }
}
