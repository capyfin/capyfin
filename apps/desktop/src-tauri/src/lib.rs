mod commands;
mod state;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(state::AppState::default())
        .invoke_handler(tauri::generate_handler![commands::app::app_metadata])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
