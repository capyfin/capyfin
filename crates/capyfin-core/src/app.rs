use serde::Serialize;

use crate::workspace::{WorkspaceArea, WorkspaceCatalog};

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AppMetadata {
    pub product_name: String,
    pub workspace_layout: Vec<WorkspaceArea>,
}

#[derive(Debug, Clone)]
pub struct AppCore {
    product_name: String,
    workspace_catalog: WorkspaceCatalog,
}

impl AppCore {
    pub fn for_current_workspace() -> Self {
        Self {
            product_name: "CapyFin".to_string(),
            workspace_catalog: WorkspaceCatalog::current(),
        }
    }

    pub fn app_metadata(&self) -> AppMetadata {
        AppMetadata {
            product_name: self.product_name.clone(),
            workspace_layout: self.workspace_catalog.areas().to_vec(),
        }
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
