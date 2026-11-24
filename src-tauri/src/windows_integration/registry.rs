#[cfg(windows)]
use winreg::enums::*;
#[cfg(windows)]
use winreg::RegKey;

#[cfg(windows)]
extern "system" {
    fn SHChangeNotify(
        w_event_id: i32,
        u_flags: u32,
        dw_item1: *const std::ffi::c_void,
        dw_item2: *const std::ffi::c_void,
    );
}

/// Registers MDSeeker in the Windows Current User registry as a default application
/// capable of handling .md and .markdown documents.
///
/// Configures:
/// 1. HKCU\Software\RegisteredApplications (Windows Settings > Default Apps capability probe)
/// 2. HKCU\Software\MDSeeker\Capabilities (Metadata, FileAssociations, and MimeAssociations)
/// 3. HKCU\Software\Classes\MDSeeker.Document (ProgID with shell\open\command)
/// 4. HKCU\Software\Classes\.md\OpenWithProgids and .markdown\OpenWithProgids
/// 5. HKCU\Software\Classes\Applications\MDSeeker.exe (SupportedTypes and Open With registration)
#[cfg(windows)]
pub fn register_windows_default_app() -> Result<(), String> {
    let exe_path_buf = std::env::current_exe()
        .map_err(|e| format!("Failed to determine current executable path: {}", e))?;
    let exe_path = exe_path_buf.to_string_lossy().to_string();

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let software = hkcu
        .open_subkey_with_flags("Software", KEY_ALL_ACCESS)
        .map_err(|e| format!("Failed to open HKCU\\Software: {}", e))?;

    // 1. HKCU\Software\RegisteredApplications
    let (registered_apps, _) = software
        .create_subkey("RegisteredApplications")
        .map_err(|e| {
            format!(
                "Failed to access HKCU\\Software\\RegisteredApplications: {}",
                e
            )
        })?;
    registered_apps
        .set_value("MDSeeker", &"Software\\MDSeeker\\Capabilities")
        .map_err(|e| format!("Failed to register in RegisteredApplications: {}", e))?;

    // 2. HKCU\Software\MDSeeker\Capabilities
    let (mdseeker_root, _) = software
        .create_subkey("MDSeeker")
        .map_err(|e| format!("Failed to create HKCU\\Software\\MDSeeker: {}", e))?;
    let (capabilities, _) = mdseeker_root
        .create_subkey("Capabilities")
        .map_err(|e| format!("Failed to create MDSeeker Capabilities: {}", e))?;

    capabilities
        .set_value("ApplicationName", &"MDSeeker")
        .map_err(|e| format!("Failed to set ApplicationName: {}", e))?;
    capabilities
        .set_value(
            "ApplicationDescription",
            &"Lightweight, blazing-fast Markdown viewer for Windows",
        )
        .map_err(|e| format!("Failed to set ApplicationDescription: {}", e))?;
    capabilities
        .set_value("ApplicationIcon", &format!("\"{}\",0", exe_path))
        .map_err(|e| format!("Failed to set ApplicationIcon: {}", e))?;

    let (file_assoc, _) = capabilities
        .create_subkey("FileAssociations")
        .map_err(|e| format!("Failed to create FileAssociations: {}", e))?;
    file_assoc
        .set_value(".md", &"MDSeeker.Document")
        .map_err(|e| format!("Failed to set .md association: {}", e))?;
    file_assoc
        .set_value(".markdown", &"MDSeeker.Document")
        .map_err(|e| format!("Failed to set .markdown association: {}", e))?;

    let (mime_assoc, _) = capabilities
        .create_subkey("MimeAssociations")
        .map_err(|e| format!("Failed to create MimeAssociations: {}", e))?;
    mime_assoc
        .set_value("text/markdown", &"MDSeeker.Document")
        .map_err(|e| format!("Failed to set MIME association: {}", e))?;

    // 3. HKCU\Software\Classes\MDSeeker.Document (ProgID)
    let (classes, _) = software
        .create_subkey("Classes")
        .map_err(|e| format!("Failed to open HKCU\\Software\\Classes: {}", e))?;

    let (prog_id, _) = classes
        .create_subkey("MDSeeker.Document")
        .map_err(|e| format!("Failed to create ProgID MDSeeker.Document: {}", e))?;
    prog_id
        .set_value("", &"Markdown Document")
        .map_err(|e| format!("Failed to set ProgID default description: {}", e))?;
    prog_id
        .set_value("FriendlyTypeName", &"Markdown Document")
        .map_err(|e| format!("Failed to set FriendlyTypeName: {}", e))?;
    prog_id
        .set_value("CurVer", &"MDSeeker.Document")
        .map_err(|e| format!("Failed to set CurVer: {}", e))?;

    let (prog_icon, _) = prog_id
        .create_subkey("DefaultIcon")
        .map_err(|e| format!("Failed to create ProgID DefaultIcon: {}", e))?;
    prog_icon
        .set_value("", &format!("\"{}\",0", exe_path))
        .map_err(|e| format!("Failed to set ProgID icon: {}", e))?;

    let (prog_shell, _) = prog_id
        .create_subkey("shell")
        .map_err(|e| format!("Failed to create ProgID shell: {}", e))?;
    let (prog_open, _) = prog_shell
        .create_subkey("open")
        .map_err(|e| format!("Failed to create ProgID open verb: {}", e))?;
    prog_open
        .set_value("FriendlyAppName", &"MDSeeker")
        .map_err(|e| format!("Failed to set ProgID FriendlyAppName: {}", e))?;

    let (prog_cmd, _) = prog_open
        .create_subkey("command")
        .map_err(|e| format!("Failed to create ProgID command: {}", e))?;
    prog_cmd
        .set_value("", &format!("\"{}\" \"%1\"", exe_path))
        .map_err(|e| format!("Failed to set ProgID open command: {}", e))?;

    // 4. OpenWithProgids registration for .md and .markdown
    let (dot_md, _) = classes
        .create_subkey(".md")
        .map_err(|e| format!("Failed to open .md class: {}", e))?;
    let (open_with_md, _) = dot_md
        .create_subkey("OpenWithProgids")
        .map_err(|e| format!("Failed to open .md OpenWithProgids: {}", e))?;
    open_with_md
        .set_value("MDSeeker.Document", &"")
        .map_err(|e| format!("Failed to associate MDSeeker.Document with .md: {}", e))?;

    let (dot_markdown, _) = classes
        .create_subkey(".markdown")
        .map_err(|e| format!("Failed to open .markdown class: {}", e))?;
    let (open_with_markdown, _) = dot_markdown
        .create_subkey("OpenWithProgids")
        .map_err(|e| format!("Failed to open .markdown OpenWithProgids: {}", e))?;
    open_with_markdown
        .set_value("MDSeeker.Document", &"")
        .map_err(|e| {
            format!(
                "Failed to associate MDSeeker.Document with .markdown: {}",
                e
            )
        })?;

    // 5. HKCU\Software\Classes\Applications\MDSeeker.exe
    let (apps, _) = classes
        .create_subkey("Applications")
        .map_err(|e| format!("Failed to open Applications key: {}", e))?;
    let (mdseeker_app, _) = apps
        .create_subkey("MDSeeker.exe")
        .map_err(|e| format!("Failed to open Applications\\MDSeeker.exe: {}", e))?;
    mdseeker_app
        .set_value("FriendlyAppName", &"MDSeeker")
        .map_err(|e| format!("Failed to set Application FriendlyAppName: {}", e))?;

    let (app_icon, _) = mdseeker_app
        .create_subkey("DefaultIcon")
        .map_err(|e| format!("Failed to create Application DefaultIcon: {}", e))?;
    app_icon
        .set_value("", &format!("\"{}\",0", exe_path))
        .map_err(|e| format!("Failed to set Application icon: {}", e))?;

    let (supported_types, _) = mdseeker_app
        .create_subkey("SupportedTypes")
        .map_err(|e| format!("Failed to create SupportedTypes: {}", e))?;
    supported_types
        .set_value(".md", &"")
        .map_err(|e| format!("Failed to add .md to SupportedTypes: {}", e))?;
    supported_types
        .set_value(".markdown", &"")
        .map_err(|e| format!("Failed to add .markdown to SupportedTypes: {}", e))?;

    let (app_shell, _) = mdseeker_app
        .create_subkey("shell")
        .map_err(|e| format!("Failed to create Application shell: {}", e))?;
    let (app_open, _) = app_shell
        .create_subkey("open")
        .map_err(|e| format!("Failed to create Application open verb: {}", e))?;
    let (app_cmd, _) = app_open
        .create_subkey("command")
        .map_err(|e| format!("Failed to create Application open command: {}", e))?;
    app_cmd
        .set_value("", &format!("\"{}\" \"%1\"", exe_path))
        .map_err(|e| format!("Failed to set Application command: {}", e))?;

    // Notify Windows Shell that file associations have changed (SHCNE_ASSOCCHANGED = 0x08000000)
    unsafe {
        SHChangeNotify(0x0800_0000, 0, std::ptr::null(), std::ptr::null());
    }

    Ok(())
}

#[cfg(not(windows))]
pub fn register_windows_default_app() -> Result<(), String> {
    Err("Windows default application registration is only supported on Windows".to_string())
}

/// Checks whether MDSeeker is registered under HKCU\Software\RegisteredApplications.
#[cfg(windows)]
pub fn is_windows_default_app_registered() -> bool {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(software) = hkcu.open_subkey("Software\\RegisteredApplications") {
        if let Ok(target) = software.get_value::<String, _>("MDSeeker") {
            return target == "Software\\MDSeeker\\Capabilities";
        }
    }
    false
}

#[cfg(not(windows))]
pub fn is_windows_default_app_registered() -> bool {
    false
}

/// Idempotent startup check to ensure the running executable is registered in the registry.
#[cfg(windows)]
pub fn ensure_windows_default_app_registered() {
    // Attempt registration in background without interrupting launch
    let _ = register_windows_default_app();
}

#[cfg(not(windows))]
pub fn ensure_windows_default_app_registered() {}

/// Opens the Windows Settings page for Default Apps (`ms-settings:defaultapps`).
pub fn open_windows_default_apps_settings() -> Result<(), String> {
    #[cfg(windows)]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "ms-settings:defaultapps"])
            .spawn()
            .map_err(|e| format!("Failed to open Windows default apps settings: {}", e))?;
        Ok(())
    }
    #[cfg(not(windows))]
    {
        Err("ms-settings:defaultapps is only available on Windows".to_string())
    }
}
