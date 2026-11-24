use crate::file_manager::errors::FileError;
use crate::file_manager::types::{
    DocumentMetadata, DocumentResponse, FileErrorResponse, ValidationResult, MAX_FILE_SIZE_BYTES,
};
use crate::file_manager::validation::validate_path;
use std::fs;
use std::time::UNIX_EPOCH;

/// Reads a validated Markdown file into memory, strictly enforcing UTF-8 encoding and size limits.
pub fn read_markdown_file(raw_path: &str) -> Result<DocumentResponse, FileError> {
    let (canonical_path, metadata, extension) = validate_path(raw_path)?;
    let canonical_str = canonical_path.to_string_lossy().to_string();

    // Read raw bytes from the validated file
    let bytes = fs::read(&canonical_path).map_err(|io_err| match io_err.kind() {
        std::io::ErrorKind::NotFound => FileError::FileNotFound(canonical_str.clone()),
        std::io::ErrorKind::PermissionDenied => FileError::PermissionDenied(canonical_str.clone()),
        _ => FileError::ReadFailed {
            path: canonical_str.clone(),
            reason: io_err.to_string(),
        },
    })?;

    // Guard against race conditions where the file grew between metadata inspection and read
    let actual_size = bytes.len() as u64;
    if actual_size > MAX_FILE_SIZE_BYTES {
        return Err(FileError::FileTooLarge {
            path: canonical_str,
            size_bytes: actual_size,
            max_bytes: MAX_FILE_SIZE_BYTES,
        });
    }

    // Strict UTF-8 validation (never silently lossy replace characters)
    let raw_content = std::str::from_utf8(&bytes)
        .map_err(|utf8_err| FileError::InvalidUtf8 {
            path: canonical_str.clone(),
            reason: format!(
                "Invalid UTF-8 byte sequence detected at byte position {}",
                utf8_err.valid_up_to()
            ),
        })?
        .to_string();

    let file_name = canonical_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("document.md")
        .to_string();

    let last_modified_timestamp = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64);

    Ok(DocumentResponse {
        canonical_path: canonical_str,
        file_name,
        file_extension: extension,
        file_size_bytes: actual_size,
        last_modified_timestamp,
        raw_content,
    })
}

/// Retrieves validated metadata for a Markdown file.
pub fn get_metadata(raw_path: &str) -> Result<DocumentMetadata, FileError> {
    let (canonical_path, metadata, extension) = validate_path(raw_path)?;
    let canonical_str = canonical_path.to_string_lossy().to_string();

    let file_name = canonical_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("document.md")
        .to_string();

    let last_modified_timestamp = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64);

    let is_readonly = metadata.permissions().readonly();

    Ok(DocumentMetadata {
        canonical_path: canonical_str,
        file_name,
        file_extension: extension,
        file_size_bytes: metadata.len(),
        last_modified_timestamp,
        is_readonly,
    })
}

/// Validates a potential Markdown file path and returns a structured validation outcome.
pub fn validate_file(raw_path: &str) -> ValidationResult {
    match validate_path(raw_path) {
        Ok((canonical_path, metadata, _)) => {
            let canonical_str = canonical_path.to_string_lossy().to_string();
            let file_name = canonical_path
                .file_name()
                .and_then(|n| n.to_str())
                .map(|s| s.to_string());

            ValidationResult {
                is_valid: true,
                canonical_path: Some(canonical_str),
                file_name,
                file_size_bytes: Some(metadata.len()),
                error: None,
            }
        }
        Err(err) => {
            let resp: FileErrorResponse = err.into();
            ValidationResult {
                is_valid: false,
                canonical_path: None,
                file_name: None,
                file_size_bytes: None,
                error: Some(resp),
            }
        }
    }
}
