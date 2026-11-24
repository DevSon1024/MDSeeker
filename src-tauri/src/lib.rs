pub mod commands;
pub mod file_manager;
pub mod highlighting;
pub mod markdown;
pub mod windows_integration;

pub use commands::{
    close_window, get_app_info, get_file_metadata, get_pending_files, highlight_code,
    is_default_app_registered, open_default_apps_settings, parse_markdown, peek_pending_files,
    ping, read_markdown_file, register_default_app, reveal_in_explorer, validate_markdown_file,
};
pub use windows_integration::{process_incoming_args, IncomingFileQueue};

use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. Process cold startup CLI arguments
    let initial_args: Vec<String> = std::env::args().collect();
    let cwd = std::env::current_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| ".".to_string());

    let candidate_args = if initial_args.len() > 1 {
        &initial_args[1..]
    } else {
        &[]
    };

    let initial_files = windows_integration::process_incoming_args(candidate_args, &cwd);
    let queue = windows_integration::IncomingFileQueue::new();
    for path in initial_files {
        queue.push_back(path);
    }

    tauri::Builder::default()
        // Register single-instance plugin before all other plugins
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            let valid_paths = windows_integration::process_incoming_args(&args, &cwd);

            // Buffer in queue so frontend can reliably drain even if not yet listening
            if let Some(q) = app.try_state::<windows_integration::IncomingFileQueue>() {
                for path in &valid_paths {
                    q.push_back(path.clone());
                }
            }

            // Restore, unminimize, and focus main window
            if let Some(window) = app.get_webview_window("main") {
                if window.is_minimized().unwrap_or(false) {
                    let _ = window.unminimize();
                }
                let _ = window.show();
                let _ = window.set_focus();
            }

            // Notify frontend
            if !valid_paths.is_empty() {
                let _ = app.emit("incoming-files", valid_paths);
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            windows_integration::ensure_windows_default_app_registered();

            // Safety fallback: ensure window is revealed even if webview JS is interrupted
            if let Some(window) = app.get_webview_window("main") {
                let w = window.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(1500));
                    let _ = w.show();
                });
            }

            Ok(())
        })
        .manage(queue)
        .invoke_handler(tauri::generate_handler![
            get_app_info,
            ping,
            read_markdown_file,
            get_file_metadata,
            validate_markdown_file,
            parse_markdown,
            highlight_code,
            reveal_in_explorer,
            get_pending_files,
            peek_pending_files,
            register_default_app,
            is_default_app_registered,
            open_default_apps_settings,
            close_window,
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
