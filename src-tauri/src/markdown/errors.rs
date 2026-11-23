use serde::{Deserialize, Serialize};

/// Structured error returned when Markdown parsing or serialization fails.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ParseError {
    /// Machine-readable error code.
    pub code: String,
    /// Human-readable error description.
    pub message: String,
    /// Optional additional details or context.
    pub details: Option<String>,
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}]: {}", self.code, self.message)
    }
}

impl std::error::Error for ParseError {}
