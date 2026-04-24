use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ProfileExtensionRef {
    pub id: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub note: Option<String>,
    pub browser_path: String,
    pub user_data_dir: String,
    pub proxy: Option<String>,
    pub lang: Option<String>,
    pub timezone: Option<String>,
    pub window_size: Option<(u32, u32)>,
    pub extensions: Vec<ProfileExtensionRef>,
    pub extra_args: Vec<String>,
    pub bookmark_set_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
