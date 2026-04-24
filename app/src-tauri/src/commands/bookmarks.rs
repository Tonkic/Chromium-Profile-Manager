use std::sync::Mutex;

use tauri::State;

use crate::storage::bookmark_store::{BookmarkEntry, BookmarkStore, QuickLink};

pub struct BookmarksState(pub Mutex<BookmarkStore>);

#[tauri::command]
pub fn get_bookmarks(
    profile_id: String,
    state: State<'_, BookmarksState>,
) -> Result<Vec<BookmarkEntry>, String> {
    state.0.lock().map_err(|err| err.to_string())?.read_bookmarks(&profile_id)
}

#[tauri::command]
pub fn save_bookmarks(
    profile_id: String,
    bookmarks: Vec<BookmarkEntry>,
    state: State<'_, BookmarksState>,
) -> Result<(), String> {
    state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .save_bookmarks(&profile_id, &bookmarks)
}

#[tauri::command]
pub fn get_quick_links(
    profile_id: String,
    state: State<'_, BookmarksState>,
) -> Result<Vec<QuickLink>, String> {
    state.0.lock().map_err(|err| err.to_string())?.read_quick_links(&profile_id)
}

#[tauri::command]
pub fn save_quick_links(
    profile_id: String,
    quick_links: Vec<QuickLink>,
    state: State<'_, BookmarksState>,
) -> Result<(), String> {
    state
        .0
        .lock()
        .map_err(|err| err.to_string())?
        .save_quick_links(&profile_id, &quick_links)
}
