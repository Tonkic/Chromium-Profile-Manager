use std::{fs, path::PathBuf, time::{SystemTime, UNIX_EPOCH}};

use app_lib::storage::log_store::{LogEntry, LogStore};

fn temp_root() -> PathBuf {
    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("profile-manager-log-store-{unique}"))
}

#[test]
fn appends_and_reads_log_entries() {
    let root = temp_root();
    let store = LogStore::new(&root);

    store
        .append(
            "default-1",
            &LogEntry {
                timestamp: "2026-04-10T00:00:00Z".into(),
                level: "info".into(),
                message: "launch started".into(),
                command: Some(vec!["chrome.exe".into(), "--user-data-dir=./data/profiles/default-1".into()]),
                exit_code: None,
            },
        )
        .unwrap();

    store
        .append(
            "default-1",
            &LogEntry {
                timestamp: "2026-04-10T00:00:01Z".into(),
                level: "error".into(),
                message: "spawn failed".into(),
                command: None,
                exit_code: Some(1),
            },
        )
        .unwrap();

    let entries = store.read("default-1").unwrap();
    assert_eq!(entries.len(), 2);
    assert_eq!(entries[0].message, "launch started");
    assert_eq!(entries[0].command.as_ref().unwrap()[0], "chrome.exe");
    assert_eq!(entries[1].level, "error");
    assert_eq!(entries[1].exit_code, Some(1));

    fs::remove_dir_all(root).unwrap();
}

#[test]
fn renames_profile_log_file() {
    let root = temp_root();
    let store = LogStore::new(&root);

    store
        .append(
            "default-1",
            &LogEntry {
                timestamp: "2026-04-10T00:00:00Z".into(),
                level: "info".into(),
                message: "launch started".into(),
                command: None,
                exit_code: None,
            },
        )
        .unwrap();

    store.rename_profile("default-1", "default-2").unwrap();

    assert_eq!(store.read("default-1").unwrap().len(), 0);
    assert_eq!(store.read("default-2").unwrap().len(), 1);

    fs::remove_dir_all(root).unwrap();
}
