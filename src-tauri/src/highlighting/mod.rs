pub mod highlighter;
pub mod themes;
pub mod types;

#[cfg(test)]
pub mod tests;

pub use highlighter::{highlight_code, normalize_language_alias};
pub use types::{HighlightResult, HighlightedLine, HighlightedToken};
