use serde::{Deserialize, Serialize};

use crate::manifest::AppMetadata;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
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
            areas: AppMetadata::current().workspace_layout,
        }
    }

    pub fn areas(&self) -> &[WorkspaceArea] {
        &self.areas
    }
}
