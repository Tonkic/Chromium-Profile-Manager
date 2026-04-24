use std::collections::HashMap;

use crate::domain::runtime::{RuntimeState, RuntimeStatus};

#[derive(Default)]
pub struct RuntimeStateStore {
    states: HashMap<String, RuntimeState>,
}

impl RuntimeStateStore {
    pub fn get(&self, profile_id: &str) -> RuntimeState {
        self.states
            .get(profile_id)
            .cloned()
            .unwrap_or_else(|| RuntimeState::idle(profile_id))
    }

    pub fn mark_starting(&mut self, profile_id: &str, command: Vec<String>) -> Result<(), String> {
        let current = self.get(profile_id);
        if current.status == RuntimeStatus::Running || current.status == RuntimeStatus::Starting {
            return Err("profile is already running".into());
        }
        self.states.insert(
            profile_id.into(),
            RuntimeState {
                profile_id: profile_id.into(),
                status: RuntimeStatus::Starting,
                pid: None,
                exit_code: None,
                last_command: Some(command),
                last_error: None,
                started_at: None,
                stopped_at: None,
            },
        );
        Ok(())
    }

    pub fn mark_running(&mut self, profile_id: &str, pid: u32, started_at: String) {
        let mut state = self.get(profile_id);
        state.status = RuntimeStatus::Running;
        state.pid = Some(pid);
        state.started_at = Some(started_at);
        state.exit_code = None;
        state.last_error = None;
        self.states.insert(profile_id.into(), state);
    }

    pub fn mark_stopped(&mut self, profile_id: &str, exit_code: Option<i32>, stopped_at: String) {
        let mut state = self.get(profile_id);
        state.status = RuntimeStatus::Stopped;
        state.pid = None;
        state.exit_code = exit_code;
        state.stopped_at = Some(stopped_at);
        self.states.insert(profile_id.into(), state);
    }

    pub fn mark_error(&mut self, profile_id: &str, error: String) {
        let mut state = self.get(profile_id);
        state.status = RuntimeStatus::Error;
        state.pid = None;
        state.last_error = Some(error);
        self.states.insert(profile_id.into(), state);
    }
}
