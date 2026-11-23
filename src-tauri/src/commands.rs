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
}
