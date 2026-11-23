use std::fs;
use std::path::{Path, PathBuf};
use crate::file_manager::errors::FileError;
use crate::file_manager::types::{MAX_FILE_SIZE_BYTES, SUPPORTED_EXTENSIONS};

/// Validates that the file has a supported Markdown extension (.md or .markdown, case-insensitive).
pub fn validate_extension(path: &Path) -> Result<String, FileError> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .ok_or_else(|| FileError::UnsupportedExtension(path.to_string_lossy().to_string()))?;

    let ext_lower = ext.to_lowercase();
    if SUPPORTED_EXTENSIONS.contains(&ext_lower.as_str()) {
        Ok(ext_lower)
    } else {
        Err(FileError::UnsupportedExtension(path.to_string_lossy().to_string()))
    }
}

/// Validates path existence, canonicalization, regular file status, extension, and size limits.
pub fn validate_path(raw_path: &str) -> Result<(PathBuf, fs::Metadata, String), FileError> {
    let trimmed = raw_path.trim();
    if trimmed.is_empty() {
        return Err(FileError::FileNotFound(raw_path.to_string()));
    }

    let path = Path::new(trimmed);

    // Canonicalize path to resolve symlinks, relative traversal (".."), and normalize Windows paths
    let canonical = dunce::canonicalize(path).map_err(|io_err| match io_err.kind() {
        std::io::ErrorKind::NotFound => FileError::FileNotFound(trimmed.to_string()),
        std::io::ErrorKind::PermissionDenied => FileError::PermissionDenied(trimmed.to_string()),
        _ => FileError::ReadFailed {
            path: trimmed.to_string(),
            reason: io_err.to_string(),
        },
    })?;

    // Query filesystem metadata
    let metadata = fs::metadata(&canonical).map_err(|io_err| match io_err.kind() {
        std::io::ErrorKind::NotFound => FileError::FileNotFound(canonical.to_string_lossy().to_string()),
        std::io::ErrorKind::PermissionDenied => {
            FileError::PermissionDenied(canonical.to_string_lossy().to_string())
        }
        _ => FileError::ReadFailed {
            path: canonical.to_string_lossy().to_string(),
            reason: io_err.to_string(),
        },
    })?;

    // Ensure target is a regular file (reject directories, devices, sockets)
    if !metadata.is_file() {
        return Err(FileError::NotAFile(canonical.to_string_lossy().to_string()));
    }

    // Verify extension
    let extension = validate_extension(&canonical)?;

    // Check size limit without reading into memory
    let file_size = metadata.len();
    if file_size > MAX_FILE_SIZE_BYTES {
        return Err(FileError::FileTooLarge {
            path: canonical.to_string_lossy().to_string(),
            size_bytes: file_size,
            max_bytes: MAX_FILE_SIZE_BYTES,
        });
    }

    Ok((canonical, metadata, extension))
}
