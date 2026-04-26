use app_lib::{domain::runtime::RuntimeStatus, state::runtime_state::RuntimeStateStore};

#[test]
fn transitions_runtime_state_across_lifecycle() {
    let mut store = RuntimeStateStore::default();

    let idle = store.get("default-1");
    assert_eq!(idle.status, RuntimeStatus::Idle);

    store.mark_starting("default-1", vec!["chrome.exe".into()]).unwrap();
    assert_eq!(store.get("default-1").status, RuntimeStatus::Starting);

    store.mark_running("default-1", 1234, "2026-04-10T00:00:00Z".into());
    let running = store.get("default-1");
    assert_eq!(running.status, RuntimeStatus::Running);
    assert_eq!(running.pid, Some(1234));

    store.mark_stopped("default-1", Some(0), "2026-04-10T00:10:00Z".into());
    let stopped = store.get("default-1");
    assert_eq!(stopped.status, RuntimeStatus::Stopped);
    assert_eq!(stopped.exit_code, Some(0));
}

#[test]
fn rejects_duplicate_start_when_running_or_starting() {
    let mut store = RuntimeStateStore::default();
    store.mark_starting("default-1", vec!["chrome.exe".into()]).unwrap();
    assert!(store.mark_starting("default-1", vec!["chrome.exe".into()]).is_err());
}

#[test]
fn migrates_runtime_state_on_profile_rename() {
    let mut store = RuntimeStateStore::default();
    store.mark_running("default-1", 4242, "2026-04-10T00:00:00Z".into());

    store.rename_profile("default-1", "default-2");

    let migrated = store.get("default-2");
    assert_eq!(migrated.profile_id, "default-2");
    assert_eq!(migrated.pid, Some(4242));
    assert_eq!(store.get("default-1").status, RuntimeStatus::Idle);
}
