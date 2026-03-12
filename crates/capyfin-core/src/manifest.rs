use serde::{Deserialize, Serialize};

use crate::workspace::WorkspaceArea;

const APP_MANIFEST_JSON: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../config/app-manifest.json"
));

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AppMetadata {
    pub product_name: String,
    pub workspace_layout: Vec<WorkspaceArea>,
}

impl AppMetadata {
    pub fn current() -> Self {
        serde_json::from_str(APP_MANIFEST_JSON)
            .expect("app manifest should be valid JSON and match the expected schema")
    }
}
