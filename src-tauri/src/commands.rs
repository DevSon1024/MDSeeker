use crate::file_manager::{
    self, DocumentMetadata, DocumentResponse, FileErrorResponse, ValidationResult,
};
use serde::{Deserialize, Serialize};

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

/// Reveals a file in Windows File Explorer after strictly validating its path.
#[tauri::command]
pub fn reveal_in_explorer(path: String) -> Result<(), String> {
    let validation = file_manager::validate_file(&path);
    if !validation.is_valid {
        return Err("Cannot reveal file: path is invalid or file does not exist".to_string());
    }

    let canonical = validation.canonical_path.unwrap_or(path);
    let win_path = canonical.replace('/', "\\");

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer.exe")
            .arg(format!("/select,{}", win_path))
            .spawn()
            .map_err(|e| format!("Failed to launch File Explorer: {}", e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = win_path;
    }

    Ok(())
}

/// Drains and returns all pending startup / incoming files from the queue.
#[tauri::command]
pub fn get_pending_files(
    state: tauri::State<'_, crate::windows_integration::IncomingFileQueue>,
) -> Vec<String> {
    state.drain_all()
}

/// Inspects all currently pending files without clearing the queue.
#[tauri::command]
pub fn peek_pending_files(
    state: tauri::State<'_, crate::windows_integration::IncomingFileQueue>,
) -> Vec<String> {
    state.peek_all()
}

/// Registers MDSeeker as a default application in the Windows registry for .md and .markdown.
#[tauri::command]
pub fn register_default_app() -> Result<(), String> {
    crate::windows_integration::register_windows_default_app()
}

/// Checks whether MDSeeker is registered as a handler in the Windows registry.
#[tauri::command]
pub fn is_default_app_registered() -> Result<bool, String> {
    Ok(crate::windows_integration::is_windows_default_app_registered())
}

/// Launches the Windows Default Apps system settings page (ms-settings:defaultapps).
#[tauri::command]
pub fn open_default_apps_settings() -> Result<(), String> {
    crate::windows_integration::open_windows_default_apps_settings()
}

/// Closes and destroys the current application window reliably from the backend.
#[tauri::command]
pub fn close_window(window: tauri::Window) -> Result<(), String> {
    window
        .destroy()
        .map_err(|e| format!("Failed to close window: {}", e))
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
        let res = highlight_code(
            "let a = 1;".to_string(),
            Some("rust".to_string()),
            Some("dark".to_string()),
        );
        assert_eq!(res.language, "Rust");
        assert_eq!(res.lines.len(), 1);
        let reconstructed: String = res
            .lines
            .iter()
            .flat_map(|l| &l.tokens)
            .map(|t| t.content.as_str())
            .collect();
        assert_eq!(reconstructed, "let a = 1;");
    }

    #[test]
    fn test_command_reveal_in_explorer_invalid_path() {
        let res = reveal_in_explorer("C:/nonexistent_file_xyz_123.md".to_string());
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("Cannot reveal file"));
    }

    #[test]
    fn test_command_is_default_app_registered() {
        let res = is_default_app_registered();
        assert!(res.is_ok());
    }
}
