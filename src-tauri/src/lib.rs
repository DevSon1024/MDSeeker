pub mod commands;

pub use commands::{get_app_info, ping};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_app_info, ping])
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
