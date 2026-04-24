use std::{fs, time::{SystemTime, UNIX_EPOCH}};

use app_lib::{domain::profile::{Profile, ProfileExtensionRef}, storage::profile_repo::ProfileRepo};

fn sample_profile() -> Profile {
    Profile {
        id: "default-1".into(),
        name: "工作环境".into(),
        note: Some("note".into()),
        browser_path: "./runtime/fingerprint-chromium/chrome.exe".into(),
        user_data_dir: "./data/profiles/default-1".into(),
        proxy: Some("http://127.0.0.1:7890".into()),
        lang: Some("zh-CN".into()),
        timezone: Some("Asia/Shanghai".into()),
        window_size: Some((1400, 900)),
        extensions: vec![ProfileExtensionRef { id: "ext-1".into(), enabled: true }],
        extra_args: vec!["--start-maximized".into()],
        bookmark_set_id: None,
        created_at: "2026-04-10T00:00:00Z".into(),
        updated_at: "2026-04-10T00:00:00Z".into(),
    }
}

fn temp_dir() -> std::path::PathBuf {
    let suffix = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
    std::env::temp_dir().join(format!("profile-repo-test-{suffix}"))
}

#[test]
fn saves_gets_lists_and_deletes_profiles() {
    let root = temp_dir();
    let repo = ProfileRepo::new(&root);
    let profile = sample_profile();

    repo.save(&profile).unwrap();
    assert!(repo.profile_path("default-1").exists());

    let loaded = repo.get("default-1").unwrap();
    assert_eq!(loaded, profile);

    let list = repo.list().unwrap();
    assert_eq!(list.len(), 1);
    assert_eq!(list[0].id, "default-1");

    repo.delete("default-1").unwrap();
    assert!(!repo.root().join("default-1").exists());

    let _ = fs::remove_dir_all(root);
}
