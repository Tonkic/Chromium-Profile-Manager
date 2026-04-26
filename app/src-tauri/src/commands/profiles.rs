use std::sync::Mutex;

use tauri::State;

use crate::{
    commands::{automation::AutomationState, launcher::RuntimeStoreState, logs::LogsState},
    domain::profile::Profile,
    storage::profile_repo::ProfileRepo,
};

pub struct ProfilesState(pub Mutex<ProfileRepo>);

#[tauri::command]
pub fn list_profiles(state: State<'_, ProfilesState>) -> Result<Vec<Profile>, String> {
    state.0.lock().map_err(|err| err.to_string())?.list()
}

#[tauri::command]
pub fn create_profile(profile: Profile, state: State<'_, ProfilesState>) -> Result<(), String> {
    state.0.lock().map_err(|err| err.to_string())?.save(&profile)
}

#[tauri::command]
pub fn update_profile(
    original_id: String,
    profile: Profile,
    state: State<'_, ProfilesState>,
    logs_state: State<'_, LogsState>,
    runtime_state: State<'_, RuntimeStoreState>,
    automation_state: State<'_, AutomationState>,
) -> Result<(), String> {
    let should_rename = original_id != profile.id;
    let new_id = profile.id.clone();

    state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .save_with_original_id(&original_id, &profile)?;

    if should_rename {
        logs_state
            .0
            .lock()
            .map_err(|err| err.to_string())?
            .rename_profile(&original_id, &new_id)?;
        runtime_state
            .0
            .lock()
            .map_err(|err| err.to_string())?
            .rename_profile(&original_id, &new_id);
        automation_state
            .0
            .lock()
            .map_err(|err| err.to_string())?
            .rename_profile(&original_id, &new_id);
    }

    Ok(())
}

#[tauri::command]
pub fn delete_profile(id: String, state: State<'_, ProfilesState>) -> Result<(), String> {
    state.0.lock().map_err(|err| err.to_string())?.delete(&id)
}
