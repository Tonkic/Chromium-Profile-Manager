use std::{fs::{self, OpenOptions}, io::{BufRead, BufReader, Write}, path::{Path, PathBuf}};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub timestamp: String,
    pub level: String,
    pub message: String,
    pub command: Option<Vec<String>>,
    pub exit_code: Option<i32>,
}

pub struct LogStore {
    root: PathBuf,
}

impl LogStore {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self { root: root.into() }
    }

    pub fn rename_profile(&self, old_profile_id: &str, new_profile_id: &str) -> Result<(), String> {
        if old_profile_id == new_profile_id {
            return Ok(());
        }

        fs::create_dir_all(&self.root).map_err(|err| err.to_string())?;
        let old_path = self.log_path(old_profile_id);
        let new_path = self.log_path(new_profile_id);

        if new_path.exists() {
            return Err("target profile log already exists".into());
        }
        if !old_path.exists() {
            return Ok(());
        }

        fs::rename(old_path, new_path).map_err(|err| err.to_string())
    }

    pub fn append(&self, profile_id: &str, entry: &LogEntry) -> Result<(), String> {
        fs::create_dir_all(&self.root).map_err(|err| err.to_string())?;
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(self.log_path(profile_id))
            .map_err(|err| err.to_string())?;

        let line = serde_json::to_string(entry).map_err(|err| err.to_string())?;
        writeln!(file, "{line}").map_err(|err| err.to_string())
    }

    pub fn read(&self, profile_id: &str) -> Result<Vec<LogEntry>, String> {
        let path = self.log_path(profile_id);
        if !path.exists() {
            return Ok(Vec::new());
        }

        let file = fs::File::open(path).map_err(|err| err.to_string())?;
        let reader = BufReader::new(file);

        reader
            .lines()
            .map(|line| {
                let line = line.map_err(|err| err.to_string())?;
                serde_json::from_str::<LogEntry>(&line).map_err(|err| err.to_string())
            })
            .collect()
    }

    fn log_path(&self, profile_id: &str) -> PathBuf {
        self.root.join(format!("{profile_id}.log"))
    }

    pub fn root(&self) -> &Path {
        &self.root
    }
}
