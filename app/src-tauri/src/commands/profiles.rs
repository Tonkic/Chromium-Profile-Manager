use std::sync::Mutex;

use tauri::State;

use crate::{domain::profile::Profile, storage::profile_repo::ProfileRepo};

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
pub fn update_profile(profile: Profile, state: State<'_, ProfilesState>) -> Result<(), String> {
    state.0.lock().map_err(|err| err.to_string())?.save(&profile)
}

#[tauri::command]
pub fn delete_profile(id: String, state: State<'_, ProfilesState>) -> Result<(), String> {
    state.0.lock().map_err(|err| err.to_string())?.delete(&id)
}
