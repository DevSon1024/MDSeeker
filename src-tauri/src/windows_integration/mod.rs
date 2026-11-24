pub mod args;
pub mod queue;
pub mod registry;

pub use args::process_incoming_args;
pub use queue::IncomingFileQueue;
pub use registry::{
    ensure_windows_default_app_registered, is_windows_default_app_registered,
    open_windows_default_apps_settings, register_windows_default_app,
};
