use std::{fs, path::{Path, PathBuf}};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct BookmarkEntry {
    pub title: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct QuickLink {
    pub title: String,
    pub url: String,
}

pub struct BookmarkStore {
    root: PathBuf,
}

impl BookmarkStore {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self { root: root.into() }
    }

    pub fn save_bookmarks(&self, profile_id: &str, bookmarks: &[BookmarkEntry]) -> Result<(), String> {
        let path = self.bookmarks_path(profile_id);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|err| err.to_string())?;
        }
        let content = serde_json::to_string_pretty(bookmarks).map_err(|err| err.to_string())?;
        fs::write(path, content).map_err(|err| err.to_string())
    }

    pub fn read_bookmarks(&self, profile_id: &str) -> Result<Vec<BookmarkEntry>, String> {
        let path = self.bookmarks_path(profile_id);
        if !path.exists() {
            return Ok(Vec::new());
        }
        let content = fs::read_to_string(path).map_err(|err| err.to_string())?;
        serde_json::from_str(&content).map_err(|err| err.to_string())
    }

    pub fn save_quick_links(&self, profile_id: &str, quick_links: &[QuickLink]) -> Result<(), String> {
        let path = self.quick_links_path(profile_id);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|err| err.to_string())?;
        }
        let content = serde_json::to_string_pretty(quick_links).map_err(|err| err.to_string())?;
        fs::write(path, content).map_err(|err| err.to_string())
    }

    pub fn read_quick_links(&self, profile_id: &str) -> Result<Vec<QuickLink>, String> {
        let path = self.quick_links_path(profile_id);
        if !path.exists() {
            return Ok(Vec::new());
        }
        let content = fs::read_to_string(path).map_err(|err| err.to_string())?;
        serde_json::from_str(&content).map_err(|err| err.to_string())
    }

    fn profile_dir(&self, profile_id: &str) -> PathBuf {
        self.root.join(profile_id)
    }

    fn bookmarks_path(&self, profile_id: &str) -> PathBuf {
        self.profile_dir(profile_id).join("bookmarks.json")
    }

    fn quick_links_path(&self, profile_id: &str) -> PathBuf {
        self.profile_dir(profile_id).join("quick-links.json")
    }

    pub fn root(&self) -> &Path {
        &self.root
    }
}
