use app_lib::{domain::profile::{Profile, ProfileExtensionRef}, utils::command_builder::build_launch_spec};

fn sample_profile() -> Profile {
    Profile {
        id: "default-1".into(),
        name: "工作环境".into(),
        note: Some("note".into()),
        browser_path: "./runtime/ungoogled-chromium-146/ungoogled-chromium_146.0.7680.177-1.1_windows_x64/chrome.exe".into(),
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

#[test]
fn builds_expected_launch_command() {
    let profile = sample_profile();
    let spec = build_launch_spec(&profile, &["./data/extensions/uBlock".into()]);

    assert_eq!(spec.program, "./runtime/ungoogled-chromium-146/ungoogled-chromium_146.0.7680.177-1.1_windows_x64/chrome.exe");
    assert!(spec.args.contains(&"--user-data-dir=./data/profiles/default-1".into()));
    assert!(spec.args.contains(&"--proxy-server=http://127.0.0.1:7890".into()));
    assert!(spec.args.contains(&"--lang=zh-CN".into()));
    assert!(spec.args.contains(&"--window-size=1400,900".into()));
    assert!(spec.args.contains(&"--load-extension=./data/extensions/uBlock".into()));
    assert!(spec.args.contains(&"--start-maximized".into()));
}
