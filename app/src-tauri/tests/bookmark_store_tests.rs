use std::{fs, path::PathBuf, time::{SystemTime, UNIX_EPOCH}};

use app_lib::storage::bookmark_store::{BookmarkEntry, BookmarkStore, QuickLink};

fn temp_root() -> PathBuf {
    let unique = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("profile-manager-bookmark-store-{unique}"))
}

#[test]
fn saves_and_reads_bookmarks_and_quick_links() {
    let root = temp_root();
    let store = BookmarkStore::new(&root);

    store
        .save_bookmarks(
            "default-1",
            &vec![BookmarkEntry {
                title: "Anthropic".into(),
                url: "https://www.anthropic.com".into(),
            }],
        )
        .unwrap();

    store
        .save_quick_links(
            "default-1",
            &vec![QuickLink {
                title: "Docs".into(),
                url: "https://example.com/docs".into(),
            }],
        )
        .unwrap();

    let bookmarks = store.read_bookmarks("default-1").unwrap();
    let quick_links = store.read_quick_links("default-1").unwrap();

    assert_eq!(bookmarks.len(), 1);
    assert_eq!(bookmarks[0].title, "Anthropic");
    assert_eq!(quick_links.len(), 1);
    assert_eq!(quick_links[0].url, "https://example.com/docs");

    fs::remove_dir_all(root).unwrap();
}
