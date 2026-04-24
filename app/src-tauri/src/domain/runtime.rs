use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum RuntimeStatus {
    Idle,
    Starting,
    Running,
    Stopped,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeState {
    pub profile_id: String,
    pub status: RuntimeStatus,
    pub pid: Option<u32>,
    pub exit_code: Option<i32>,
    pub last_command: Option<Vec<String>>,
    pub last_error: Option<String>,
    pub started_at: Option<String>,
    pub stopped_at: Option<String>,
}

impl RuntimeState {
    pub fn idle(profile_id: impl Into<String>) -> Self {
        Self {
            profile_id: profile_id.into(),
            status: RuntimeStatus::Idle,
            pid: None,
            exit_code: None,
            last_command: None,
            last_error: None,
            started_at: None,
            stopped_at: None,
        }
    }
}
