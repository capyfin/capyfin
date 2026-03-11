use serde::Serialize;
use tauri::State;

use crate::state::AppState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMetadata {
    product_name: String,
    workspace_layout: Vec<String>,
}

#[tauri::command]
pub fn app_metadata(state: State<'_, AppState>) -> AppMetadata {
    AppMetadata {
        product_name: state.product_name.clone(),
        workspace_layout: vec![
            "apps/desktop".to_string(),
            "docs".to_string(),
            "apps/desktop/src-tauri".to_string(),
        ],
    }
}
