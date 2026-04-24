use crate::domain::profile::Profile;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LaunchSpec {
    pub program: String,
    pub args: Vec<String>,
}

pub fn build_launch_spec(profile: &Profile, extension_paths: &[String]) -> LaunchSpec {
    let mut args = vec![format!("--user-data-dir={}", profile.user_data_dir)];

    if let Some(proxy) = &profile.proxy {
        if !proxy.is_empty() {
            args.push(format!("--proxy-server={proxy}"));
        }
    }

    if let Some(lang) = &profile.lang {
        if !lang.is_empty() {
            args.push(format!("--lang={lang}"));
        }
    }

    if let Some((width, height)) = profile.window_size {
        args.push(format!("--window-size={width},{height}"));
    }

    let enabled_extensions = extension_paths
        .iter()
        .filter(|path| !path.is_empty())
        .cloned()
        .collect::<Vec<_>>();

    if !enabled_extensions.is_empty() {
        args.push(format!("--load-extension={}", enabled_extensions.join(",")));
    }

    args.extend(profile.extra_args.clone());

    LaunchSpec {
        program: profile.browser_path.clone(),
        args,
    }
}
