pub mod errors;
pub mod reader;
pub mod types;
pub mod validation;

pub use errors::FileError;
pub use reader::{get_metadata, read_markdown_file, validate_file};
pub use types::{
    DocumentMetadata, DocumentResponse, FileErrorResponse, ValidationResult, MAX_FILE_SIZE_BYTES,
    SUPPORTED_EXTENSIONS,
};

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::{self, File};
    use std::io::Write;
    use std::path::PathBuf;

    struct TempTestDir {
        path: PathBuf,
    }

    impl TempTestDir {
        fn new(name: &str) -> Self {
            let mut path = std::env::temp_dir();
            path.push(format!("mdseeker_test_{}_{}", name, std::process::id()));
            let _ = fs::remove_dir_all(&path);
            fs::create_dir_all(&path).expect("Failed to create temp test directory");
            Self { path }
        }

        fn file_path(&self, file_name: &str) -> PathBuf {
            self.path.join(file_name)
        }

        fn create_file(&self, file_name: &str, content: &[u8]) -> PathBuf {
            let p = self.file_path(file_name);
            let mut f = File::create(&p).expect("Failed to create test file");
            f.write_all(content).expect("Failed to write test file content");
            p
        }
    }

    impl Drop for TempTestDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.path);
        }
    }

    #[test]
    fn test_read_valid_md_file() {
        let dir = TempTestDir::new("valid_md");
        let content = b"# Hello World\n\nThis is MDSeeker.";
        let file = dir.create_file("test.md", content);

        let res = read_markdown_file(&file.to_string_lossy()).expect("Failed to read valid .md");
        assert_eq!(res.file_name, "test.md");
        assert_eq!(res.file_extension, "md");
        assert_eq!(res.file_size_bytes, content.len() as u64);
        assert_eq!(res.raw_content, "# Hello World\n\nThis is MDSeeker.");
        assert!(res.last_modified_timestamp.is_some());
    }

    #[test]
    fn test_read_valid_markdown_file() {
        let dir = TempTestDir::new("valid_markdown");
        let content = b"Document with .markdown extension.";
        let file = dir.create_file("doc.markdown", content);

        let res = read_markdown_file(&file.to_string_lossy()).expect("Failed to read valid .markdown");
        assert_eq!(res.file_name, "doc.markdown");
        assert_eq!(res.file_extension, "markdown");
        assert_eq!(res.raw_content, "Document with .markdown extension.");
    }

    #[test]
    fn test_read_uppercase_extensions() {
        let dir = TempTestDir::new("uppercase_ext");
        let file1 = dir.create_file("TEST1.MD", b"uppercase md");
        let file2 = dir.create_file("TEST2.MARKDOWN", b"uppercase markdown");

        let res1 = read_markdown_file(&file1.to_string_lossy()).expect("Failed uppercase .MD");
        assert_eq!(res1.file_extension, "md");

        let res2 = read_markdown_file(&file2.to_string_lossy()).expect("Failed uppercase .MARKDOWN");
        assert_eq!(res2.file_extension, "markdown");
    }

    #[test]
    fn test_read_empty_file() {
        let dir = TempTestDir::new("empty");
        let file = dir.create_file("empty.md", b"");

        let res = read_markdown_file(&file.to_string_lossy()).expect("Failed to read empty file");
        assert_eq!(res.file_size_bytes, 0);
        assert_eq!(res.raw_content, "");
    }

    #[test]
    fn test_reject_unsupported_extensions() {
        let dir = TempTestDir::new("unsupported");
        let file1 = dir.create_file("notes.txt", b"plain text");
        let file2 = dir.create_file("data.json", b"{}");
        let file3 = dir.create_file("no_ext", b"no extension");

        let err1 = read_markdown_file(&file1.to_string_lossy()).unwrap_err();
        assert!(matches!(err1, FileError::UnsupportedExtension(_)));

        let err2 = read_markdown_file(&file2.to_string_lossy()).unwrap_err();
        assert!(matches!(err2, FileError::UnsupportedExtension(_)));

        let err3 = read_markdown_file(&file3.to_string_lossy()).unwrap_err();
        assert!(matches!(err3, FileError::UnsupportedExtension(_)));
    }

    #[test]
    fn test_reject_missing_file() {
        let dir = TempTestDir::new("missing");
        let non_existent = dir.file_path("does_not_exist.md");

        let err = read_markdown_file(&non_existent.to_string_lossy()).unwrap_err();
        assert!(matches!(err, FileError::FileNotFound(_)));
    }

    #[test]
    fn test_reject_directory() {
        let dir = TempTestDir::new("dir_as_file");
        let sub_dir = dir.path.join("fake_folder.md");
        fs::create_dir_all(&sub_dir).expect("Failed to create sub dir");

        let err = read_markdown_file(&sub_dir.to_string_lossy()).unwrap_err();
        assert!(matches!(err, FileError::NotAFile(_)));
    }

    #[test]
    fn test_reject_invalid_utf8() {
        let dir = TempTestDir::new("invalid_utf8");
        // Invalid UTF-8 byte sequence: 0xFF, 0xFE
        let invalid_bytes = vec![0xFF, 0xFE, 0x41, 0x42];
        let file = dir.create_file("invalid.md", &invalid_bytes);

        let err = read_markdown_file(&file.to_string_lossy()).unwrap_err();
        match err {
            FileError::InvalidUtf8 { reason, .. } => {
                assert!(reason.contains("Invalid UTF-8"));
            }
            other => panic!("Expected InvalidUtf8 error, got: {:?}", other),
        }
    }

    #[test]
    fn test_get_file_metadata() {
        let dir = TempTestDir::new("metadata");
        let content = b"Sample text for metadata check";
        let file = dir.create_file("meta.md", content);

        let meta = get_metadata(&file.to_string_lossy()).expect("Failed to get metadata");
        assert_eq!(meta.file_name, "meta.md");
        assert_eq!(meta.file_extension, "md");
        assert_eq!(meta.file_size_bytes, content.len() as u64);
        assert!(meta.last_modified_timestamp.is_some());
    }

    #[test]
    fn test_validate_file_helper() {
        let dir = TempTestDir::new("validate_helper");
        let file = dir.create_file("valid.md", b"# Valid");
        let bad_file = dir.create_file("bad.pdf", b"%PDF");

        let valid_res = validate_file(&file.to_string_lossy());
        assert!(valid_res.is_valid);
        assert_eq!(valid_res.file_name.as_deref(), Some("valid.md"));
        assert!(valid_res.error.is_none());

        let invalid_res = validate_file(&bad_file.to_string_lossy());
        assert!(!invalid_res.is_valid);
        assert!(invalid_res.error.is_some());
        assert_eq!(invalid_res.error.unwrap().code, "UNSUPPORTED_EXTENSION");
    }

    #[test]
    fn test_error_response_conversion() {
        let err = FileError::FileTooLarge {
            path: "huge.md".to_string(),
            size_bytes: 30 * 1024 * 1024,
            max_bytes: 20 * 1024 * 1024,
        };
        let resp: FileErrorResponse = err.into();
        assert_eq!(resp.code, "FILE_TOO_LARGE");
        assert!(resp.message.contains("20 MB"));
        assert_eq!(resp.path.as_deref(), Some("huge.md"));
    }
}
