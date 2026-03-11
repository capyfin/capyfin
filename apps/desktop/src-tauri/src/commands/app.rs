use capyfin_core::AppMetadata;
use tauri::State;

use crate::state::AppState;

#[tauri::command]
pub fn app_metadata(state: State<'_, AppState>) -> AppMetadata {
    state.core.app_metadata()
}
