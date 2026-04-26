use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum AutomationStatus {
    Idle,
    Starting,
    Running,
    Stopped,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AutomationScriptEntry {
    pub name: String,
    pub relative_path: String,
    pub absolute_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AutomationRuntimeState {
    pub profile_id: String,
    pub script_name: String,
    pub status: AutomationStatus,
    pub pid: Option<u32>,
    pub exit_code: Option<i32>,
    pub last_error: Option<String>,
    pub started_at: Option<String>,
    pub stopped_at: Option<String>,
    pub runner: String,
}

impl AutomationRuntimeState {
    pub fn idle(profile_id: impl Into<String>, script_name: impl Into<String>) -> Self {
        Self {
            profile_id: profile_id.into(),
            script_name: script_name.into(),
            status: AutomationStatus::Idle,
            pid: None,
            exit_code: None,
            last_error: None,
            started_at: None,
            stopped_at: None,
            runner: "python".into(),
        }
    }
}
