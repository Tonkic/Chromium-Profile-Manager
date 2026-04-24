use std::sync::Mutex;

use tauri::State;

use crate::storage::log_store::{LogEntry, LogStore};

pub struct LogsState(pub Mutex<LogStore>);

#[tauri::command]
pub fn get_logs(profile_id: String, state: State<'_, LogsState>) -> Result<Vec<LogEntry>, String> {
    state.0.lock().map_err(|err| err.to_string())?.read(&profile_id)
}
