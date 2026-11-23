pub mod commands;
pub mod file_manager;
pub mod markdown;

pub use commands::{
    get_app_info, get_file_metadata, parse_markdown, ping, read_markdown_file,
    validate_markdown_file,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_app_info,
            ping,
            read_markdown_file,
            get_file_metadata,
            validate_markdown_file,
            parse_markdown,
        ])
        .run(tauri::generate_context!())
        .expect("error while running MDSeeker application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_module_compiles() {
        let info = commands::get_app_info();
        assert_eq!(info.identifier, "com.devson.mdseeker");
    }
}
