use serde::{Deserialize, Serialize};

/// Maximum allowed file size for reading into memory (20 MB).
pub const MAX_FILE_SIZE_BYTES: u64 = 20 * 1024 * 1024;

/// Supported Markdown file extensions (lowercase).
pub const SUPPORTED_EXTENSIONS: &[&str] = &["md", "markdown"];

/// Structured document response returned to the frontend upon successful file read.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DocumentResponse {
    pub canonical_path: String,
    pub file_name: String,
    pub file_extension: String,
    pub file_size_bytes: u64,
    pub last_modified_timestamp: Option<u64>,
    pub raw_content: String,
}

/// Metadata information for a validated Markdown file.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DocumentMetadata {
    pub canonical_path: String,
    pub file_name: String,
    pub file_extension: String,
    pub file_size_bytes: u64,
    pub last_modified_timestamp: Option<u64>,
    pub is_readonly: bool,
}

/// Structured frontend-safe error response.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct FileErrorResponse {
    pub code: String,
    pub message: String,
    pub path: Option<String>,
    pub details: Option<String>,
}

/// Structured result of validating a potential Markdown file.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub canonical_path: Option<String>,
    pub file_name: Option<String>,
    pub file_size_bytes: Option<u64>,
    pub error: Option<FileErrorResponse>,
}
