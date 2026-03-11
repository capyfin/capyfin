pub struct AppState {
    pub product_name: String,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            product_name: "CapyFin".to_string(),
        }
    }
}
