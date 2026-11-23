use serde::{Deserialize, Serialize};

/// An individual syntax-highlighted token with exact content string, optional hex color, and font style.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct HighlightedToken {
    pub content: String,
    pub color: Option<String>,
    pub font_style: Option<String>,
}

/// A line of syntax-highlighted tokens.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct HighlightedLine {
    pub tokens: Vec<HighlightedToken>,
}

/// The complete highlighting result for a block of code.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct HighlightResult {
    pub lines: Vec<HighlightedLine>,
    pub language: String,
}
