use std::{path::PathBuf, sync::Mutex};

use tauri::State;

use crate::storage::extension_store::{ExtensionEntry, ExtensionStore};

pub struct ExtensionsState(pub Mutex<ExtensionStore>);

#[tauri::command]
pub fn list_extensions(state: State<'_, ExtensionsState>) -> Result<Vec<ExtensionEntry>, String> {
    state.0.lock().map_err(|err| err.to_string())?.list()
}

#[tauri::command]
pub fn import_extension_dir(
    id: String,
    source_path: String,
    state: State<'_, ExtensionsState>,
) -> Result<ExtensionEntry, String> {
    state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .import_directory(&id, &PathBuf::from(source_path))
}

#[tauri::command]
pub fn import_extension_crx(
    id: String,
    source_path: String,
    state: State<'_, ExtensionsState>,
) -> Result<ExtensionEntry, String> {
    state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .import_crx(&id, &PathBuf::from(source_path))
}
