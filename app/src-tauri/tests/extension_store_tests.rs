use std::{fs, path::PathBuf, time::{SystemTime, UNIX_EPOCH}};

use app_lib::storage::extension_store::ExtensionStore;

fn temp_root() -> PathBuf {
    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("profile-manager-extension-store-{unique}"))
}

#[test]
fn imports_directory_extension_and_lists_it() {
    let root = temp_root();
    let source = root.join("source-ext");
    fs::create_dir_all(&source).unwrap();
    fs::write(source.join("manifest.json"), "{}").unwrap();

    let store = ExtensionStore::new(root.join("managed"));
    let entry = store.import_directory("ublock", &source).unwrap();

    assert_eq!(entry.id, "ublock");
    assert_eq!(entry.kind, "dir");
    assert!(store.root().join("ublock").join("manifest.json").exists());
    assert_eq!(store.list().unwrap(), vec![entry]);

    fs::remove_dir_all(root).unwrap();
}

#[test]
fn imports_crx_file_and_lists_it() {
    let root = temp_root();
    fs::create_dir_all(&root).unwrap();
    let source = root.join("demo.crx");
    fs::write(&source, b"crx").unwrap();

    let store = ExtensionStore::new(root.join("managed"));
    let entry = store.import_crx("demo", &source).unwrap();

    assert_eq!(entry.id, "demo");
    assert_eq!(entry.kind, "crx");
    assert!(store.root().join("demo.crx").exists());
    assert_eq!(store.list().unwrap(), vec![entry]);

    fs::remove_dir_all(root).unwrap();
}
