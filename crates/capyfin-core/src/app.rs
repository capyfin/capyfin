use crate::manifest::AppMetadata;

#[derive(Debug, Clone)]
pub struct AppCore {
    metadata: AppMetadata,
}

impl AppCore {
    pub fn for_current_workspace() -> Self {
        Self {
            metadata: AppMetadata::current(),
        }
    }

    pub fn app_metadata(&self) -> AppMetadata {
        self.metadata.clone()
    }
}

impl Default for AppCore {
    fn default() -> Self {
        Self::for_current_workspace()
    }
}

#[cfg(test)]
mod tests {
    use super::AppCore;

    #[test]
    fn default_metadata_contains_shared_core_and_cli() {
        let metadata = AppCore::default().app_metadata();

        assert_eq!(metadata.product_name, "CapyFin");
        assert!(
            metadata
                .workspace_layout
                .iter()
                .any(|area| area.path == "packages/contracts")
        );
        assert!(
            metadata
                .workspace_layout
                .iter()
                .any(|area| area.path == "packages/sidecar")
        );
        assert!(
            metadata
                .workspace_layout
                .iter()
                .any(|area| area.path == "crates/capyfin-core")
        );
        assert!(
            metadata
                .workspace_layout
                .iter()
                .any(|area| area.path == "crates/capyfin-cli")
        );
    }
}
