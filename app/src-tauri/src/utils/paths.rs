use std::{env, path::{Path, PathBuf}};

pub fn project_root() -> PathBuf {
    let cwd = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    if cwd.ends_with(Path::new(r"app\src-tauri")) || cwd.ends_with(Path::new("app/src-tauri")) {
        cwd.parent()
            .and_then(|p| p.parent())
            .map(Path::to_path_buf)
            .unwrap_or(cwd)
    } else if cwd.ends_with(Path::new("app")) {
        cwd.parent().map(Path::to_path_buf).unwrap_or(cwd)
    } else {
        cwd
    }
}

pub fn resolve_from_project_root(value: &str) -> PathBuf {
    let path = PathBuf::from(value);
    if path.is_absolute() {
        path
    } else {
        project_root().join(path)
    }
}
