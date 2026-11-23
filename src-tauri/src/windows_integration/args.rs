use std::path::{Path, PathBuf};
use crate::file_manager::validation::validate_path;

/// Processes raw incoming command-line arguments and returns a list of valid, canonicalized Markdown file paths.
///
/// Rules:
/// 1. Rejects CLI flags (starting with '-' or '--').
/// 2. Rejects executable binary paths (ending with '.exe', case-insensitive).
/// 3. Trims surrounding single or double quotes.
/// 4. Resolves relative paths against the provided `cwd`.
/// 5. Validates file extension (.md and .markdown, case-insensitive).
/// 6. Reuses `file_manager::validation::validate_path` for existence, regular file check, and 50MB size limit.
/// 7. Deduplicates canonicalized paths.
pub fn process_incoming_args(args: &[String], cwd: &str) -> Vec<String> {
    let mut valid_paths = Vec::new();

    for raw_arg in args {
        let trimmed = raw_arg.trim();
        if trimmed.is_empty() {
            continue;
        }

        // Ignore command line flags
        if trimmed.starts_with('-') {
            continue;
        }

        // Strip surrounding quotes if present
        let unquoted = trimmed
            .trim_matches('"')
            .trim_matches('\'')
            .trim();

        if unquoted.is_empty() {
            continue;
        }

        // Ignore executable binaries (case-insensitive)
        if unquoted.to_lowercase().ends_with(".exe") {
            continue;
        }

        // Resolve path: if relative, join with provided working directory
        let path_obj = Path::new(unquoted);
        let resolved_path = if path_obj.is_relative() {
            Path::new(cwd).join(path_obj)
        } else {
            PathBuf::from(path_obj)
        };

        // Quick extension check before hitting filesystem
        let ext_opt = resolved_path.extension().and_then(|e| e.to_str());
        match ext_opt {
            Some(ext) => {
                let ext_lower = ext.to_lowercase();
                if ext_lower != "md" && ext_lower != "markdown" {
                    continue;
                }
            }
            None => continue,
        }

        // Strict filesystem validation and canonicalization
        let path_str = resolved_path.to_string_lossy();
        if let Ok((canonical, _metadata, _ext)) = validate_path(&path_str) {
            let canonical_str = canonical.to_string_lossy().to_string();
            if !valid_paths.contains(&canonical_str) {
                valid_paths.push(canonical_str);
            }
        }
    }

    valid_paths
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::{self, File};
    use std::io::Write;

    struct TempTestDir {
        path: PathBuf,
    }

    impl TempTestDir {
        fn new(name: &str) -> Self {
            let mut path = std::env::temp_dir();
            path.push(format!("mdseeker_args_test_{}_{}", name, std::process::id()));
            let _ = fs::remove_dir_all(&path);
            fs::create_dir_all(&path).expect("Failed to create temp test directory");
            Self { path }
        }

        fn create_file(&self, file_name: &str, content: &[u8]) -> PathBuf {
            let p = self.path.join(file_name);
            if let Some(parent) = p.parent() {
                let _ = fs::create_dir_all(parent);
            }
            let mut f = File::create(&p).expect("Failed to create test file");
            f.write_all(content).expect("Failed to write content");
            p
        }
    }

    impl Drop for TempTestDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.path);
        }
    }

    #[test]
    fn test_process_empty_args() {
        let res = process_incoming_args(&[], "C:/");
        assert!(res.is_empty());
    }

    #[test]
    fn test_process_ignores_flags_and_binaries() {
        let dir = TempTestDir::new("flags_bin");
        let valid_file = dir.create_file("test.md", b"# Test");

        let args = vec![
            "mdseeker.exe".to_string(),
            "--devtools".to_string(),
            "-v".to_string(),
            "--".to_string(),
            valid_file.to_string_lossy().to_string(),
        ];

        let res = process_incoming_args(&args, &dir.path.to_string_lossy());
        assert_eq!(res.len(), 1);
        assert_eq!(res[0], dunce::canonicalize(&valid_file).unwrap().to_string_lossy().to_string());
    }

    #[test]
    fn test_process_absolute_and_relative_paths() {
        let dir = TempTestDir::new("abs_rel");
        let file1 = dir.create_file("doc1.md", b"Doc 1");
        let file2 = dir.create_file("doc2.markdown", b"Doc 2");

        let cwd = dir.path.to_string_lossy().to_string();

        let args = vec![
            file1.to_string_lossy().to_string(), // absolute
            "doc2.markdown".to_string(),          // relative to cwd
        ];

        let res = process_incoming_args(&args, &cwd);
        assert_eq!(res.len(), 2);
        assert!(res.contains(&dunce::canonicalize(&file1).unwrap().to_string_lossy().to_string()));
        assert!(res.contains(&dunce::canonicalize(&file2).unwrap().to_string_lossy().to_string()));
    }

    #[test]
    fn test_process_paths_with_spaces_and_quotes() {
        let dir = TempTestDir::new("spaces_quotes");
        let file = dir.create_file("My Notes 2026.md", b"Content with spaces");

        let cwd = dir.path.to_string_lossy().to_string();

        let args = vec![
            format!("\"{}\"", file.to_string_lossy()), // quoted absolute
            "'My Notes 2026.md'".to_string(),           // quoted relative
        ];

        let res = process_incoming_args(&args, &cwd);
        // Both point to the exact same file -> deduplicated to 1
        assert_eq!(res.len(), 1);
        assert_eq!(res[0], dunce::canonicalize(&file).unwrap().to_string_lossy().to_string());
    }

    #[test]
    fn test_process_unicode_and_parentheses_paths() {
        let dir = TempTestDir::new("unicode_parens");
        let file1 = dir.create_file("日本語_テスト.md", b"Japanese filename");
        let file2 = dir.create_file("Draft (v1.0).markdown", b"Parentheses filename");

        let cwd = dir.path.to_string_lossy().to_string();

        let args = vec![
            "日本語_テスト.md".to_string(),
            "Draft (v1.0).markdown".to_string(),
        ];

        let res = process_incoming_args(&args, &cwd);
        assert_eq!(res.len(), 2);
        assert!(res.contains(&dunce::canonicalize(&file1).unwrap().to_string_lossy().to_string()));
        assert!(res.contains(&dunce::canonicalize(&file2).unwrap().to_string_lossy().to_string()));
    }

    #[test]
    fn test_process_rejects_unsupported_extensions() {
        let dir = TempTestDir::new("unsupported");
        let _txt = dir.create_file("readme.txt", b"text file");
        let _pdf = dir.create_file("report.pdf", b"pdf file");
        let _bin = dir.create_file("app.exe", b"exe file");
        let valid = dir.create_file("guide.md", b"# Guide");

        let cwd = dir.path.to_string_lossy().to_string();

        let args = vec![
            "readme.txt".to_string(),
            "report.pdf".to_string(),
            "app.exe".to_string(),
            "guide.md".to_string(),
        ];

        let res = process_incoming_args(&args, &cwd);
        assert_eq!(res.len(), 1);
        assert_eq!(res[0], dunce::canonicalize(&valid).unwrap().to_string_lossy().to_string());
    }

    #[test]
    fn test_process_rejects_nonexistent_and_directories() {
        let dir = TempTestDir::new("missing_dir");
        let sub_dir = dir.path.join("sub_dir.md");
        fs::create_dir_all(&sub_dir).expect("Failed to create sub dir");

        let cwd = dir.path.to_string_lossy().to_string();

        let args = vec![
            "nonexistent_file.md".to_string(),
            "sub_dir.md".to_string(), // directory with .md extension
        ];

        let res = process_incoming_args(&args, &cwd);
        assert!(res.is_empty());
    }
}
