use std::fmt;
use crate::file_manager::types::FileErrorResponse;

#[derive(Debug, PartialEq, Eq)]
pub enum FileError {
    FileNotFound(String),
    UnsupportedExtension(String),
    FileTooLarge {
        path: String,
        size_bytes: u64,
        max_bytes: u64,
    },
    PermissionDenied(String),
    InvalidUtf8 {
        path: String,
        reason: String,
    },
    NotAFile(String),
    ReadFailed {
        path: String,
        reason: String,
    },
}

impl fmt::Display for FileError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            FileError::FileNotFound(path) => {
                write!(f, "File not found: '{}'", path)
            }
            FileError::UnsupportedExtension(path) => {
                write!(
                    f,
                    "Unsupported file format for '{}'. Only .md and .markdown are supported.",
                    path
                )
            }
            FileError::FileTooLarge { path, size_bytes, max_bytes } => {
                write!(
                    f,
                    "File '{}' exceeds maximum allowed size ({} bytes > {} bytes limit).",
                    path, size_bytes, max_bytes
                )
            }
            FileError::PermissionDenied(path) => {
                write!(f, "Access denied reading file: '{}'", path)
            }
            FileError::InvalidUtf8 { path, reason } => {
                write!(f, "File '{}' is not valid UTF-8 text: {}", path, reason)
            }
            FileError::NotAFile(path) => {
                write!(f, "Target is not a regular file: '{}'", path)
            }
            FileError::ReadFailed { path, reason } => {
                write!(f, "Failed to read file '{}': {}", path, reason)
            }
        }
    }
}

impl std::error::Error for FileError {}

impl From<FileError> for FileErrorResponse {
    fn from(err: FileError) -> Self {
        match err {
            FileError::FileNotFound(path) => FileErrorResponse {
                code: "FILE_NOT_FOUND".to_string(),
                message: "The requested file does not exist or has been moved.".to_string(),
                path: Some(path),
                details: None,
            },
            FileError::UnsupportedExtension(path) => FileErrorResponse {
                code: "UNSUPPORTED_EXTENSION".to_string(),
                message: "Only Markdown documents (.md, .markdown) are supported.".to_string(),
                path: Some(path),
                details: None,
            },
            FileError::FileTooLarge { path, size_bytes, max_bytes } => FileErrorResponse {
                code: "FILE_TOO_LARGE".to_string(),
                message: format!(
                    "File exceeds maximum size limit of {} MB.",
                    max_bytes / (1024 * 1024)
                ),
                path: Some(path),
                details: Some(format!("File size: {} bytes, Limit: {} bytes", size_bytes, max_bytes)),
            },
            FileError::PermissionDenied(path) => FileErrorResponse {
                code: "PERMISSION_DENIED".to_string(),
                message: "Permission denied while attempting to access the file.".to_string(),
                path: Some(path),
                details: None,
            },
            FileError::InvalidUtf8 { path, reason } => FileErrorResponse {
                code: "INVALID_UTF8".to_string(),
                message: "File contains invalid binary or non-UTF-8 encoded characters.".to_string(),
                path: Some(path),
                details: Some(reason),
            },
            FileError::NotAFile(path) => FileErrorResponse {
                code: "NOT_A_FILE".to_string(),
                message: "The selected path is a directory or special device, not a file.".to_string(),
                path: Some(path),
                details: None,
            },
            FileError::ReadFailed { path, reason } => FileErrorResponse {
                code: "READ_FAILED".to_string(),
                message: "An error occurred while reading the file.".to_string(),
                path: Some(path),
                details: Some(reason),
            },
        }
    }
}
