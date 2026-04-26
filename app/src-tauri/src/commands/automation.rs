use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
    sync::Mutex,
};

use tauri::State;

use crate::{
    commands::profiles::ProfilesState,
    domain::automation::{AutomationRuntimeState, AutomationScriptEntry},
    state::automation_state::AutomationStateStore,
    utils::paths::{automation_scripts_dir, project_root},
};

pub struct AutomationState(pub Mutex<AutomationStateStore>);

#[tauri::command]
pub fn list_automation_scripts() -> Result<Vec<AutomationScriptEntry>, String> {
    let root = automation_scripts_dir();
    if !root.exists() {
        fs::create_dir_all(&root).map_err(|err| err.to_string())?;
    }

    let mut entries = fs::read_dir(&root)
        .map_err(|err| err.to_string())?
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.is_file())
        .filter(|path| {
            path.extension()
                .map(|ext| ext.to_string_lossy().to_ascii_lowercase() == "py")
                .unwrap_or(false)
        })
        .filter_map(|path| to_script_entry(&root, &path).ok())
        .collect::<Vec<_>>();

    entries.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(entries)
}

#[tauri::command]
pub fn get_automation_runtime_states(
    profile_id: String,
    state: State<'_, AutomationState>,
) -> Result<Vec<AutomationRuntimeState>, String> {
    Ok(state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .get_for_profile(&profile_id))
}

#[tauri::command]
pub fn start_automation_script(
    profile_id: String,
    script_name: String,
    profiles_state: State<'_, ProfilesState>,
    state: State<'_, AutomationState>,
) -> Result<AutomationRuntimeState, String> {
    profiles_state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .get(&profile_id)?;

    validate_script_name(&script_name)?;
    let script_path = resolve_script_path(&script_name)?;

    let mut guard = state.0.lock().map_err(|err| err.to_string())?;
    guard.mark_starting(&profile_id, &script_name)?;

    let child = Command::new("python")
        .arg(script_path)
        .current_dir(project_root())
        .spawn()
        .map_err(|err| {
            let error = err.to_string();
            guard.mark_error(&profile_id, &script_name, error.clone());
            error
        })?;

    guard.mark_running(&profile_id, &script_name, child);
    Ok(guard.get(&profile_id, &script_name))
}

#[tauri::command]
pub fn stop_automation_script(
    profile_id: String,
    script_name: String,
    state: State<'_, AutomationState>,
) -> Result<AutomationRuntimeState, String> {
    validate_script_name(&script_name)?;
    Ok(state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .stop(&profile_id, &script_name))
}

#[tauri::command]
pub fn open_automation_scripts_dir() -> Result<String, String> {
    let dir = automation_scripts_dir();
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&dir)
            .spawn()
            .map_err(|err| err.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&dir)
            .spawn()
            .map_err(|err| err.to_string())?;
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        Command::new("xdg-open")
            .arg(&dir)
            .spawn()
            .map_err(|err| err.to_string())?;
    }

    Ok(dir.to_string_lossy().to_string())
}

fn validate_script_name(script_name: &str) -> Result<(), String> {
    if script_name.trim().is_empty() {
        return Err("script name is required".into());
    }
    if script_name.contains('/') || script_name.contains('\\') || script_name.contains("..") {
        return Err("invalid script name".into());
    }
    if !script_name.to_ascii_lowercase().ends_with(".py") {
        return Err("only .py scripts are allowed".into());
    }
    Ok(())
}

fn resolve_script_path(script_name: &str) -> Result<PathBuf, String> {
    let root = automation_scripts_dir();
    if !root.exists() {
        fs::create_dir_all(&root).map_err(|err| err.to_string())?;
    }
    let candidate = root.join(script_name);
    if !candidate.exists() || !candidate.is_file() {
        return Err("script file not found".into());
    }

    let root_canonical = root.canonicalize().map_err(|err| err.to_string())?;
    let candidate_canonical = candidate.canonicalize().map_err(|err| err.to_string())?;
    if !candidate_canonical.starts_with(&root_canonical) {
        return Err("script path is outside automation directory".into());
    }

    Ok(candidate_canonical)
}

fn to_script_entry(root: &Path, path: &Path) -> Result<AutomationScriptEntry, String> {
    let name = path
        .file_name()
        .ok_or_else(|| "invalid script file name".to_string())?
        .to_string_lossy()
        .to_string();
    let relative_path = path
        .strip_prefix(root)
        .map_err(|err| err.to_string())?
        .to_string_lossy()
        .replace('\\', "/");

    Ok(AutomationScriptEntry {
        name,
        relative_path,
        absolute_path: path.to_string_lossy().to_string(),
    })
}
