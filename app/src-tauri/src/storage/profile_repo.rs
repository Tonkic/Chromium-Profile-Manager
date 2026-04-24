use std::{fs, path::{Path, PathBuf}};

use crate::domain::profile::Profile;

pub struct ProfileRepo {
    root: PathBuf,
}

impl ProfileRepo {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self { root: root.into() }
    }

    pub fn save(&self, profile: &Profile) -> Result<(), String> {
        let dir = self.root.join(&profile.id);
        fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
        let path = dir.join("profile.json");
        let content = serde_json::to_string_pretty(profile).map_err(|err| err.to_string())?;
        fs::write(path, content).map_err(|err| err.to_string())
    }

    pub fn get(&self, id: &str) -> Result<Profile, String> {
        let path = self.profile_path(id);
        let content = fs::read_to_string(path).map_err(|err| err.to_string())?;
        serde_json::from_str(&content).map_err(|err| err.to_string())
    }

    pub fn list(&self) -> Result<Vec<Profile>, String> {
        if !self.root.exists() {
            return Ok(vec![]);
        }

        let mut profiles = vec![];
        for entry in fs::read_dir(&self.root).map_err(|err| err.to_string())? {
            let entry = entry.map_err(|err| err.to_string())?;
            if entry.file_type().map_err(|err| err.to_string())?.is_dir() {
                let path = entry.path().join("profile.json");
                if path.exists() {
                    let content = fs::read_to_string(path).map_err(|err| err.to_string())?;
                    let profile = serde_json::from_str::<Profile>(&content)
                        .map_err(|err| err.to_string())?;
                    profiles.push(profile);
                }
            }
        }
        profiles.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(profiles)
    }

    pub fn delete(&self, id: &str) -> Result<(), String> {
        let dir = self.root.join(id);
        if dir.exists() {
            fs::remove_dir_all(dir).map_err(|err| err.to_string())?;
        }
        Ok(())
    }

    pub fn profile_path(&self, id: &str) -> PathBuf {
        self.root.join(id).join("profile.json")
    }

    pub fn root(&self) -> &Path {
        &self.root
    }
}
