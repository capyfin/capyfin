export interface WorkspaceArea {
  path: string;
  responsibility: string;
}

export interface AppMetadata {
  productName: string;
  workspaceLayout: WorkspaceArea[];
}
