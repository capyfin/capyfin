use serde::Serialize;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceArea {
    pub path: String,
    pub responsibility: String,
}

#[derive(Debug, Clone)]
pub struct WorkspaceCatalog {
    areas: Vec<WorkspaceArea>,
}

impl WorkspaceCatalog {
    pub fn current() -> Self {
        Self {
            areas: vec![
                WorkspaceArea {
                    path: "apps/desktop".to_string(),
                    responsibility: "Desktop frontend and product surface".to_string(),
                },
                WorkspaceArea {
                    path: "apps/desktop/src-tauri".to_string(),
                    responsibility: "Tauri runtime, commands, and desktop integration".to_string(),
                },
                WorkspaceArea {
                    path: "crates/capyfin-core".to_string(),
                    responsibility: "Shared application services and cross-surface contracts"
                        .to_string(),
                },
                WorkspaceArea {
                    path: "crates/capyfin-cli".to_string(),
                    responsibility: "Operational command line interface built on shared core"
                        .to_string(),
                },
                WorkspaceArea {
                    path: "docs".to_string(),
                    responsibility: "Architecture notes and repository conventions".to_string(),
                },
            ],
        }
    }

    pub fn areas(&self) -> &[WorkspaceArea] {
        &self.areas
    }
}
