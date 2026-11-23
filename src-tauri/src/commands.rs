use serde::{Deserialize, Serialize};
use crate::file_manager::{
    self, DocumentMetadata, DocumentResponse, FileErrorResponse, ValidationResult,
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub identifier: String,
    pub platform: String,
}

#[tauri::command]
pub fn get_app_info() -> AppInfo {
    AppInfo {
        name: "MDSeeker".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        identifier: "com.devson.mdseeker".to_string(),
        platform: std::env::consts::OS.to_string(),
    }
}

#[tauri::command]
pub fn ping(message: Option<String>) -> String {
    match message {
        Some(msg) => format!("pong: {}", msg),
        None => "pong".to_string(),
    }
}

/// Reads a Markdown file (.md, .markdown) after strictly validating path, extension, UTF-8, and size limits.
#[tauri::command]
pub fn read_markdown_file(path: String) -> Result<DocumentResponse, FileErrorResponse> {
    file_manager::read_markdown_file(&path).map_err(|err| err.into())
}

/// Retrieves validated metadata for a Markdown file.
#[tauri::command]
pub fn get_file_metadata(path: String) -> Result<DocumentMetadata, FileErrorResponse> {
    file_manager::get_metadata(&path).map_err(|err| err.into())
}

/// Validates a candidate Markdown file without loading its full content.
#[tauri::command]
pub fn validate_markdown_file(path: String) -> ValidationResult {
    file_manager::validate_file(&path)
}

/// Parses raw Markdown content into a structured, serializable MarkdownDocument AST.
#[tauri::command]
pub fn parse_markdown(
    content: String,
    options: Option<crate::markdown::MarkdownParseOptions>,
) -> Result<crate::markdown::MarkdownDocument, crate::markdown::ParseError> {
    crate::markdown::parse_markdown(&content, options)
}

/// Highlights source code into structured tokens using syntect.
#[tauri::command]
pub fn highlight_code(
    code: String,
    language: Option<String>,
    theme: Option<String>,
) -> crate::highlighting::HighlightResult {
    crate::highlighting::highlight_code(&code, language.as_deref(), theme.as_deref())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_app_info() {
        let info = get_app_info();
        assert_eq!(info.name, "MDSeeker");
        assert_eq!(info.identifier, "com.devson.mdseeker");
        assert!(!info.version.is_empty());
        assert!(!info.platform.is_empty());
    }

    #[test]
    fn test_ping_without_message() {
        let res = ping(None);
        assert_eq!(res, "pong");
    }

    #[test]
    fn test_ping_with_message() {
        let res = ping(Some("hello from frontend".to_string()));
        assert_eq!(res, "pong: hello from frontend");
    }

    #[test]
    fn test_command_validate_nonexistent() {
        let res = validate_markdown_file("D:/nonexistent_file_xyz.md".to_string());
        assert!(!res.is_valid);
        assert!(res.error.is_some());
        assert_eq!(res.error.unwrap().code, "FILE_NOT_FOUND");
    }

    #[test]
    fn test_command_highlight_code() {
        let res = highlight_code("let a = 1;".to_string(), Some("rust".to_string()), Some("dark".to_string()));
        assert_eq!(res.language, "Rust");
        assert_eq!(res.lines.len(), 1);
        let reconstructed: String = res.lines.iter().flat_map(|l| &l.tokens).map(|t| t.content.as_str()).collect();
        assert_eq!(reconstructed, "let a = 1;");
    }
}
