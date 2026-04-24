use std::{path::PathBuf, process::Command, sync::Mutex};

use tauri::State;

use crate::{
    commands::{logs::LogsState, profiles::ProfilesState},
    domain::{profile::Profile, runtime::RuntimeState},
    state::runtime_state::RuntimeStateStore,
    storage::log_store::LogEntry,
    utils::{
        command_builder::build_launch_spec,
        paths::{project_root, resolve_from_project_root},
    },
};

pub struct RuntimeStoreState(pub Mutex<RuntimeStateStore>);

fn extension_paths(profile: &Profile) -> Vec<String> {
    let root = project_root();
    profile
        .extensions
        .iter()
        .filter(|item| item.enabled)
        .map(|item| root.join("data/extensions").join(&item.id).to_string_lossy().to_string())
        .collect()
}

fn relative_to_project_root(path: &PathBuf) -> String {
    path.strip_prefix(project_root())
        .map(|value| value.to_string_lossy().replace('\\', "/"))
        .unwrap_or_else(|_| path.to_string_lossy().replace('\\', "/"))
}

fn resolved_profile(profile: &Profile) -> Profile {
    let mut resolved = profile.clone();
    let browser_path = resolve_from_project_root(&profile.browser_path);
    let user_data_dir = resolve_from_project_root(&profile.user_data_dir);
    resolved.browser_path = browser_path.to_string_lossy().to_string();
    resolved.user_data_dir = user_data_dir.to_string_lossy().to_string();
    resolved
}

#[tauri::command]
pub fn get_runtime_state(
    profile_id: String,
    state: State<'_, RuntimeStoreState>,
) -> Result<RuntimeState, String> {
    Ok(state.0.lock().map_err(|err| err.to_string())?.get(&profile_id))
}

#[tauri::command]
pub fn stop_profile(
    profile_id: String,
    state: State<'_, RuntimeStoreState>,
    logs_state: State<'_, LogsState>,
) -> Result<(), String> {
    let stopped_at = chrono::Utc::now().to_rfc3339();
    state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .mark_stopped(&profile_id, None, stopped_at.clone());
    logs_state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .append(
            &profile_id,
            &LogEntry {
                timestamp: stopped_at,
                level: "info".into(),
                message: "profile stopped".into(),
                command: None,
                exit_code: None,
            },
        )?;
    Ok(())
}

#[tauri::command]
pub fn launch_profile(
    profile_id: String,
    profiles_state: State<'_, ProfilesState>,
    runtime_state: State<'_, RuntimeStoreState>,
    logs_state: State<'_, LogsState>,
) -> Result<RuntimeState, String> {
    let profile = profiles_state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .get(&profile_id)?;

    let resolved_profile = resolved_profile(&profile);
    let browser_path = PathBuf::from(&resolved_profile.browser_path);
    let user_data_dir = PathBuf::from(&resolved_profile.user_data_dir);
    let spec = build_launch_spec(&resolved_profile, &extension_paths(&profile));
    let command_preview = std::iter::once(spec.program.clone())
        .chain(spec.args.clone())
        .collect::<Vec<_>>();
    let resolved_command_preview = vec![
        format!("resolved browser path: {}", relative_to_project_root(&browser_path)),
        format!("resolved user data dir: {}", relative_to_project_root(&user_data_dir)),
    ];

    runtime_state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .mark_starting(&profile_id, command_preview.clone())?;

    logs_state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .append(
            &profile_id,
            &LogEntry {
                timestamp: chrono::Utc::now().to_rfc3339(),
                level: "info".into(),
                message: "launch requested".into(),
                command: Some(
                    resolved_command_preview
                        .iter()
                        .cloned()
                        .chain(command_preview.clone())
                        .collect(),
                ),
                exit_code: None,
            },
        )?;

    let child = Command::new(&spec.program)
        .args(&spec.args)
        .spawn()
        .map_err(|err| {
            let error = err.to_string();
            let _ = runtime_state
                .0
                .lock()
                .map(|mut store| store.mark_error(&profile_id, error.clone()));
            let _ = logs_state.0.lock().map(|store| {
                let _ = store.append(
                    &profile_id,
                    &LogEntry {
                        timestamp: chrono::Utc::now().to_rfc3339(),
                        level: "error".into(),
                        message: error.clone(),
                        command: Some(
                            resolved_command_preview
                                .iter()
                                .cloned()
                                .chain(command_preview.clone())
                                .collect(),
                        ),
                        exit_code: None,
                    },
                );
            });
            error
        })?;

    let pid = child.id();
    let started_at = chrono::Utc::now().to_rfc3339();
    runtime_state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .mark_running(&profile_id, pid, started_at.clone());

    logs_state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .append(
            &profile_id,
            &LogEntry {
                timestamp: started_at,
                level: "info".into(),
                message: format!("profile running with pid {pid}"),
                command: Some(
                    resolved_command_preview
                        .into_iter()
                        .chain(command_preview)
                        .collect(),
                ),
                exit_code: None,
            },
        )?;

    Ok(runtime_state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .get(&profile_id))
}
