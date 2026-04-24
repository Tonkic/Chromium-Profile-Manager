use std::{fs, path::{Path, PathBuf}};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionEntry {
    pub id: String,
    pub kind: String,
    pub path: String,
}

pub struct ExtensionStore {
    root: PathBuf,
}

impl ExtensionStore {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self { root: root.into() }
    }

    pub fn import_directory(&self, id: &str, source: &Path) -> Result<ExtensionEntry, String> {
        fs::create_dir_all(&self.root).map_err(|err| err.to_string())?;
        let target = self.root.join(id);
        if target.exists() {
            fs::remove_dir_all(&target).map_err(|err| err.to_string())?;
        }
        copy_dir_all(source, &target)?;
        Ok(ExtensionEntry {
            id: id.into(),
            kind: "dir".into(),
            path: target.to_string_lossy().to_string(),
        })
    }

    pub fn import_crx(&self, id: &str, source: &Path) -> Result<ExtensionEntry, String> {
        fs::create_dir_all(&self.root).map_err(|err| err.to_string())?;
        let target = self.root.join(format!("{id}.crx"));
        fs::copy(source, &target).map_err(|err| err.to_string())?;
        Ok(ExtensionEntry {
            id: id.into(),
            kind: "crx".into(),
            path: target.to_string_lossy().to_string(),
        })
    }

    pub fn list(&self) -> Result<Vec<ExtensionEntry>, String> {
        if !self.root.exists() {
            return Ok(Vec::new());
        }

        let mut items = Vec::new();
        for entry in fs::read_dir(&self.root).map_err(|err| err.to_string())? {
            let entry = entry.map_err(|err| err.to_string())?;
            let path = entry.path();
            let file_name = entry.file_name().to_string_lossy().to_string();
            if path.is_dir() {
                items.push(ExtensionEntry {
                    id: file_name,
                    kind: "dir".into(),
                    path: path.to_string_lossy().to_string(),
                });
            } else if path.extension().is_some_and(|ext| ext == "crx") {
                items.push(ExtensionEntry {
                    id: file_name.trim_end_matches(".crx").into(),
                    kind: "crx".into(),
                    path: path.to_string_lossy().to_string(),
                });
            }
        }
        items.sort_by(|a, b| a.id.cmp(&b.id));
        Ok(items)
    }

    pub fn root(&self) -> &Path {
        &self.root
    }
}

fn copy_dir_all(source: &Path, target: &Path) -> Result<(), String> {
    fs::create_dir_all(target).map_err(|err| err.to_string())?;
    for entry in fs::read_dir(source).map_err(|err| err.to_string())? {
        let entry = entry.map_err(|err| err.to_string())?;
        let path = entry.path();
        let destination = target.join(entry.file_name());
        if path.is_dir() {
            copy_dir_all(&path, &destination)?;
        } else {
            fs::copy(&path, &destination).map_err(|err| err.to_string())?;
        }
    }
    Ok(())
}
