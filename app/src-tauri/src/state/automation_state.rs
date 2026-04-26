use std::{
    collections::HashMap,
    process::{Child, ExitStatus},
};

use crate::domain::automation::{AutomationRuntimeState, AutomationStatus};

#[derive(Default)]
pub struct AutomationStateStore {
    states: HashMap<String, AutomationRuntimeState>,
    processes: HashMap<String, Child>,
}

impl AutomationStateStore {
    fn key(profile_id: &str, script_name: &str) -> String {
        format!("{profile_id}::{script_name}")
    }

    pub fn reconcile(&mut self) {
        let mut finished = Vec::new();
        for (key, child) in self.processes.iter_mut() {
            if let Ok(Some(status)) = child.try_wait() {
                finished.push((key.clone(), status));
            }
        }

        for (key, status) in finished {
            self.processes.remove(&key);
            if let Some(state) = self.states.get_mut(&key) {
                state.status = AutomationStatus::Stopped;
                state.pid = None;
                state.exit_code = exit_code(status);
                state.stopped_at = Some(chrono::Utc::now().to_rfc3339());
            }
        }
    }

    pub fn get_for_profile(&mut self, profile_id: &str) -> Vec<AutomationRuntimeState> {
        self.reconcile();
        self.states
            .values()
            .filter(|item| item.profile_id == profile_id)
            .cloned()
            .collect()
    }

    pub fn get(&mut self, profile_id: &str, script_name: &str) -> AutomationRuntimeState {
        self.reconcile();
        self.states
            .get(&Self::key(profile_id, script_name))
            .cloned()
            .unwrap_or_else(|| AutomationRuntimeState::idle(profile_id, script_name))
    }

    pub fn mark_starting(&mut self, profile_id: &str, script_name: &str) -> Result<(), String> {
        self.reconcile();
        let key = Self::key(profile_id, script_name);
        if self.processes.contains_key(&key) {
            return Err("script is already running".into());
        }
        self.states.insert(
            key,
            AutomationRuntimeState {
                profile_id: profile_id.into(),
                script_name: script_name.into(),
                status: AutomationStatus::Starting,
                pid: None,
                exit_code: None,
                last_error: None,
                started_at: None,
                stopped_at: None,
                runner: "python".into(),
            },
        );
        Ok(())
    }

    pub fn mark_running(&mut self, profile_id: &str, script_name: &str, child: Child) {
        let key = Self::key(profile_id, script_name);
        let pid = child.id();
        self.processes.insert(key.clone(), child);
        self.states.insert(
            key,
            AutomationRuntimeState {
                profile_id: profile_id.into(),
                script_name: script_name.into(),
                status: AutomationStatus::Running,
                pid: Some(pid),
                exit_code: None,
                last_error: None,
                started_at: Some(chrono::Utc::now().to_rfc3339()),
                stopped_at: None,
                runner: "python".into(),
            },
        );
    }

    pub fn mark_error(&mut self, profile_id: &str, script_name: &str, error: String) {
        self.processes.remove(&Self::key(profile_id, script_name));
        self.states.insert(
            Self::key(profile_id, script_name),
            AutomationRuntimeState {
                profile_id: profile_id.into(),
                script_name: script_name.into(),
                status: AutomationStatus::Error,
                pid: None,
                exit_code: None,
                last_error: Some(error),
                started_at: None,
                stopped_at: Some(chrono::Utc::now().to_rfc3339()),
                runner: "python".into(),
            },
        );
    }

    pub fn stop(&mut self, profile_id: &str, script_name: &str) -> AutomationRuntimeState {
        self.reconcile();
        let key = Self::key(profile_id, script_name);
        let mut state = self
            .states
            .get(&key)
            .cloned()
            .unwrap_or_else(|| AutomationRuntimeState::idle(profile_id, script_name));

        if let Some(mut child) = self.processes.remove(&key) {
            let _ = child.kill();
            let exit_code = child.wait().ok().and_then(exit_code);
            state.status = AutomationStatus::Stopped;
            state.pid = None;
            state.exit_code = exit_code;
            state.last_error = None;
            state.stopped_at = Some(chrono::Utc::now().to_rfc3339());
            self.states.insert(key, state.clone());
            return state;
        }

        state.status = AutomationStatus::Stopped;
        state.pid = None;
        state.stopped_at = Some(chrono::Utc::now().to_rfc3339());
        self.states.insert(key, state.clone());
        state
    }

    pub fn rename_profile(&mut self, old_profile_id: &str, new_profile_id: &str) {
        if old_profile_id == new_profile_id {
            return;
        }
        self.reconcile();

        let mut migrated_states = Vec::new();
        let mut removed_state_keys = Vec::new();
        for (key, state) in &self.states {
            if state.profile_id == old_profile_id {
                migrated_states.push((
                    Self::key(new_profile_id, &state.script_name),
                    AutomationRuntimeState {
                        profile_id: new_profile_id.into(),
                        script_name: state.script_name.clone(),
                        status: state.status.clone(),
                        pid: state.pid,
                        exit_code: state.exit_code,
                        last_error: state.last_error.clone(),
                        started_at: state.started_at.clone(),
                        stopped_at: state.stopped_at.clone(),
                        runner: state.runner.clone(),
                    },
                ));
                removed_state_keys.push(key.clone());
            }
        }

        for key in removed_state_keys {
            self.states.remove(&key);
        }
        for (new_key, state) in migrated_states {
            self.states.insert(new_key, state);
        }

        let mut migrated_processes = Vec::new();
        let mut removed_process_keys = Vec::new();
        for key in self.processes.keys() {
            if let Some((profile_id, script_name)) = key.split_once("::") {
                if profile_id == old_profile_id {
                    let new_key = Self::key(new_profile_id, script_name);
                    removed_process_keys.push(key.clone());
                    migrated_processes.push((key.clone(), new_key));
                }
            }
        }

        for key in removed_process_keys {
            if let Some(child) = self.processes.remove(&key) {
                if let Some((_, new_key)) = migrated_processes.iter().find(|(old, _)| old == &key) {
                    self.processes.insert(new_key.clone(), child);
                }
            }
        }
    }
}

fn exit_code(status: ExitStatus) -> Option<i32> {
    status.code()
}
