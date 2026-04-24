pub mod commands;
pub mod domain;
pub mod state;
pub mod storage;
pub mod utils;

use std::{fs, sync::Mutex};

use utils::paths::project_root;

use commands::{
    bookmarks::BookmarksState, extensions::ExtensionsState, launcher::RuntimeStoreState, logs::LogsState,
    profiles::ProfilesState,
};
use storage::{
    bookmark_store::BookmarkStore, extension_store::ExtensionStore, log_store::LogStore,
    profile_repo::ProfileRepo,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let root = project_root();
    let profiles_root = root.join("data/profiles");
    let logs_root = root.join("data/logs");
    let extensions_root = root.join("data/extensions");
    let _ = fs::create_dir_all(&profiles_root);
    let _ = fs::create_dir_all(&logs_root);
    let _ = fs::create_dir_all(&extensions_root);

    tauri::Builder::default()
        .manage(ProfilesState(Mutex::new(ProfileRepo::new(profiles_root.clone()))))
        .manage(RuntimeStoreState(Mutex::new(Default::default())))
        .manage(LogsState(Mutex::new(LogStore::new(logs_root))))
        .manage(ExtensionsState(Mutex::new(ExtensionStore::new(extensions_root))))
        .manage(BookmarksState(Mutex::new(BookmarkStore::new(profiles_root))))
        .invoke_handler(tauri::generate_handler![
            commands::profiles::list_profiles,
            commands::profiles::create_profile,
            commands::profiles::update_profile,
            commands::profiles::delete_profile,
            commands::launcher::launch_profile,
            commands::launcher::stop_profile,
            commands::launcher::get_runtime_state,
            commands::logs::get_logs,
            commands::extensions::list_extensions,
            commands::extensions::import_extension_dir,
            commands::extensions::import_extension_crx,
            commands::bookmarks::get_bookmarks,
            commands::bookmarks::save_bookmarks,
            commands::bookmarks::get_quick_links,
            commands::bookmarks::save_quick_links,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
