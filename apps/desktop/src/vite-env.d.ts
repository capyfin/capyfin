/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CAPYFIN_BROWSER_SIDECAR_PASSWORD?: string;
  readonly VITE_CAPYFIN_BROWSER_SIDECAR_URL?: string;
  readonly VITE_CAPYFIN_BROWSER_SIDECAR_USERNAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
